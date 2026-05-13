import type { ButtonHTMLAttributes } from "react"
import classNames from "classnames"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger"
}

export function Button({ className, variant = "primary", ...props }: ButtonProps): JSX.Element {
  return (
    <button
      className={classNames(
        "inline-flex h-10 items-center justify-center rounded border px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "border-slate-500 bg-slate-600 text-white hover:bg-slate-500",
        variant === "secondary" && "border-neutral-700 bg-neutral-800 text-neutral-100 hover:bg-neutral-700",
        variant === "ghost" && "border-transparent bg-transparent text-neutral-200 hover:bg-neutral-800",
        variant === "danger" && "border-red-700 bg-red-900 text-red-50 hover:bg-red-800",
        className
      )}
      {...props}
    />
  )
}
