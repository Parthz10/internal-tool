import type { ButtonBlock as ButtonBlockType } from "@/lib/canvas-schema"
import { Button } from "@/components/ui/Button"

export function ButtonBlock({ block }: { block: ButtonBlockType }): JSX.Element {
  return <div className="flex h-full items-center rounded border border-neutral-800 bg-neutral-950 p-4"><Button type="button">{block.label}</Button></div>
}
