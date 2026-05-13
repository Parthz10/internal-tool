import { getDb } from "@/lib/db"
import { requireSession } from "@/lib/auth"
import { DataSourcesClient } from "./DataSourcesClient"

export default async function DataSourcesPage(): Promise<JSX.Element> {
  const session = await requireSession()
  const workspace = await getDb().workspace.findFirst({
    where: { members: { some: { userId: session.userId } } },
    orderBy: { createdAt: "asc" },
    include: { dataSources: { orderBy: { createdAt: "desc" }, select: { id: true, name: true, type: true, workspaceId: true, createdAt: true } } }
  })
  return <DataSourcesClient workspaceId={workspace?.id ?? ""} initialDataSources={workspace?.dataSources.map((source) => ({ ...source, createdAt: source.createdAt.toISOString() })) ?? []} />
}
