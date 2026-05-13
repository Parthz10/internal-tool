"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"

interface Notice {
  id: string
  message: string
  tone: "info" | "error" | "success"
}

interface NotificationContextValue {
  notify: (message: string, tone?: Notice["tone"]) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [notices, setNotices] = useState<Notice[]>([])
  const notify = useCallback((message: string, tone: Notice["tone"] = "info") => {
    const id = crypto.randomUUID()
    setNotices((current) => [...current, { id, message, tone }])
    window.setTimeout(() => {
      setNotices((current) => current.filter((notice) => notice.id !== id))
    }, 4000)
  }, [])
  const value = useMemo(() => ({ notify }), [notify])

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
        {notices.map((notice) => (
          <div
            key={notice.id}
            className={`rounded border px-4 py-3 text-sm shadow-none ${
              notice.tone === "error"
                ? "border-red-500/40 bg-red-950 text-red-100"
                : notice.tone === "success"
                  ? "border-emerald-500/40 bg-emerald-950 text-emerald-100"
                  : "border-slate-500/40 bg-neutral-800 text-neutral-100"
            }`}
          >
            {notice.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotification(): NotificationContextValue {
  const value = useContext(NotificationContext)
  if (!value) throw new Error("useNotification must be used inside NotificationProvider")
  return value
}
