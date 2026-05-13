import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { emptyCanvas } from "@/lib/canvas-schema"
import { getDb } from "@/lib/db"
import { jsonOk, parseJson, routeError } from "@/lib/api"
import { createAppSchema, idSchema, slugify } from "@/lib/schema"
import { requireSession, requireWorkspaceAccess } from "@/lib/auth"

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await requireSession()
    const workspaceId = idSchema.parse(new URL(request.url).searchParams.get("workspaceId"))
    await requireWorkspaceAccess(session.userId, workspaceId)
    const apps = await getDb().app.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, slug: true, published: true, updatedAt: true, createdAt: true, workspaceId: true }
    })
    return jsonOk({ apps })
  } catch (error) {
    return routeError(error)
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireSession()
    const input = await parseJson(request, createAppSchema)
    await requireWorkspaceAccess(session.userId, input.workspaceId)
    const app = await getDb().app.create({
      data: {
        name: input.name,
        slug: `${slugify(input.name) || "app"}-${Date.now().toString(36)}`,
        workspaceId: input.workspaceId,
        canvasJson: JSON.parse(JSON.stringify(emptyCanvas)) as Prisma.InputJsonValue
      }
    })
    return jsonOk({ app }, 201)
  } catch (error) {
    return routeError(error)
  }
}
