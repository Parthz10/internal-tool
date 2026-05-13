"use client"

import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import type { Block, BlockType, CanvasState } from "@/lib/canvas-schema"
import { emptyCanvas } from "@/lib/canvas-schema"

interface CanvasStore {
  appId: string
  workspaceId: string
  selectedBlockId: string | null
  canvas: CanvasState
  past: CanvasState[]
  future: CanvasState[]
  setContext: (appId: string, workspaceId: string, canvas: CanvasState) => void
  selectBlock: (id: string | null) => void
  addBlock: (type: BlockType) => void
  updateBlock: (id: string, patch: Partial<Block>) => void
  removeBlock: (id: string) => void
  undo: () => void
  redo: () => void
}

function createCuid(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789"
  const seed = Date.now().toString(36)
  let suffix = ""
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  for (const byte of bytes) suffix += alphabet[byte % alphabet.length]
  return `c${seed}${suffix}`.slice(0, 25)
}

function defaultBlock(type: BlockType): Block {
  const base = { id: createCuid(), type, x: 1, y: 1, w: 4, h: 3, label: type }
  if (type === "text") return { ...base, type, content: "Operational note" }
  if (type === "button") return { ...base, type, label: "Run action", action: { type: "mutation", sourceId: createCuid(), query: "select 1 as value", method: "POST" } }
  if (type === "select") return { ...base, type, binding: { sourceId: createCuid(), query: "select 1 as id, 'Option' as name" }, valueKey: "id", labelKey: "name" }
  if (type === "stat-card") return { ...base, type, binding: { sourceId: createCuid(), query: "select 1 as value" }, valueKey: "value" }
  return { ...base, type, binding: { sourceId: createCuid(), query: "select 1 as value" }, columns: [{ key: "value", label: "Value" }] }
}

function commit(state: CanvasStore, canvas: CanvasState): Pick<CanvasStore, "canvas" | "past" | "future"> {
  return { canvas, past: [...state.past.slice(-49), state.canvas], future: [] }
}

export const useCanvasStore = create<CanvasStore>()(subscribeWithSelector((set) => ({
  appId: "",
  workspaceId: "",
  selectedBlockId: null,
  canvas: emptyCanvas,
  past: [],
  future: [],
  setContext: (appId, workspaceId, canvas) => set({ appId, workspaceId, canvas, past: [], future: [], selectedBlockId: null }),
  selectBlock: (id) => set({ selectedBlockId: id }),
  addBlock: (type) => set((state) => {
    const block = defaultBlock(type)
    return { ...commit(state, { ...state.canvas, blocks: [...state.canvas.blocks, block] }), selectedBlockId: block.id }
  }),
  updateBlock: (id, patch) => set((state) => commit(state, {
    ...state.canvas,
    blocks: state.canvas.blocks.map((block) => block.id === id ? ({ ...block, ...patch } as Block) : block)
  })),
  removeBlock: (id) => set((state) => ({ ...commit(state, { ...state.canvas, blocks: state.canvas.blocks.filter((block) => block.id !== id) }), selectedBlockId: null })),
  undo: () => set((state) => {
    const previous = state.past.at(-1)
    if (!previous) return state
    return { canvas: previous, past: state.past.slice(0, -1), future: [state.canvas, ...state.future].slice(0, 50) }
  }),
  redo: () => set((state) => {
    const next = state.future[0]
    if (!next) return state
    return { canvas: next, past: [...state.past.slice(-49), state.canvas], future: state.future.slice(1) }
  })
})))
