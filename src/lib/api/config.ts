/**
 * Central API configuration. Values are read once per module load so a
 * misconfigured environment fails fast instead of per request.
 */
export const API_CONFIG = {
  baseUrl: (process.env.API_URL || 'http://localhost:3001').replace(/\/+$/, ''),
  timeoutMs: Number(process.env.API_TIMEOUT_MS || 8000),
  retries: Number(process.env.API_RETRIES || 2),
  retryBaseDelayMs: Number(process.env.API_RETRY_DELAY_MS || 200),
  /** Seconds the model list stays fresh in the Next.js data cache. */
  listRevalidateSeconds: Number(process.env.API_LIST_REVALIDATE || 30),
} as const

export const CACHE_TAGS = {
  models: 'models',
  model: (name: string) => `model:${name}`,
} as const
