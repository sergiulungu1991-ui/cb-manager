import { syncModels } from '@/lib/api/models'
import { jsonError, jsonOk } from '@/lib/api/response'

export async function POST() {
  try {
    return jsonOk(await syncModels())
  } catch (error) {
    return jsonError(error)
  }
}
