import { z } from 'zod'
import { revalidateTag } from 'next/cache'
import { API_CONFIG, CACHE_TAGS } from './config'
import { ApiError } from './errors'
import { apiRequest } from './http'
import {
  type ListQuery,
  type Model,
  type UpsertBody,
  modelListSchema,
} from './schemas'

const NO_STATUS_FILTER = 'null'

function buildListPath({ limit, page, status }: ListQuery): string {
  const params = new URLSearchParams({
    limit: String(limit),
    page: String(page),
  })

  if (status) {
    params.set('status', status)
  }

  return `/model/cb?${params.toString()}`
}

export async function getModels(query: ListQuery): Promise<Model[]> {
  const hasFilter = Boolean(query.status)

  return apiRequest(buildListPath(query), modelListSchema, {
    // Filtered lists must always be fresh so a status update is reflected
    // immediately. The unfiltered list can tolerate short staleness.
    // (DATE POT FI CACHE IN API!)
    revalidateSeconds: hasFilter ? 0 : API_CONFIG.listRevalidateSeconds,
    tags: [CACHE_TAGS.models],
  })
}

export async function getModel(name: string): Promise<Model> {
  const encoded = encodeURIComponent(name)
  const target = name.toLowerCase().trim()

  const candidates = [
    `/model/cb/${encoded}`,
    `/model/cb?name=${encoded}`,
  ]

  for (const path of candidates) {
    try {
      const rows = await apiRequest(path, modelListSchema, {
        revalidateSeconds: 0,
        tags: [CACHE_TAGS.models, CACHE_TAGS.model(name)],
      })

      const found = rows.find(
        (row) => row.name.toLowerCase().trim() === target,
      )

      if (found) return found
    } catch (error) {
      // A missing dedicated endpoint should not stop the remaining lookups.
      if (error instanceof ApiError && error.code === 'UPSTREAM_ERROR') continue
      if (error instanceof ApiError && error.code === 'NOT_FOUND') continue
      if (error instanceof ApiError && error.code === 'BAD_REQUEST') continue
      throw error
    }
  }

  throw new ApiError('NOT_FOUND', `Model "${name}" was not found`)
}

const upsertResponseSchema = z
  .union([z.object({ ok: z.boolean() }).passthrough(), z.null(), z.unknown()])
  .transform(() => ({ ok: true }) as const)

export async function upsertModels(body: UpsertBody) {
  const result = await apiRequest('/model/cb/upsert', upsertResponseSchema, {
    method: 'POST',
    body,
  })

  revalidateTag(CACHE_TAGS.models)
  body.models.forEach((model) => revalidateTag(CACHE_TAGS.model(model.name)))

  return result
}

export async function syncModels() {
  const result = await apiRequest('/model/cb/sync', upsertResponseSchema, {
    method: 'POST',
  })

  revalidateTag(CACHE_TAGS.models)

  return result
}

export { NO_STATUS_FILTER }
