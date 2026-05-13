import { Client } from "pg"
import { z } from "zod"
import { lookup } from "dns/promises"
import net from "net"
import { decrypt } from "@/lib/crypto"
import { getDb } from "@/lib/db"
import { postgresConfigSchema, restConfigSchema } from "@/lib/schema"

const timeoutMs = 8000
const allowedForwardHeaders = new Set(["authorization", "x-api-key", "accept", "content-type"])

export interface QueryRunnerInput {
  workspaceId: string
  sourceId: string
  query: string
  params: Record<string, string | number | boolean | null>
  mutation: boolean
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  page: number
  pageSize: number
}

export interface QueryRunnerResult {
  rows: Record<string, unknown>[]
  page: number
  pageSize: number
}

function isSelectQuery(query: string): boolean {
  return /^\s*(with|select)\b/i.test(query)
}

function boundedPageSize(pageSize: number): number {
  return Math.min(Math.max(pageSize, 1), 500)
}

function isPrivateIpv4(address: string): boolean {
  const parts = address.split(".").map((part) => Number(part))
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true
  const [first, second] = parts
  return first === 0
    || first === 10
    || first === 127
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 168)
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase()
  return normalized === "::1"
    || normalized === "::"
    || normalized.startsWith("fe80:")
    || normalized.startsWith("fc")
    || normalized.startsWith("fd")
    || normalized.startsWith("::ffff:127.")
    || normalized.startsWith("::ffff:10.")
    || normalized.startsWith("::ffff:192.168.")
}

function isBlockedIp(address: string): boolean {
  const family = net.isIP(address)
  if (family === 4) return isPrivateIpv4(address)
  if (family === 6) return isPrivateIpv6(address)
  return true
}

async function assertSafeRestUrl(url: URL): Promise<void> {
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Blocked REST data source target")
  }
  const hostname = url.hostname.toLowerCase()
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("Blocked REST data source target")
  }
  if (net.isIP(hostname) && isBlockedIp(hostname)) {
    throw new Error("Blocked REST data source target")
  }
  const records = await lookup(hostname, { all: true, verbatim: true })
  if (records.some((record) => isBlockedIp(record.address))) {
    throw new Error("Blocked REST data source target")
  }
}

function serializeConfig(config: unknown): string {
  const parsed = z.object({ encrypted: z.string() }).parse(config)
  return decrypt(parsed.encrypted)
}

function bindParams(query: string, params: Record<string, string | number | boolean | null>): { text: string; values: Array<string | number | boolean | null> } {
  const values: Array<string | number | boolean | null> = []
  const text = query.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, (_match, key: string) => {
    if (!(key in params)) {
      throw new Error(`Missing query parameter: ${key}`)
    }
    values.push(params[key])
    return `$${values.length}`
  })
  return { text, values }
}

async function withTimeout<T>(operation: Promise<T>, controller?: AbortController): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller?.abort()
      reject(new Error("Query execution timed out"))
    }, timeoutMs)
  })
  try {
    return await Promise.race([operation, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

async function runPostgres(config: unknown, input: QueryRunnerInput): Promise<QueryRunnerResult> {
  const decrypted = postgresConfigSchema.parse(JSON.parse(serializeConfig(config)))
  const client = new Client({ connectionString: decrypted.connectionString, statement_timeout: timeoutMs, query_timeout: timeoutMs })
  const pageSize = boundedPageSize(input.pageSize)
  const offset = (input.page - 1) * pageSize
  const readOnly = isSelectQuery(input.query)
  if (!readOnly && !input.mutation) {
    throw new Error("Mutations require an explicit mutation action")
  }

  await withTimeout(client.connect())
  try {
    await client.query("BEGIN")
    if (readOnly) {
      await client.query("SET TRANSACTION READ ONLY")
    }
    const bound = bindParams(input.query, input.params)
    const paginated = readOnly ? `${bound.text}\nLIMIT $${bound.values.length + 1} OFFSET $${bound.values.length + 2}` : bound.text
    const values = readOnly ? [...bound.values, pageSize, offset] : bound.values
    const result = await withTimeout(client.query<Record<string, unknown>>(paginated, values))
    await client.query("COMMIT")
    return { rows: result.rows, page: input.page, pageSize }
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined)
    throw error
  } finally {
    await client.end().catch(() => undefined)
  }
}

function buildRestUrl(baseUrl: string, path: string, params: Record<string, string | number | boolean | null>, page: number, pageSize: number): URL {
  const base = new URL(baseUrl)
  const url = new URL(path, base)
  if (url.origin !== base.origin) {
    throw new Error("REST data source paths must stay on the configured base URL")
  }
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null) url.searchParams.set(key, String(value))
  })
  url.searchParams.set("page", String(page))
  url.searchParams.set("pageSize", String(pageSize))
  return url
}

async function runRest(config: unknown, input: QueryRunnerInput): Promise<QueryRunnerResult> {
  const decrypted = restConfigSchema.parse(JSON.parse(serializeConfig(config)))
  const method = input.method ?? "GET"
  const controller = new AbortController()
  const headers = new Headers()
  Object.entries(decrypted.headers).forEach(([key, value]) => {
    if (allowedForwardHeaders.has(key.toLowerCase())) headers.set(key, value)
  })
  const pageSize = boundedPageSize(input.pageSize)
  const url = buildRestUrl(decrypted.baseUrl, input.query, input.params, input.page, pageSize)
  await withTimeout(assertSafeRestUrl(url), controller)
  const response = await withTimeout(fetch(url, {
    method,
    headers,
    signal: controller.signal
  }), controller)
  if (!response.ok) {
    throw new Error(`REST source returned ${response.status}`)
  }
  const payload: unknown = await response.json()
  const rows = Array.isArray(payload) ? payload : z.object({ rows: z.array(z.record(z.unknown())) }).parse(payload).rows
  return { rows: rows.slice(0, pageSize) as Record<string, unknown>[], page: input.page, pageSize }
}

export async function runDataSourceQuery(input: QueryRunnerInput): Promise<QueryRunnerResult> {
  const db = getDb()
  const source = await db.dataSource.findFirst({
    where: { id: input.sourceId, workspaceId: input.workspaceId }
  })
  if (!source) {
    throw new Error("Data source not found")
  }
  if (source.type === "postgres") {
    return runPostgres(source.config, input)
  }
  if (source.type === "rest") {
    return runRest(source.config, input)
  }
  throw new Error("Unsupported data source type")
}
