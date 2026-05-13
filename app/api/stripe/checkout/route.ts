import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { parseJson, routeError, jsonOk } from "@/lib/api"
import { requireSession, requireWorkspaceRole } from "@/lib/auth"
import { checkoutSessionSchema } from "@/lib/schema"
import { getStripe } from "@/lib/stripe"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await requireSession()
    const input = await parseJson(request, checkoutSessionSchema)
    await requireWorkspaceRole(session.userId, input.workspaceId, ["owner"])

    const db = getDb()
    const workspace = await db.workspace.findFirst({
      where: { id: input.workspaceId, members: { some: { userId: session.userId } } },
      select: { id: true, name: true, stripeCustomerId: true }
    })
    if (!workspace) throw new Error("Workspace not found")

    const stripe = getStripe()
    let customerId = workspace.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: workspace.name,
        metadata: { workspaceId: workspace.id }
      })
      customerId = customer.id
      await db.workspace.update({
        where: { id: workspace.id },
        data: { stripeCustomerId: customerId }
      })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL must be set")

    const checkout = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: input.mode,
      line_items: [{ price: input.priceId, quantity: 1 }],
      success_url: `${appUrl}/settings/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/settings/billing?checkout=cancelled`,
      metadata: { workspaceId: workspace.id }
    })

    if (!checkout.url) throw new Error("Stripe did not return a checkout URL")
    return jsonOk({ url: checkout.url })
  } catch (error) {
    return routeError(error)
  }
}
