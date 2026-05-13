"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { loginSchema } from "@/lib/schema"
import { useNotification } from "@/hooks/useNotification"

export default function LoginPage(): JSX.Element {
  const router = useRouter()
  const { notify } = useNotification()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      notify(parsed.error.issues[0]?.message ?? "Check your entries", "error")
      return
    }
    setSubmitting(true)
    try {
      const controller = new AbortController()
      const timer = window.setTimeout(() => controller.abort(), 8000)
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
        signal: controller.signal
      }).finally(() => window.clearTimeout(timer))
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        notify(payload?.error ?? "Invalid email or password", "error")
        return
      }
      router.push("/")
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-900 px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5 rounded border border-neutral-800 bg-neutral-900 p-6">
        <div>
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-neutral-400">Access your internal tools workspace.</p>
        </div>
        <label className="block text-sm text-neutral-300">Email<Input className="mt-2" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="block text-sm text-neutral-300">Password<Input className="mt-2" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <Button className="w-full" disabled={submitting}>Sign in</Button>
        <p className="text-center text-sm text-neutral-400">New workspace? <Link className="text-slate-300 hover:text-white" href="/register">Create an account</Link></p>
      </form>
    </main>
  )
}
