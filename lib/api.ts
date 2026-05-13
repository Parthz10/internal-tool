import { NextResponse } from "next/server"
import { z, ZodError } from "zod"

export function jsonOk<T>(body: T, status = 200): NextResponse<T> {
  return NextResponse.json(body, { status })
}

export function jsonError(message: string, status = 400): NextResponse<{ error: string }> {
  return NextResponse.json({ error: message }, { status })
}

export async function parseJson<T>(request: Request, schema: z.ZodType<T, z.ZodTypeDef, unknown>): Promise<T> {
  const payload: unknown = await request.json().catch(() => {
    throw new Error("Invalid JSON body")
  })
  return schema.parse(payload)
}

function isSafeClientError(message: string): boolean {
  return [
    "Invalid JSON body",
    "Invalid email or password",
    "Data source not found",
    "App not found",
    "Workspace not found",
    "Unsupported data source type",
    "Mutations require an explicit mutation action",
    "Query execution timed out",
    "Blocked REST data source target",
    "REST data source paths must stay on the configured base URL"
  ].includes(message) || message.startsWith("Missing query parameter:")
}

export function routeError(error: unknown): NextResponse<{ error: string }> {
  if (error instanceof ZodError) {
    return jsonError(error.issues.map((issue) => {
      const field = issue.path.join(".")
      return field ? `${field}: ${issue.message}` : issue.message
    }).join("; "), 422)
  }
  if (error instanceof Error) {
    if (error.message === "Unauthorized") return jsonError("Unauthorized", 401)
    if (error.message.includes("access denied")) return jsonError("Forbidden", 403)
    if (error.message.includes("not found")) return jsonError("Not found", 404)
    if (isSafeClientError(error.message)) return jsonError(error.message, 400)
    return jsonError("Request failed", 400)
  }
  return jsonError("Request failed", 400)
}
