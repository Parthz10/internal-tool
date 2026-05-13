import type { SelectBlock as SelectBlockType } from "@/lib/canvas-schema"
import { Select } from "@/components/ui/Select"

export function SelectBlock({ block }: { block: SelectBlockType }): JSX.Element {
  return (
    <label className="block h-full rounded border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-300">
      {block.label ?? "Select"}
      <Select className="mt-2"><option>{block.labelKey}</option></Select>
    </label>
  )
}
