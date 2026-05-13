import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react"
import classNames from "classnames"

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>): JSX.Element {
  return (
    <input
      className={classNames("h-10 w-full rounded border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-50 placeholder:text-neutral-500", className)}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>): JSX.Element {
  return (
    <textarea
      className={classNames("min-h-24 w-full rounded border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-sm text-neutral-50 placeholder:text-neutral-500", className)}
      {...props}
    />
  )
}
