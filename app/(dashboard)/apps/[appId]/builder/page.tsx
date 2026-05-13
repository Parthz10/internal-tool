import { notFound } from "next/navigation"
import { BuilderShell } from "@/components/builder/BuilderShell"
import { canvasStateSchema, emptyCanvas } from "@/lib/canvas-schema"
import { getDb } from "@/lib/db"
import { requireSession, requireWorkspaceAccess } from "@/lib/auth"

export default async function BuilderPage({ params }: { params: { appId: string } }): Promise<JSX.Element> {
  const session = await requireSession()
  const app = await getDb().app.findUnique({
    where: { id: params.appId },
    include: { workspace: { include: { dataSources: { select: { id: true, name: true, type: true } } } } }
  })
  if (!app) notFound()
  await requireWorkspaceAccess(session.userId, app.workspaceId)
  const initialCanvas = canvasStateSchema.safeParse(app.canvasJson).success ? canvasStateSchema.parse(app.canvasJson) : emptyCanvas
  return <BuilderShell appId={app.id} workspaceId={app.workspaceId} initialCanvas={initialCanvas} dataSources={app.workspace.dataSources} />
}
