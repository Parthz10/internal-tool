"use client"

import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { checkoutSessionSchema } from "@/lib/schema"
import { useNotification } from "@/hooks/useNotification"

interface BillingForm {
  priceId: string
  mode: "payment" | "subscription"
}

export function BillingClient({
  workspaceId,
  workspaceName,
  hasStripeCustomer
}: {
  workspaceId: string
  workspaceName: string
  hasStripeCustomer: boolean
}): JSX.Element {
  const { notify } = useNotification()
  const { register, handleSubmit, formState } = useForm<BillingForm>({ defaultValues: { mode: "subscription" } })

  async function onSubmit(values: BillingForm): Promise<void> {
    const parsed = checkoutSessionSchema.safeParse({ ...values, workspaceId })
    if (!parsed.success) {
      notify(parsed.error.issues[0]?.message ?? "Check the billing details", "error")
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 8000)
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
      signal: controller.signal
    }).finally(() => window.clearTimeout(timer))

    if (!response.ok) {
      notify("Could not start checkout", "error")
      return
    }

    const payload = (await response.json()) as { url: string }
    window.location.assign(payload.url)
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Billing</h1>
      <section className="mt-6 rounded border border-neutral-800 p-5">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div>
            <h2 className="font-medium">{workspaceName}</h2>
            <p className="mt-1 text-sm text-neutral-400">{hasStripeCustomer ? "Stripe customer is linked." : "Stripe customer will be created at checkout."}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid gap-4">
          <label className="block text-sm text-neutral-300">
            Stripe price ID
            <Input className="mt-2 font-mono" {...register("priceId")} />
          </label>
          <label className="block text-sm text-neutral-300">
            Checkout mode
            <Select className="mt-2" {...register("mode")}>
              <option value="subscription">Subscription</option>
              <option value="payment">One-time payment</option>
            </Select>
          </label>
          <div>
            <Button disabled={formState.isSubmitting || !workspaceId}>Continue to Stripe</Button>
          </div>
        </form>
      </section>
    </main>
  )
}
