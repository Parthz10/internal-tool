import { NextResponse, type NextRequest } from "next/server"

const publicApi = ["/api/auth/login", "/api/auth/register", "/api/auth/logout"]
const sessionCookieName = "itb_session"

export function middleware(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname
  const protectedRoute = pathname.startsWith("/dashboard") || (pathname.startsWith("/api") && !publicApi.some((route) => pathname.startsWith(route)))
  if (!protectedRoute) return NextResponse.next()
  if (request.cookies.has(sessionCookieName)) return NextResponse.next()
  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const loginUrl = new URL("/login", request.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"]
}
