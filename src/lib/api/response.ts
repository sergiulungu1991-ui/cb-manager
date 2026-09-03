import { NextResponse } from 'next/server'
import { ApiError, toApiError } from './errors'

type JsonInit = {
  status?: number
  /** Adds `Cache-Control` so browsers/CDN can serve repeat reads instantly. */
  maxAgeSeconds?: number
}

export function jsonOk<T>(data: T, init: JsonInit = {}): NextResponse {
  const headers: Record<string, string> = {}

  if (init.maxAgeSeconds !== undefined) {
    headers['Cache-Control'] =
      `public, max-age=0, s-maxage=${init.maxAgeSeconds}, stale-while-revalidate=${init.maxAgeSeconds * 2}`
  }

  return NextResponse.json(data, { status: init.status ?? 200, headers })
}

export function jsonError(error: unknown): NextResponse {
  const apiError = toApiError(error)

  if (apiError.status >= 500) {
    console.error('[api]', apiError.code, apiError.message, apiError.details)
  }

  return NextResponse.json(
    {
      error: {
        code: apiError.code,
        message: apiError.message,
        ...(apiError.details ? { details: apiError.details } : {}),
      },
    },
    { status: apiError.status },
  )
}

export function badRequest(message: string, details?: unknown): NextResponse {
  return jsonError(new ApiError('BAD_REQUEST', message, details))
}
