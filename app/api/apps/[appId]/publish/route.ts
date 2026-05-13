import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { jsonOk, routeError } from "@/lib/api"
import { idSchema } from "@/lib/schema"
import { requireSession, requireWorkspaceRole } from "@/lib/auth"

interface RouteContext {
  params: { appId: string }
}

export async function POST(request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await requireSession()
    const appId = idSchema.parse(context.params.appId)
    const workspaceId = idSchema.parse(new URL(request.url).searchParams.get("workspaceId"))
    await requireWorkspaceRole(session.userId, workspaceId, ["owner"])
    const app = await getDb().app.update({ where: { id: appId, workspaceId }, data: { published: true } })
    return jsonOk({ app })
  } catch (error) {
    return routeError(error)
  }
}
