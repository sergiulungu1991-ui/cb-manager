import { z } from 'zod'
import { STATUS_VALUES } from '@/lib/status'

export const statusSchema = z.enum(STATUS_VALUES)

/**
 * Upstream is inconsistent: the list endpoint returns snake_case while the
 * detail endpoint returns camelCase and wraps rows in `data`. Both shapes are
 * normalized here so the rest of the app deals with a single model type.
 */
const upstreamModelSchema = z
  .object({
    name: z.string().min(1),
    image_url: z.string().nullish(),
    imageUrl: z.string().nullish(),
    status: z.string().nullish(),
  })
  .transform((row) => ({
    name: row.name,
    image_url: row.image_url ?? row.imageUrl ?? null,
    status: row.status ?? null,
  }))

export const modelSchema = upstreamModelSchema

export type Model = z.infer<typeof modelSchema>

/**
 * Upstream returns a bare array for lists, a `{ data: [...] }` envelope for
 * some queries and a single object for the detail endpoint. All three are
 * flattened to `Model[]`.
 */
export const modelListSchema = z
  .union([
    z.array(upstreamModelSchema),
    z.object({ data: z.array(upstreamModelSchema) }),
    upstreamModelSchema,
  ])
  .transform((payload) => {
    if (Array.isArray(payload)) return payload
    if ('data' in payload) return payload.data
    return [payload]
  })

export const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(40),
  page: z.coerce.number().int().min(1).default(1),
  status: z.string().trim().min(1).nullish(),
})

export type ListQuery = z.infer<typeof listQuerySchema>

const singleUpsertSchema = z.object({
  name: z.string().trim().min(1),
  status: statusSchema,
})

export const upsertBodySchema = z.union([
  singleUpsertSchema.transform((model) => ({ models: [model] })),
  z.object({ models: z.array(singleUpsertSchema).min(1).max(500) }),
])

export type UpsertBody = z.infer<typeof upsertBodySchema>
