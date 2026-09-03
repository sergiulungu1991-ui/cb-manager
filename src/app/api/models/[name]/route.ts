import { NextRequest } from 'next/server'
import { getApiUrl } from '@/lib/api'

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } },
) {
  const name = decodeURIComponent(params.name)
  const res = await fetch(`${getApiUrl()}/model/cb/${name}`)

  if (!res.ok) {
    return new Response('Failed to fetch model', { status: res.status })
  }

  const data = await res.json()
  return Response.json(data)
}
