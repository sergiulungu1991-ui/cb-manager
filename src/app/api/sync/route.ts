import { NextRequest } from 'next/server'

const API_URL = process.env.API_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
  const res = await fetch(`${API_URL}/model/cb/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    return new Response('Failed to sync', { status: res.status })
  }
  const data = await res.json()
  return Response.json(data)
}