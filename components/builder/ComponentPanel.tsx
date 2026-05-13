"use client"

import type { BlockType } from "@/lib/canvas-schema"
import { Button } from "@/components/ui/Button"
import { useCanvasStore } from "@/stores/canvas-store"

const blocks: Array<{ type: BlockType; label: string }> = [
  { type: "table", label: "Table" },
  { type: "stat-card", label: "Stat card" },
  { type: "text", label: "Text" },
  { type: "button", label: "Button" },
  { type: "select", label: "Select" }
]

export function ComponentPanel(): JSX.Element {
  const addBlock = useCanvasStore((state) => state.addBlock)
  return (
    <aside className="w-64 border-r border-neutral-800 p-4">
      <h2 className="text-sm font-semibold">Components</h2>
      <div className="mt-4 grid gap-2">
        {blocks.map((block) => <Button key={block.type} type="button" variant="secondary" onClick={() => addBlock(block.type)}>{block.label}</Button>)}
      </div>
    </aside>
  )
}
