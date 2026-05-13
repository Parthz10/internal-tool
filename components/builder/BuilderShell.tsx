"use client"

import { useEffect } from "react"
import { Canvas } from "@/components/builder/Canvas"
import { ComponentPanel } from "@/components/builder/ComponentPanel"
import { PropertiesPanel, type DataSourceOption } from "@/components/builder/PropertiesPanel"
import { Toolbar } from "@/components/builder/Toolbar"
import type { CanvasState } from "@/lib/canvas-schema"
import { canvasStateSchema } from "@/lib/canvas-schema"
import { useCanvasStore } from "@/stores/canvas-store"
import { useNotification } from "@/hooks/useNotification"

export function BuilderShell({ appId, workspaceId, initialCanvas, dataSources }: { appId: string; workspaceId: string; initialCanvas: CanvasState; dataSources: DataSourceOption[] }): JSX.Element {
  const { notify } = useNotification()
  const setContext = useCanvasStore((state) => state.setContext)
  const canvas = useCanvasStore((state) => state.canvas)

  useEffect(() => {
    setContext(appId, workspaceId, initialCanvas)
  }, [appId, workspaceId, initialCanvas, setContext])

  useEffect(() => {
    if (!appId || !workspaceId) return undefined
    const parsed = canvasStateSchema.safeParse(canvas)
    if (!parsed.success) return undefined
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      fetch(`/api/apps/${appId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workspaceId, canvasJson: parsed.data }),
        signal: controller.signal
      }).then((response) => {
        if (!response.ok) notify("Autosave failed", "error")
      }).catch(() => notify("Autosave failed", "error"))
    }, 1000)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [appId, workspaceId, canvas, notify])

  return (
    <main className="flex h-[calc(100vh-3.5rem)] flex-col">
      <Toolbar />
      <div className="flex min-h-0 flex-1">
        <ComponentPanel />
        <Canvas />
        <PropertiesPanel dataSources={dataSources} />
      </div>
    </main>
  )
}
