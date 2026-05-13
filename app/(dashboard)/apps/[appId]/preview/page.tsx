import { notFound } from "next/navigation"
import { RuntimeCanvas } from "@/components/runtime/RuntimeCanvas"
import { canvasStateSchema, emptyCanvas } from "@/lib/canvas-schema"
import { getDb } from "@/lib/db"
import { requireSession, requireWorkspaceAccess } from "@/lib/auth"

export default async function PreviewPage({ params }: { params: { appId: string } }): Promise<JSX.Element> {
  const session = await requireSession()
  const app = await getDb().app.findUnique({ where: { id: params.appId } })
  if (!app) notFound()
  await requireWorkspaceAccess(session.userId, app.workspaceId)
  const canvas = canvasStateSchema.safeParse(app.canvasJson).success ? canvasStateSchema.parse(app.canvasJson) : emptyCanvas
  return <RuntimeCanvas workspaceId={app.workspaceId} canvas={canvas} />
}
