import type { StatCardBlock as StatCardBlockType } from "@/lib/canvas-schema"

export function StatCardBlock({ block }: { block: StatCardBlockType }): JSX.Element {
  return (
    <div className="flex h-full flex-col justify-between rounded border border-neutral-800 bg-neutral-950 p-4">
      <p className="text-sm text-neutral-400">{block.label ?? "Metric"}</p>
      <p className="text-3xl font-semibold">{block.prefix}0{block.suffix}</p>
      <p className="font-mono text-xs text-neutral-500">{block.valueKey}</p>
    </div>
  )
}
