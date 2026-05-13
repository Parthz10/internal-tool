"use client"

import useSWR from "swr"
import type { CSSProperties } from "react"
import type { Block, DataBinding } from "@/lib/canvas-schema"
import { Button } from "@/components/ui/Button"
import { Select } from "@/components/ui/Select"
import { Table } from "@/components/ui/Table"
import { useNotification } from "@/hooks/useNotification"
import { useRuntimeContext } from "@/components/runtime/RuntimeCanvas"

interface QueryPayload {
  rows: Record<string, unknown>[]
}

function resolveParams(params: Record<string, string> | undefined, variables: Record<string, unknown>): Record<string, string | number | boolean | null> {
  const resolved: Record<string, string | number | boolean | null> = {}
  Object.entries(params ?? {}).forEach(([key, variableName]) => {
    const value = variables[variableName.replace(/^\$/, "")]
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
      resolved[key] = value
    }
  })
  return resolved
}

async function queryFetcher(key: string): Promise<QueryPayload> {
  const payload = JSON.parse(key) as Record<string, unknown>
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 8000)
  const response = await fetch("/api/query", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    signal: controller.signal
  }).finally(() => window.clearTimeout(timer))
  if (!response.ok) throw new Error("Query failed")
  return response.json() as Promise<QueryPayload>
}

function useBinding(binding: DataBinding | undefined): { rows: Record<string, unknown>[]; isLoading: boolean } {
  const { workspaceId, variables } = useRuntimeContext()
  const key = binding ? JSON.stringify({
    workspaceId,
    sourceId: binding.sourceId,
    query: binding.query,
    method: binding.method,
    params: resolveParams(binding.params, variables),
    mutation: false,
    page: 1,
    pageSize: 100
  }) : null
  const { data, isLoading } = useSWR(key, queryFetcher)
  return { rows: data?.rows ?? [], isLoading }
}

export function RuntimeBlock({ block }: { block: Block }): JSX.Element {
  const { workspaceId, variables, setVariable } = useRuntimeContext()
  const { notify } = useNotification()
  const style: CSSProperties = { gridColumn: `${block.x} / span ${block.w}`, gridRow: `${block.y} / span ${block.h}` }
  const binding = "binding" in block ? block.binding : undefined
  const { rows, isLoading } = useBinding(binding)

  async function runAction(): Promise<void> {
    if (block.type !== "button") return
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 8000)
    const response = await fetch("/api/query", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workspaceId,
        sourceId: block.action.sourceId,
        query: block.action.query,
        method: block.action.method,
        params: resolveParams(block.action.params, variables),
        mutation: true,
        page: 1,
        pageSize: 100
      }),
      signal: controller.signal
    }).finally(() => window.clearTimeout(timer))
    notify(response.ok ? "Action completed" : "Action failed", response.ok ? "success" : "error")
  }

  if (block.type === "text") {
    return <div style={style} className="overflow-auto rounded border border-neutral-800 bg-neutral-950 p-4 text-sm whitespace-pre-wrap">{block.content}</div>
  }
  if (block.type === "button") {
    return <div style={style} className="flex items-center rounded border border-neutral-800 bg-neutral-950 p-4"><Button type="button" onClick={runAction}>{block.label}</Button></div>
  }
  if (block.type === "select") {
    return (
      <label style={style} className="block rounded border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-300">
        {block.label ?? "Select"}
        <Select className="mt-2" value={String(variables[block.id] ?? "")} onChange={(event) => setVariable(block.id, event.target.value)}>
          <option value="">{isLoading ? "Loading" : "Choose"}</option>
          {rows.map((row, index) => <option key={index} value={String(row[block.valueKey] ?? "")}>{String(row[block.labelKey] ?? "")}</option>)}
        </Select>
      </label>
    )
  }
  if (block.type === "stat-card") {
    const value = rows[0]?.[block.valueKey]
    return (
      <div style={style} className="flex flex-col justify-between rounded border border-neutral-800 bg-neutral-950 p-4">
        <p className="text-sm text-neutral-400">{block.label ?? "Metric"}</p>
        <p className="text-3xl font-semibold">{isLoading ? "..." : `${block.prefix ?? ""}${String(value ?? "")}${block.suffix ?? ""}`}</p>
      </div>
    )
  }
  return <div style={style} className="rounded border border-neutral-800 bg-neutral-950 p-3"><Table columns={block.columns} rows={rows} /></div>
}
