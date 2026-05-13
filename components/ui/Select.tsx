import type { SelectHTMLAttributes } from "react"
import classNames from "classnames"

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>): JSX.Element {
  return (
    <select className={classNames("h-10 w-full rounded border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-50", className)} {...props}>
      {children}
    </select>
  )
}
