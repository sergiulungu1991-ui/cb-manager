import { NextRequest } from 'next/server'

const API_URL = process.env.API_URL || 'http://localhost:3001'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = searchParams.get('limit') || '20'
  const page = searchParams.get('page') || '1'
  const res = await fetch(`${API_URL}/model/cb?limit=${limit}&page=${page}`)
  if (!res.ok) {
    return new Response('Failed to fetch', { status: res.status })
  }
  const data = await res.json()
  return Response.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const res = await fetch(`${API_URL}/model/cb`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    return new Response('Failed to save', { status: res.status })
  }
  const data = await res.json()
  return Response.json(data)
}