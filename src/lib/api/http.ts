import { z } from 'zod'
import { API_CONFIG } from './config'
import { ApiError } from './errors'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Next.js data cache settings. Omit for `no-store`. */
  revalidateSeconds?: number
  tags?: string[]
  signal?: AbortSignal
}

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504])

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function buildInit(options: RequestOptions, signal: AbortSignal): RequestInit {
  const init: RequestInit = {
    method: options.method || 'GET',
    signal,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  }

  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body)
  }

  if (options.revalidateSeconds === undefined) {
    init.cache = 'no-store'
  } else {
    init.next = { revalidate: options.revalidateSeconds, tags: options.tags }
  }

  return init
}

async function requestOnce(
  path: string,
  options: RequestOptions,
): Promise<unknown> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs)

  // Propagate caller cancellation (e.g. client disconnect) into our controller.
  options.signal?.addEventListener('abort', () => controller.abort(), {
    once: true,
  })

  try {
    const res = await fetch(
      `${API_CONFIG.baseUrl}${path}`,
      buildInit(options, controller.signal),
    )

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new ApiError(
        RETRYABLE_STATUS.has(res.status) ? 'UPSTREAM_ERROR' : 'BAD_REQUEST',
        `Upstream responded with ${res.status}`,
        { status: res.status, body: text.slice(0, 500) },
      )
    }

    const text = await res.text()
    if (!text) return null

    try {
      return JSON.parse(text)
    } catch {
      throw new ApiError(
        'UPSTREAM_INVALID_RESPONSE',
        'Upstream returned a non-JSON payload',
      )
    }
  } catch (error) {
    if (error instanceof ApiError) throw error

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('UPSTREAM_TIMEOUT', 'Upstream request timed out')
    }

    throw new ApiError(
      'UPSTREAM_ERROR',
      error instanceof Error ? error.message : 'Upstream request failed',
    )
  } finally {
    clearTimeout(timeout)
  }
}

function isRetryable(error: ApiError, method: string): boolean {
  // Only idempotent methods are retried to avoid duplicate writes.
  if (method !== 'GET') return false
  return error.code === 'UPSTREAM_ERROR' || error.code === 'UPSTREAM_TIMEOUT'
}

async function request(path: string, options: RequestOptions): Promise<unknown> {
  const method = options.method || 'GET'
  let lastError: ApiError | null = null

  for (let attempt = 0; attempt <= API_CONFIG.retries; attempt += 1) {
    try {
      return await requestOnce(path, options)
    } catch (error) {
      lastError = error instanceof ApiError ? error : null

      if (!lastError || !isRetryable(lastError, method)) throw error
      if (attempt === API_CONFIG.retries) throw error

      // Exponential backoff with jitter to avoid synchronized retry storms.
      const delay = API_CONFIG.retryBaseDelayMs * 2 ** attempt
      await sleep(delay + Math.random() * delay)
    }
  }

  throw lastError
}

/** Performs a request and validates the payload against `schema`. */
export async function apiRequest<T extends z.ZodTypeAny>(
  path: string,
  schema: T,
  options: RequestOptions = {},
): Promise<z.infer<T>> {
  const payload = await request(path, options)
  const parsed = schema.safeParse(payload)

  if (!parsed.success) {
    throw new ApiError(
      'UPSTREAM_INVALID_RESPONSE',
      'Upstream payload failed validation',
      parsed.error.flatten(),
    )
  }

  return parsed.data
}
