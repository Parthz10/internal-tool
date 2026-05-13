import { NextResponse } from "next/server"
import { runDataSourceQuery } from "@/lib/query-runner"
import { jsonOk, parseJson, routeError } from "@/lib/api"
import { idSchema } from "@/lib/schema"
import { requireSession, requireWorkspaceAccess } from "@/lib/auth"
import { z } from "zod"

interface RouteContext {
  params: { sourceId: string }
}

const testSchema = z.object({
  workspaceId: idSchema,
  query: z.string().trim().min(1).max(1000).default("select 1 as ok")
})

export async function POST(request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    const session = await requireSession()
    const sourceId = idSchema.parse(context.params.sourceId)
    const input = await parseJson(request, testSchema)
    await requireWorkspaceAccess(session.userId, input.workspaceId)
    const result = await runDataSourceQuery({
      workspaceId: input.workspaceId,
      sourceId,
      query: input.query,
      params: {},
      mutation: false,
      page: 1,
      pageSize: 1
    })
    return jsonOk({ ok: true, rows: result.rows })
  } catch (error) {
    return routeError(error)
  }
}
