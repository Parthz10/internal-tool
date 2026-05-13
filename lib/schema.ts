import { z } from "zod"
import { canvasStateSchema } from "@/lib/canvas-schema"

export const emailSchema = z.string({ required_error: "Email is required" }).trim().email("Enter a valid email address").max(254).toLowerCase()
export const passwordSchema = z.string({ required_error: "Password is required" }).min(10, "Password must be at least 10 characters").max(128)
export const idSchema = z.string().cuid()

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  workspaceName: z.string({ required_error: "Workspace name is required" }).trim().min(2, "Workspace name must be at least 2 characters").max(80)
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: "Password is required" }).min(1, "Password is required").max(128)
})

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(80)
})

export const createAppSchema = z.object({
  name: z.string().trim().min(2).max(80),
  workspaceId: idSchema
})

export const updateAppSchema = z.object({
  workspaceId: idSchema,
  name: z.string().trim().min(2).max(80).optional(),
  canvasJson: canvasStateSchema.optional()
})

export const dataSourceTypeSchema = z.enum(["postgres", "rest"])

export const postgresConfigSchema = z.object({
  connectionString: z.string().trim().url().refine((value) => value.startsWith("postgres://") || value.startsWith("postgresql://"), "Must be a PostgreSQL URL")
})

export const restConfigSchema = z.object({
  baseUrl: z.string().trim().url(),
  headers: z.record(z.string().trim().min(1), z.string().trim().max(1000)).default({})
})

export const createDataSourceSchema = z.discriminatedUnion("type", [
  z.object({
    workspaceId: idSchema,
    name: z.string().trim().min(2).max(80),
    type: z.literal("postgres"),
    config: postgresConfigSchema
  }),
  z.object({
    workspaceId: idSchema,
    name: z.string().trim().min(2).max(80),
    type: z.literal("rest"),
    config: restConfigSchema
  })
])

export const updateDataSourceSchema = z.discriminatedUnion("type", [
  z.object({
    workspaceId: idSchema,
    name: z.string().trim().min(2).max(80).optional(),
    type: z.literal("postgres"),
    config: postgresConfigSchema.optional()
  }),
  z.object({
    workspaceId: idSchema,
    name: z.string().trim().min(2).max(80).optional(),
    type: z.literal("rest"),
    config: restConfigSchema.optional()
  })
])

export const queryRequestSchema = z.object({
  workspaceId: idSchema,
  sourceId: idSchema,
  query: z.string().trim().min(1).max(10000),
  params: z.record(z.string().trim().min(1), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
  mutation: z.boolean().default(false),
  method: z.enum(["GET", "POST", "PATCH", "DELETE"]).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(500).default(100)
})

export const checkoutSessionSchema = z.object({
  workspaceId: idSchema,
  priceId: z.string().trim().regex(/^price_[A-Za-z0-9_]+$/, "A valid Stripe price ID is required"),
  mode: z.enum(["payment", "subscription"]).default("subscription")
})

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}
