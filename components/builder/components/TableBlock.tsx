import type { TableBlock as TableBlockType } from "@/lib/canvas-schema"

export function TableBlock({ block }: { block: TableBlockType }): JSX.Element {
  return (
    <div className="h-full overflow-hidden rounded border border-neutral-800 bg-neutral-950">
      <div className="border-b border-neutral-800 px-3 py-2 text-sm font-medium">{block.label ?? "Table"}</div>
      <div className="grid grid-cols-3 gap-px bg-neutral-800 text-xs">
        {(block.columns.length ? block.columns : [{ key: "column", label: "Column" }]).slice(0, 6).map((column) => (
          <div key={column.key} className="bg-neutral-950 px-2 py-2 text-neutral-400">{column.label}</div>
        ))}
      </div>
    </div>
  )
}
