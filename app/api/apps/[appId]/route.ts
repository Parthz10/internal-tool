import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { getDb } from "@/lib/db"
import { jsonOk, parseJson, routeError } from "@/lib/api"
import { idSchema, updateAppSchema } from "@/lib/schema"
import { requireSession, requireWorkspaceAccess, requireWorkspaceRole } from "@/lib/auth"

interface RouteContext {
  params: { appId: string }
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await requireSession()
    const appId = idSchema.parse(context.params.appId)
    const app = await getDb().app.findFirst({ where: { id: appId } })
    if (!app) throw new Error("App not found")
    await requireWorkspaceAccess(session.userId, app.workspaceId)
    return jsonOk({ app })
  } catch (error) {
    return routeError(error)
  }
}

export async function PATCH(request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await requireSession()
    const appId = idSchema.parse(context.params.appId)
    const input = await parseJson(request, updateAppSchema)
    await requireWorkspaceAccess(session.userId, input.workspaceId)
    const app = await getDb().app.update({
      where: { id: appId, workspaceId: input.workspaceId },
      data: { name: input.name, canvasJson: input.canvasJson ? JSON.parse(JSON.stringify(input.canvasJson)) as Prisma.InputJsonValue : undefined }
    })
    return jsonOk({ app })
  } catch (error) {
    return routeError(error)
  }
}

export async function DELETE(request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await requireSession()
    const appId = idSchema.parse(context.params.appId)
    const workspaceId = idSchema.parse(new URL(request.url).searchParams.get("workspaceId"))
    await requireWorkspaceRole(session.userId, workspaceId, ["owner"])
    await getDb().app.delete({ where: { id: appId, workspaceId } })
    return jsonOk({ ok: true })
  } catch (error) {
    return routeError(error)
  }
}
