import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import { getDb } from "@/lib/db"

export const sessionCookieName = "itb_session"

export interface SessionUser {
  userId: string
  email: string
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set")
  }
  return secret
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signSession(user: SessionUser): string {
  return jwt.sign(user, getJwtSecret(), { expiresIn: "7d", issuer: "internal-tools-builder" })
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { issuer: "internal-tools-builder" })
    if (typeof decoded === "object" && typeof decoded.userId === "string" && typeof decoded.email === "string") {
      return { userId: decoded.userId, email: decoded.email }
    }
  } catch {
    return null
  }
  return null
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(sessionCookieName)?.value
  return token ? verifySessionToken(token) : null
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) {
    throw new Error("Unauthorized")
  }
  return session
}

export async function requireWorkspaceAccess(userId: string, workspaceId: string): Promise<void> {
  const db = getDb()
  const membership = await db.workspaceMember.findUnique({ where: { userId_workspaceId: { userId, workspaceId } } })
  if (!membership) {
    throw new Error("Workspace access denied")
  }
}

export async function requireWorkspaceRole(userId: string, workspaceId: string, roles: string[]): Promise<void> {
  const db = getDb()
  const membership = await db.workspaceMember.findUnique({ where: { userId_workspaceId: { userId, workspaceId } } })
  if (!membership || !roles.includes(membership.role)) {
    throw new Error("Workspace access denied")
  }
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  })
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  })
}

export function getRequestSession(request: NextRequest): SessionUser | null {
  const token = request.cookies.get(sessionCookieName)?.value
  return token ? verifySessionToken(token) : null
}
