import { requireSession } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { BillingClient } from "./BillingClient"

export default async function BillingPage(): Promise<JSX.Element> {
  const session = await requireSession()
  const workspace = await getDb().workspace.findFirst({
    where: { members: { some: { userId: session.userId } } },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, stripeCustomerId: true }
  })

  return (
    <BillingClient
      workspaceId={workspace?.id ?? ""}
      workspaceName={workspace?.name ?? "Workspace"}
      hasStripeCustomer={Boolean(workspace?.stripeCustomerId)}
    />
  )
}
