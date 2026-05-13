"use client"

import useSWR from "swr"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Textarea } from "@/components/ui/Input"
import { createDataSourceSchema } from "@/lib/schema"
import { useNotification } from "@/hooks/useNotification"

interface DataSourceSummary {
  id: string
  name: string
  type: string
  workspaceId: string
  createdAt: string
}

interface DataSourceForm {
  name: string
  type: "postgres" | "rest"
  connectionString: string
  baseUrl: string
  headers: string
}

async function fetcher(url: string): Promise<{ dataSources: DataSourceSummary[] }> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 8000)
  const response = await fetch(url, { signal: controller.signal }).finally(() => window.clearTimeout(timer))
  if (!response.ok) throw new Error("Failed to load data sources")
  return response.json() as Promise<{ dataSources: DataSourceSummary[] }>
}

export function DataSourcesClient({ workspaceId, initialDataSources }: { workspaceId: string; initialDataSources: DataSourceSummary[] }): JSX.Element {
  const { notify } = useNotification()
  const { data, mutate } = useSWR(workspaceId ? `/api/data-sources?workspaceId=${workspaceId}` : null, fetcher, {
    fallbackData: { dataSources: initialDataSources }
  })
  const { register, handleSubmit, watch, reset, formState } = useForm<DataSourceForm>({
    defaultValues: { type: "postgres", headers: "{}" }
  })
  const type = watch("type")

  async function onSubmit(values: DataSourceForm): Promise<void> {
    const config = values.type === "postgres"
      ? { connectionString: values.connectionString }
      : { baseUrl: values.baseUrl, headers: JSON.parse(values.headers || "{}") as Record<string, string> }
    const parsed = createDataSourceSchema.safeParse({ workspaceId, name: values.name, type: values.type, config })
    if (!parsed.success) {
      notify(parsed.error.issues[0]?.message ?? "Check the connection details", "error")
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 8000)
    const response = await fetch("/api/data-sources", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
      signal: controller.signal
    }).finally(() => window.clearTimeout(timer))
    if (!response.ok) {
      notify("Could not save data source", "error")
      return
    }
    notify("Data source saved", "success")
    reset({ type: "postgres", headers: "{}" })
    await mutate()
  }

  return (
    <main className="mx-auto grid max-w-6xl grid-cols-[1fr_360px] gap-8 px-6 py-8">
      <section>
        <h1 className="text-2xl font-semibold">Data sources</h1>
        <div className="mt-6 divide-y divide-neutral-800 rounded border border-neutral-800">
          {data?.dataSources.length ? data.dataSources.map((source) => (
            <div key={source.id} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{source.name}</p>
                <p className="text-sm text-neutral-500">{source.type}</p>
              </div>
              <Button variant="secondary" type="button" onClick={() => notify("Connection test endpoint is ready for API use", "info")}>Test</Button>
            </div>
          )) : <div className="p-8 text-sm text-neutral-400">No data sources configured.</div>}
        </div>
      </section>
      <form onSubmit={handleSubmit(onSubmit)} className="h-fit space-y-4 rounded border border-neutral-800 p-5">
        <h2 className="font-semibold">Add source</h2>
        <label className="block text-sm text-neutral-300">Name<Input className="mt-2" {...register("name")} /></label>
        <label className="block text-sm text-neutral-300">Type<Select className="mt-2" {...register("type")}><option value="postgres">PostgreSQL</option><option value="rest">REST API</option></Select></label>
        {type === "postgres" ? (
          <label className="block text-sm text-neutral-300">Connection string<Input className="mt-2 font-mono" type="password" {...register("connectionString")} /></label>
        ) : (
          <>
            <label className="block text-sm text-neutral-300">Base URL<Input className="mt-2" {...register("baseUrl")} /></label>
            <label className="block text-sm text-neutral-300">Headers JSON<Textarea className="mt-2" {...register("headers")} /></label>
          </>
        )}
        <Button disabled={formState.isSubmitting || !workspaceId}>Save source</Button>
      </form>
    </main>
  )
}
