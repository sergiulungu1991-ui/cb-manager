import ModelClient from './model-client'
import { getApiUrl } from '@/lib/api'

type ApiModel = {
  name: string
  imageUrl: string | null
  status: string | null
}

type PageProps = {
  searchParams: {
    name?: string | string[]
    image_url?: string | string[]
    status?: string | string[]
    page?: string | string[]
  }
}

type ApiItem = {
  name?: string
  imageUrl?: string | null
  image_url?: string | null
  status?: string | null
}

function getParam(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : (value?.[0] ?? '')
}

function isApiItem(value: unknown): value is ApiItem {
  return typeof value === 'object' && value !== null && 'name' in value
}

function extractModel(payload: unknown, name: string): ApiModel | null {
  if (payload === null || typeof payload !== 'object') return null

  const list =
    'data' in payload && Array.isArray((payload as { data: unknown }).data)
      ? (payload as { data: unknown[] }).data
      : Array.isArray(payload)
        ? payload
        : null

  if (!list) return null

  const target = name.toLowerCase().trim()

  const found = list.find((item): item is ApiItem => {
    if (!isApiItem(item)) return false
    return typeof item.name === 'string' && item.name.toLowerCase().trim() === target
  })

  if (!found || typeof found.name !== 'string') return null

  return {
    name: found.name,
    imageUrl: found.imageUrl || found.image_url || null,
    status: found.status || null,
  }
}

async function fetchModel(url: string, name: string): Promise<ApiModel | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' })

    if (!res.ok) {
      return null
    }

    const payload = await res.json()
    return extractModel(payload, name)
  } catch {
    return null
  }
}

export default async function ModelPage({ searchParams }: PageProps) {
  const name = decodeURIComponent(getParam(searchParams.name) || '')
  const pageParam = getParam(searchParams.page) || '1'

  if (!name) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f2f2]">
        <div className="text-[12px] text-red-700">Missing model name</div>
      </div>
    )
  }

  const apiUrl = getApiUrl()
  const encodedName = encodeURIComponent(name)

  let model = await fetchModel(`${apiUrl}/model/cb/${encodedName}`, name)

  if (!model) {
    model = await fetchModel(`${apiUrl}/model/cb?name=${encodedName}`, name)
  }

  if (!model) {
    model = await fetchModel(
      `${apiUrl}/model/cb?limit=40&page=${encodeURIComponent(pageParam)}`,
      name,
    )
  }

  if (!model) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f2f2]">
        <div className="text-[12px] text-red-700">Model not found</div>
      </div>
    )
  }

  const imageUrl = model.imageUrl || getParam(searchParams.image_url) || ''
  const status = model.status ?? getParam(searchParams.status) ?? ''

  return (
    <ModelClient name={model.name || name} imageUrl={imageUrl} status={status} />
  )
}
