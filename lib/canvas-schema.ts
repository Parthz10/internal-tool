import { z } from "zod"

export const blockTypeSchema = z.enum(["table", "text", "stat-card", "button", "select"])
export type BlockType = z.infer<typeof blockTypeSchema>

const baseBlockSchema = z.object({
  id: z.string().cuid(),
  type: blockTypeSchema,
  x: z.number().int().min(1).max(12),
  y: z.number().int().min(1),
  w: z.number().int().min(1).max(12),
  h: z.number().int().min(1),
  label: z.string().trim().min(1).max(120).optional()
})

export const dataBindingSchema = z.object({
  sourceId: z.string().cuid(),
  query: z.string().trim().min(1).max(10000),
  method: z.enum(["GET", "POST"]).optional(),
  params: z.record(z.string().trim().min(1), z.string().trim().min(1)).optional()
})

const tableBlockSchema = baseBlockSchema.extend({
  type: z.literal("table"),
  binding: dataBindingSchema,
  columns: z.array(z.object({
    key: z.string().trim().min(1).max(100),
    label: z.string().trim().min(1).max(120),
    width: z.number().int().min(40).max(800).optional()
  })).max(50)
})

const statCardBlockSchema = baseBlockSchema.extend({
  type: z.literal("stat-card"),
  binding: dataBindingSchema,
  valueKey: z.string().trim().min(1).max(100),
  prefix: z.string().max(20).optional(),
  suffix: z.string().max(20).optional()
})

const textBlockSchema = baseBlockSchema.extend({
  type: z.literal("text"),
  content: z.string().max(5000)
})

const buttonBlockSchema = baseBlockSchema.extend({
  type: z.literal("button"),
  label: z.string().trim().min(1).max(80),
  action: z.object({
    type: z.literal("mutation"),
    sourceId: z.string().cuid(),
    query: z.string().trim().min(1).max(10000),
    method: z.enum(["POST", "PATCH", "DELETE"]).optional(),
    params: z.record(z.string().trim().min(1), z.string().trim().min(1)).optional()
  })
})

const selectBlockSchema = baseBlockSchema.extend({
  type: z.literal("select"),
  binding: dataBindingSchema,
  valueKey: z.string().trim().min(1).max(100),
  labelKey: z.string().trim().min(1).max(100)
})

export const blockSchema = z.discriminatedUnion("type", [
  tableBlockSchema,
  textBlockSchema,
  statCardBlockSchema,
  buttonBlockSchema,
  selectBlockSchema
])

export const canvasStateSchema = z.object({
  blocks: z.array(blockSchema).max(200),
  variables: z.record(z.unknown()).default({})
})

export type DataBinding = z.infer<typeof dataBindingSchema>
export type TableBlock = z.infer<typeof tableBlockSchema>
export type StatCardBlock = z.infer<typeof statCardBlockSchema>
export type TextBlock = z.infer<typeof textBlockSchema>
export type ButtonBlock = z.infer<typeof buttonBlockSchema>
export type SelectBlock = z.infer<typeof selectBlockSchema>
export type Block = z.infer<typeof blockSchema>
export type CanvasState = z.infer<typeof canvasStateSchema>

export const emptyCanvas: CanvasState = { blocks: [], variables: {} }
