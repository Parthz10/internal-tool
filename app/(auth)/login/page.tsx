"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { loginSchema } from "@/lib/schema"
import { useNotification } from "@/hooks/useNotification"

interface LoginForm {
  email: string
  password: string
}

export default function LoginPage(): JSX.Element {
  const router = useRouter()
  const { notify } = useNotification()
  const { register, handleSubmit, formState } = useForm<LoginForm>()

  async function onSubmit(values: LoginForm): Promise<void> {
    const parsed = loginSchema.safeParse(values)
    if (!parsed.success) {
      notify(parsed.error.issues[0]?.message ?? "Check your entries", "error")
      return
    }
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
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-900 px-4">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-sm space-y-5 rounded border border-neutral-800 bg-neutral-900 p-6">
        <div>
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-neutral-400">Access your internal tools workspace.</p>
        </div>
        <label className="block text-sm text-neutral-300">Email<Input className="mt-2" type="email" autoComplete="email" required {...register("email")} /></label>
        <label className="block text-sm text-neutral-300">Password<Input className="mt-2" type="password" autoComplete="current-password" required {...register("password")} /></label>
        <Button className="w-full" disabled={formState.isSubmitting}>Sign in</Button>
        <p className="text-center text-sm text-neutral-400">New workspace? <Link className="text-slate-300 hover:text-white" href="/register">Create an account</Link></p>
      </form>
    </main>
  )
}
