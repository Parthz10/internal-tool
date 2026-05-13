import type { TextBlock as TextBlockType } from "@/lib/canvas-schema"

export function TextBlock({ block }: { block: TextBlockType }): JSX.Element {
  return <div className="h-full overflow-auto whitespace-pre-wrap rounded border border-neutral-800 bg-neutral-950 p-3 text-sm text-neutral-200">{block.content}</div>
}
