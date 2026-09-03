import { NextRequest } from 'next/server'
import { API_CONFIG } from '@/lib/api/config'
import { getModels, upsertModels } from '@/lib/api/models'
import { badRequest, jsonError, jsonOk } from '@/lib/api/response'
import { listQuerySchema, upsertBodySchema } from '@/lib/api/schemas'

export async function GET(request: NextRequest) {
  const query = listQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  )

  if (!query.success) {
    return badRequest('Invalid query parameters', query.error.flatten())
  }

  try {
    const models = await getModels(query.data)
    return jsonOk(models, { maxAgeSeconds: API_CONFIG.listRevalidateSeconds })
  } catch (error) {
    return jsonError(error)
  }
}

export async function POST(request: NextRequest) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return badRequest('Request body must be valid JSON')
  }

  const body = upsertBodySchema.safeParse(payload)

  if (!body.success) {
    return badRequest('Invalid upsert payload', body.error.flatten())
  }

  try {
    return jsonOk(await upsertModels(body.data))
  } catch (error) {
    return jsonError(error)
  }
}
