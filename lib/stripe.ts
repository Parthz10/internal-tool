import Stripe from "stripe"

let stripeClient: Stripe | null = null

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || !key.startsWith("sk_")) {
    throw new Error("STRIPE_SECRET_KEY must be set")
  }
  return key
}

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey(), {
      apiVersion: "2026-04-22.dahlia",
      typescript: true
    })
  }
  return stripeClient
}

export function getPublishableStripeKey(): string {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key || !key.startsWith("pk_")) {
    throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must be set")
  }
  return key
}
