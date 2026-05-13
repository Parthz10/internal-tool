import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"

export default async function DashboardLayout({ children }: { children: React.ReactNode }): Promise<JSX.Element> {
  const session = await getSession()
  if (!session) redirect("/login")
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-50">
      <header className="flex h-14 items-center justify-between border-b border-neutral-800 px-6">
        <Link href="/" className="text-sm font-semibold">Internal Tools Builder</Link>
        <nav className="flex items-center gap-4 text-sm text-neutral-300">
          <Link href="/" className="hover:text-white">Apps</Link>
          <Link href="/settings/data-sources" className="hover:text-white">Data sources</Link>
          <Link href="/settings/billing" className="hover:text-white">Billing</Link>
          <Link href="/settings" className="hover:text-white">Settings</Link>
          <form action="/api/auth/logout" method="post"><button className="hover:text-white">Sign out</button></form>
        </nav>
      </header>
      {children}
    </div>
  )
}
