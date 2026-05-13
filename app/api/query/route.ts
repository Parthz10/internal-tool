import { NextResponse } from "next/server"
import { parseJson, routeError, jsonOk } from "@/lib/api"
import { requireSession, requireWorkspaceAccess } from "@/lib/auth"
import { runDataSourceQuery } from "@/lib/query-runner"
import { queryRequestSchema } from "@/lib/schema"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireSession()
    const input = await parseJson(request, queryRequestSchema)
    await requireWorkspaceAccess(session.userId, input.workspaceId)
    const result = await runDataSourceQuery(input)
    return jsonOk(result)
  } catch (error) {
    return routeError(error)
  }
}
