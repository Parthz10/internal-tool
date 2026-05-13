"use client"

import { DndContext, useDraggable, type DragEndEvent } from "@dnd-kit/core"
import type { CSSProperties } from "react"
import { useRef } from "react"
import type { Block } from "@/lib/canvas-schema"
import { useCanvasStore } from "@/stores/canvas-store"
import { TableBlock } from "@/components/builder/components/TableBlock"
import { TextBlock } from "@/components/builder/components/TextBlock"
import { StatCardBlock } from "@/components/builder/components/StatCardBlock"
import { ButtonBlock } from "@/components/builder/components/ButtonBlock"
import { SelectBlock } from "@/components/builder/components/SelectBlock"

function BlockPreview({ block }: { block: Block }): JSX.Element {
  if (block.type === "text") return <TextBlock block={block} />
  if (block.type === "stat-card") return <StatCardBlock block={block} />
  if (block.type === "button") return <ButtonBlock block={block} />
  if (block.type === "select") return <SelectBlock block={block} />
  return <TableBlock block={block} />
}

function DraggableBlock({ block }: { block: Block }): JSX.Element {
  const selectedBlockId = useCanvasStore((state) => state.selectedBlockId)
  const selectBlock = useCanvasStore((state) => state.selectBlock)
  const updateBlock = useCanvasStore((state) => state.updateBlock)
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: block.id, data: { block } })
  const style: CSSProperties = {
    gridColumn: `${block.x} / span ${block.w}`,
    gridRow: `${block.y} / span ${block.h}`,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined
  }

  function resize(widthDelta: number, heightDelta: number): void {
    updateBlock(block.id, { w: Math.min(12, Math.max(1, block.w + widthDelta)), h: Math.max(1, block.h + heightDelta) })
  }

  return (
    <div ref={setNodeRef} style={style} className={`relative min-h-24 ${selectedBlockId === block.id ? "ring-2 ring-slate-400" : ""}`} onClick={() => selectBlock(block.id)}>
      <button type="button" className="absolute left-2 top-2 z-10 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-400" {...listeners} {...attributes} aria-label="Drag block">::</button>
      <BlockPreview block={block} />
      <button type="button" className="absolute bottom-2 right-2 h-6 w-6 rounded border border-neutral-700 bg-neutral-900 text-xs" onClick={() => resize(1, 1)} aria-label="Grow block">+</button>
      <button type="button" className="absolute bottom-2 right-10 h-6 w-6 rounded border border-neutral-700 bg-neutral-900 text-xs" onClick={() => resize(-1, -1)} aria-label="Shrink block">-</button>
    </div>
  )
}

export function Canvas(): JSX.Element {
  const gridRef = useRef<HTMLDivElement>(null)
  const blocks = useCanvasStore((state) => state.canvas.blocks)
  const updateBlock = useCanvasStore((state) => state.updateBlock)

  function onDragEnd(event: DragEndEvent): void {
    const block = event.active.data.current?.block as Block | undefined
    const grid = gridRef.current
    if (!block || !grid) return
    const rect = grid.getBoundingClientRect()
    const colWidth = rect.width / 12
    const rowHeight = 96
    const nextX = Math.min(12, Math.max(1, block.x + Math.round(event.delta.x / colWidth)))
    const nextY = Math.max(1, block.y + Math.round(event.delta.y / rowHeight))
    updateBlock(block.id, { x: nextX, y: nextY })
  }

  return (
    <DndContext onDragEnd={onDragEnd}>
      <div ref={gridRef} className="grid min-h-[calc(100vh-7rem)] flex-1 auto-rows-[96px] grid-cols-12 gap-3 overflow-auto bg-neutral-900 p-4">
        {blocks.map((block) => <DraggableBlock key={block.id} block={block} />)}
      </div>
    </DndContext>
  )
}
