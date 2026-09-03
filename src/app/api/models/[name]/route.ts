import { NextRequest } from 'next/server'

const API_URL = process.env.API_URL || 'http://localhost:3001'

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } },
) {
  const name = decodeURIComponent(params.name)
  const res = await fetch(`${API_URL}/model/cb/${name}`)

  if (!res.ok) {
    return new Response('Failed to fetch model', { status: res.status })
  }

  const data = await res.json()
  return Response.json(data)
}
