import { redirect } from "next/navigation"

export default function AppIndexPage({ params }: { params: { appId: string } }): never {
  redirect(`/apps/${params.appId}/builder`)
}
