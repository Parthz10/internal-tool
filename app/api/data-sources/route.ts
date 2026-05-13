import { NextResponse } from "next/server"
import { encrypt } from "@/lib/crypto"
import { getDb } from "@/lib/db"
import { jsonOk, parseJson, routeError } from "@/lib/api"
import { createDataSourceSchema, idSchema } from "@/lib/schema"
import { requireSession, requireWorkspaceAccess, requireWorkspaceRole } from "@/lib/auth"

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const session = await requireSession()
    const workspaceId = idSchema.parse(new URL(request.url).searchParams.get("workspaceId"))
    await requireWorkspaceAccess(session.userId, workspaceId)
    const dataSources = await getDb().dataSource.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, type: true, workspaceId: true, createdAt: true }
    })
    return jsonOk({ dataSources })
  } catch (error) {
    return routeError(error)
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireSession()
    const input = await parseJson(request, createDataSourceSchema)
    await requireWorkspaceRole(session.userId, input.workspaceId, ["owner"])
    const dataSource = await getDb().dataSource.create({
      data: {
        name: input.name,
        type: input.type,
        workspaceId: input.workspaceId,
        config: { encrypted: encrypt(JSON.stringify(input.config)) }
      },
      select: { id: true, name: true, type: true, workspaceId: true, createdAt: true }
    })
    return jsonOk({ dataSource }, 201)
  } catch (error) {
    return routeError(error)
  }
}
