"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { createAppSchema } from "@/lib/schema"
import { useNotification } from "@/hooks/useNotification"

interface AppForm {
  name: string
}

export default function NewAppPage(): JSX.Element {
  const router = useRouter()
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get("workspaceId") ?? ""
  const { notify } = useNotification()
  const { register, handleSubmit, formState } = useForm<AppForm>()

  async function onSubmit(values: AppForm): Promise<void> {
    const parsed = createAppSchema.safeParse({ ...values, workspaceId })
    if (!parsed.success) {
      notify(parsed.error.issues[0]?.message ?? "Check the app details", "error")
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 8000)
    const response = await fetch("/api/apps", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
      signal: controller.signal
    }).finally(() => window.clearTimeout(timer))
    if (!response.ok) {
      notify("Could not create app", "error")
      return
    }
    const payload = (await response.json()) as { app: { id: string } }
    router.push(`/apps/${payload.app.id}/builder`)
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-8">
      <h1 className="text-2xl font-semibold">New app</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5 rounded border border-neutral-800 p-5">
        <label className="block text-sm text-neutral-300">Name<Input className="mt-2" {...register("name")} /></label>
        <Button disabled={formState.isSubmitting}>Create app</Button>
      </form>
    </main>
  )
}
