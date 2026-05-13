import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { jsonOk, parseJson, routeError } from "@/lib/api"
import { createWorkspaceSchema, slugify } from "@/lib/schema"
import { requireSession } from "@/lib/auth"

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireSession()
    const workspaces = await getDb().workspace.findMany({
      where: { members: { some: { userId: session.userId } } },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, slug: true, createdAt: true }
    })
    return jsonOk({ workspaces })
  } catch (error) {
    return routeError(error)
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireSession()
    const input = await parseJson(request, createWorkspaceSchema)
    const db = getDb()
    const workspace = await db.workspace.create({
      data: {
        name: input.name,
        slug: `${slugify(input.name) || "workspace"}-${session.userId.slice(-6)}`,
        members: { create: { userId: session.userId, role: "owner" } }
      },
      select: { id: true, name: true, slug: true, createdAt: true }
    })
    return jsonOk({ workspace }, 201)
  } catch (error) {
    return routeError(error)
  }
}
