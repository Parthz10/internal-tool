"use client"

import type { Block } from "@/lib/canvas-schema"
import { Input, Textarea } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Button } from "@/components/ui/Button"
import { useCanvasStore } from "@/stores/canvas-store"

export interface DataSourceOption {
  id: string
  name: string
  type: string
}

function parseColumns(value: string): Array<{ key: string; label: string; width?: number }> {
  const parsed: unknown = JSON.parse(value)
  if (!Array.isArray(parsed)) return []
  return parsed.flatMap((item) => {
    if (typeof item !== "object" || item === null) return []
    const candidate = item as Record<string, unknown>
    if (typeof candidate.key !== "string" || typeof candidate.label !== "string") return []
    return [{ key: candidate.key, label: candidate.label, width: typeof candidate.width === "number" ? candidate.width : undefined }]
  })
}

export function PropertiesPanel({ dataSources }: { dataSources: DataSourceOption[] }): JSX.Element {
  const selectedBlockId = useCanvasStore((state) => state.selectedBlockId)
  const block = useCanvasStore((state) => state.canvas.blocks.find((item) => item.id === selectedBlockId) ?? null)
  const updateBlock = useCanvasStore((state) => state.updateBlock)
  const removeBlock = useCanvasStore((state) => state.removeBlock)

  if (!block) {
    return <aside className="w-80 border-l border-neutral-800 p-4 text-sm text-neutral-400">Select a block to edit its properties.</aside>
  }

  function patch(patchValue: Partial<Block>): void {
    if (block) updateBlock(block.id, patchValue)
  }

  return (
    <aside className="w-80 overflow-auto border-l border-neutral-800 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Properties</h2>
        <Button type="button" variant="danger" onClick={() => removeBlock(block.id)}>Delete</Button>
      </div>
      <div className="mt-4 space-y-4">
        <label className="block text-sm text-neutral-300">Label<Input className="mt-2" value={block.label ?? ""} onChange={(event) => patch({ label: event.target.value })} /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm text-neutral-300">X<Input className="mt-2" type="number" min={1} max={12} value={block.x} onChange={(event) => patch({ x: Number(event.target.value) })} /></label>
          <label className="text-sm text-neutral-300">Y<Input className="mt-2" type="number" min={1} value={block.y} onChange={(event) => patch({ y: Number(event.target.value) })} /></label>
          <label className="text-sm text-neutral-300">W<Input className="mt-2" type="number" min={1} max={12} value={block.w} onChange={(event) => patch({ w: Number(event.target.value) })} /></label>
          <label className="text-sm text-neutral-300">H<Input className="mt-2" type="number" min={1} value={block.h} onChange={(event) => patch({ h: Number(event.target.value) })} /></label>
        </div>
        {block.type === "text" ? <label className="block text-sm text-neutral-300">Content<Textarea className="mt-2" value={block.content} onChange={(event) => patch({ content: event.target.value } as Partial<Block>)} /></label> : null}
        {block.type === "button" ? (
          <>
            <label className="block text-sm text-neutral-300">Button label<Input className="mt-2" value={block.label} onChange={(event) => patch({ label: event.target.value } as Partial<Block>)} /></label>
            <label className="block text-sm text-neutral-300">Action source<Select className="mt-2" value={block.action.sourceId} onChange={(event) => patch({ action: { ...block.action, sourceId: event.target.value } } as Partial<Block>)}>{dataSources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}</Select></label>
            <label className="block text-sm text-neutral-300">Query<Textarea className="mt-2" value={block.action.query} onChange={(event) => patch({ action: { ...block.action, query: event.target.value } } as Partial<Block>)} /></label>
          </>
        ) : null}
        {"binding" in block ? (
          <>
            <label className="block text-sm text-neutral-300">Data source<Select className="mt-2" value={block.binding.sourceId} onChange={(event) => patch({ binding: { ...block.binding, sourceId: event.target.value } } as Partial<Block>)}>{dataSources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}</Select></label>
            <label className="block text-sm text-neutral-300">Query or path<Textarea className="mt-2" value={block.binding.query} onChange={(event) => patch({ binding: { ...block.binding, query: event.target.value } } as Partial<Block>)} /></label>
          </>
        ) : null}
        {block.type === "table" ? <label className="block text-sm text-neutral-300">Columns JSON<Textarea className="mt-2" value={JSON.stringify(block.columns, null, 2)} onChange={(event) => patch({ columns: parseColumns(event.target.value) } as Partial<Block>)} /></label> : null}
        {block.type === "stat-card" ? <label className="block text-sm text-neutral-300">Value key<Input className="mt-2" value={block.valueKey} onChange={(event) => patch({ valueKey: event.target.value } as Partial<Block>)} /></label> : null}
        {block.type === "select" ? (
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm text-neutral-300">Value key<Input className="mt-2" value={block.valueKey} onChange={(event) => patch({ valueKey: event.target.value } as Partial<Block>)} /></label>
            <label className="text-sm text-neutral-300">Label key<Input className="mt-2" value={block.labelKey} onChange={(event) => patch({ labelKey: event.target.value } as Partial<Block>)} /></label>
          </div>
        ) : null}
      </div>
    </aside>
  )
}
