import type { Metadata } from "next"
import "./globals.css"
import { NotificationProvider } from "@/hooks/useNotification"

export const metadata: Metadata = {
  title: "Internal Tools Builder",
  description: "Self-hostable internal dashboards for operations teams"
}

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-900 font-sans text-neutral-50 antialiased">
        <NotificationProvider>{children}</NotificationProvider>
      </body>
    </html>
  )
}
