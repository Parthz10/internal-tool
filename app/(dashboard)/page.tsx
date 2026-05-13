import Link from "next/link"
import { getDb } from "@/lib/db"
import { requireSession } from "@/lib/auth"
import { Button } from "@/components/ui/Button"

export default async function WorkspaceHomePage(): Promise<JSX.Element> {
  const session = await requireSession()
  const workspace = await getDb().workspace.findFirst({
    where: { members: { some: { userId: session.userId } } },
    orderBy: { createdAt: "asc" },
    include: { apps: { orderBy: { updatedAt: "desc" } } }
  })

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{workspace?.name ?? "Workspace"}</h1>
          <p className="mt-1 text-sm text-neutral-400">Build and publish operational dashboards.</p>
        </div>
        {workspace ? <Link href={`/apps/new?workspaceId=${workspace.id}`}><Button>New app</Button></Link> : null}
      </div>
      <section className="mt-8 grid gap-3">
        {!workspace || workspace.apps.length === 0 ? (
          <div className="rounded border border-neutral-800 p-8 text-sm text-neutral-400">No apps yet.</div>
        ) : workspace.apps.map((app) => (
          <Link key={app.id} href={`/apps/${app.id}/builder`} className="flex items-center justify-between rounded border border-neutral-800 bg-neutral-900 p-4 hover:bg-neutral-800">
            <div>
              <h2 className="font-medium">{app.name}</h2>
              <p className="mt-1 text-xs text-neutral-500">{app.published ? "Published" : "Draft"} · Updated {app.updatedAt.toLocaleDateString()}</p>
            </div>
            <span className="text-sm text-slate-300">Open builder</span>
          </Link>
        ))}
      </section>
    </main>
  )
}
