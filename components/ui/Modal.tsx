"use client"

import { Button } from "@/components/ui/Button"

export function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }): JSX.Element {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
      <section className="w-full max-w-lg rounded border border-neutral-700 bg-neutral-900">
        <header className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          <Button type="button" variant="ghost" onClick={onClose} aria-label="Close">x</Button>
        </header>
        <div className="p-4">{children}</div>
      </section>
    </div>
  )
}
