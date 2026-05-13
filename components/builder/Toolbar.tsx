"use client"

import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { useCanvasStore } from "@/stores/canvas-store"
import { useNotification } from "@/hooks/useNotification"

export function Toolbar(): JSX.Element {
  const { undo, redo, appId, workspaceId } = useCanvasStore((state) => ({ undo: state.undo, redo: state.redo, appId: state.appId, workspaceId: state.workspaceId }))
  const { notify } = useNotification()

  async function publish(): Promise<void> {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 8000)
    const response = await fetch(`/api/apps/${appId}/publish?workspaceId=${workspaceId}`, { method: "POST", signal: controller.signal }).finally(() => window.clearTimeout(timer))
    notify(response.ok ? "Published" : "Publish failed", response.ok ? "success" : "error")
  }

  return (
    <header className="flex h-12 items-center justify-between border-b border-neutral-800 px-4">
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={undo}>Undo</Button>
        <Button type="button" variant="secondary" onClick={redo}>Redo</Button>
      </div>
      <div className="flex gap-2">
        <Link href={`/apps/${appId}/preview`}><Button type="button" variant="secondary">Preview</Button></Link>
        <Button type="button" onClick={publish}>Publish</Button>
      </div>
    </header>
  )
}
