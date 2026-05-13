import { NextResponse } from "next/server"
import { hashPassword, setSessionCookie, signSession } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { parseJson, routeError } from "@/lib/api"
import { registerSchema, slugify } from "@/lib/schema"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const input = await parseJson(request, registerSchema)
    const db = getDb()
    const passwordHash = await hashPassword(input.password)
    const baseSlug = slugify(input.workspaceName)
    const workspaceSlug = baseSlug || "workspace"
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email: input.email, passwordHash } })
      const workspace = await tx.workspace.create({
        data: {
          name: input.workspaceName,
          slug: `${workspaceSlug}-${user.id.slice(-6)}`,
          members: { create: { userId: user.id, role: "owner" } }
        }
      })
      return { user, workspace }
    })
    const response = NextResponse.json({
      user: { id: result.user.id, email: result.user.email },
      workspace: { id: result.workspace.id, name: result.workspace.name, slug: result.workspace.slug }
    }, { status: 201 })
    setSessionCookie(response, signSession({ userId: result.user.id, email: result.user.email }))
    return response
  } catch (error) {
    return routeError(error)
  }
}
