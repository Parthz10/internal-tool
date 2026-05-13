import { NextResponse } from "next/server"
import { parseJson, routeError, jsonError } from "@/lib/api"
import { setSessionCookie, signSession, verifyPassword } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { loginSchema } from "@/lib/schema"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const input = await parseJson(request, loginSchema)
    const user = await getDb().user.findUnique({ where: { email: input.email } })
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      return jsonError("Invalid email or password", 401)
    }
    const response = NextResponse.json({ user: { id: user.id, email: user.email } })
    setSessionCookie(response, signSession({ userId: user.id, email: user.email }))
    return response
  } catch (error) {
    return routeError(error)
  }
}
