import { requireSession } from "@/lib/auth"
import { getDb } from "@/lib/db"

export default async function SettingsPage(): Promise<JSX.Element> {
  const session = await requireSession()
  const memberships = await getDb().workspaceMember.findMany({
    where: { userId: session.userId },
    include: { workspace: true },
    orderBy: { workspace: { createdAt: "asc" } }
  })
  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Workspace settings</h1>
      <div className="mt-6 divide-y divide-neutral-800 rounded border border-neutral-800">
        {memberships.map((membership) => (
          <div key={membership.workspaceId} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{membership.workspace.name}</p>
              <p className="text-sm text-neutral-500">{membership.workspace.slug}</p>
            </div>
            <span className="rounded border border-neutral-700 px-2 py-1 text-xs text-neutral-300">{membership.role}</span>
          </div>
        ))}
      </div>
    </main>
  )
}
