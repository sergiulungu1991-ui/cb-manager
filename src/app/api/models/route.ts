import { NextRequest } from 'next/server'
import { getApiUrl } from '@/lib/api'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get('limit') || '20'
  const page = searchParams.get('page') || '1'
  const status = searchParams.get('status')

  const backendParams = new URLSearchParams({ limit, page })
  if (status) {
    backendParams.set('status', status)
  }

  const res = await fetch(`${getApiUrl()}/model/cb?${backendParams.toString()}`)
  if (!res.ok) {
    return new Response('Failed to fetch', { status: res.status })
  }
  const data = await res.json()
  return Response.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  console.log('[POST /api/models] body:', JSON.stringify(body))

  const res = await fetch(`${getApiUrl()}/model/cb/upsert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const resText = await res.text()
  console.log('[POST /api/models] backend status:', res.status, 'response:', resText)

  if (!res.ok) {
    return new Response(resText, { status: res.status })
  }

  return new Response(resText, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}