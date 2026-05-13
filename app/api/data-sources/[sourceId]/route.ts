import { NextResponse } from "next/server"
import { encrypt } from "@/lib/crypto"
import { getDb } from "@/lib/db"
import { jsonOk, parseJson, routeError } from "@/lib/api"
import { idSchema, updateDataSourceSchema } from "@/lib/schema"
import { requireSession, requireWorkspaceRole } from "@/lib/auth"

interface RouteContext {
  params: { sourceId: string }
}

export async function PATCH(request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await requireSession()
    const sourceId = idSchema.parse(context.params.sourceId)
    const input = await parseJson(request, updateDataSourceSchema)
    await requireWorkspaceRole(session.userId, input.workspaceId, ["owner"])
    const dataSource = await getDb().dataSource.update({
      where: { id: sourceId, workspaceId: input.workspaceId },
      data: {
        name: input.name,
        type: input.type,
        config: input.config ? { encrypted: encrypt(JSON.stringify(input.config)) } : undefined
      },
      select: { id: true, name: true, type: true, workspaceId: true, createdAt: true }
    })
    return jsonOk({ dataSource })
  } catch (error) {
    return routeError(error)
  }
}

export async function DELETE(request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await requireSession()
    const sourceId = idSchema.parse(context.params.sourceId)
    const workspaceId = idSchema.parse(new URL(request.url).searchParams.get("workspaceId"))
    await requireWorkspaceRole(session.userId, workspaceId, ["owner"])
    await getDb().dataSource.delete({ where: { id: sourceId, workspaceId } })
    return jsonOk({ ok: true })
  } catch (error) {
    return routeError(error)
  }
}
