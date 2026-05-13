"use client"

import { createContext, useContext, useMemo, useState } from "react"
import type { CanvasState } from "@/lib/canvas-schema"
import { RuntimeBlock } from "@/components/runtime/RuntimeBlock"

interface RuntimeContextValue {
  workspaceId: string
  variables: Record<string, unknown>
  setVariable: (id: string, value: unknown) => void
}

const RuntimeContext = createContext<RuntimeContextValue | null>(null)

export function useRuntimeContext(): RuntimeContextValue {
  const value = useContext(RuntimeContext)
  if (!value) throw new Error("Runtime context is missing")
  return value
}

export function RuntimeCanvas({ workspaceId, canvas }: { workspaceId: string; canvas: CanvasState }): JSX.Element {
  const [variables, setVariables] = useState<Record<string, unknown>>(canvas.variables)
  const value = useMemo<RuntimeContextValue>(() => ({
    workspaceId,
    variables,
    setVariable: (id, nextValue) => setVariables((current) => ({ ...current, [id]: nextValue }))
  }), [workspaceId, variables])

  return (
    <RuntimeContext.Provider value={value}>
      <div className="grid min-h-screen auto-rows-[96px] grid-cols-12 gap-3 bg-neutral-900 p-4">
        {canvas.blocks.map((block) => (
          <RuntimeBlock key={block.id} block={block} />
        ))}
      </div>
    </RuntimeContext.Provider>
  )
}
