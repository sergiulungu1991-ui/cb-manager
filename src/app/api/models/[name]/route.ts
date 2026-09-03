import { NextRequest } from 'next/server'
import { API_CONFIG } from '@/lib/api/config'
import { getModel } from '@/lib/api/models'
import { badRequest, jsonError, jsonOk } from '@/lib/api/response'

export async function GET(
  _request: NextRequest,
  { params }: { params: { name: string } },
) {
  const name = decodeURIComponent(params.name).trim()

  if (!name) {
    return badRequest('Model name is required')
  }

  try {
    const model = await getModel(name)
    return jsonOk(model, { maxAgeSeconds: API_CONFIG.listRevalidateSeconds })
  } catch (error) {
    return jsonError(error)
  }
}
