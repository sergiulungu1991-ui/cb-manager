import { NextRequest } from 'next/server'
import { getApiUrl } from '@/lib/api'

export async function POST(request: NextRequest) {
  const res = await fetch(`${getApiUrl()}/model/cb/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    return new Response('Failed to sync', { status: res.status })
  }
  const data = await res.json()
  return Response.json(data)
}