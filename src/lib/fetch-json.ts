type ErrorEnvelope = {
  error?: { message?: string }
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message
  return fallback
}

/**
 * Client-side fetch that unwraps the standardized `{ error: { message } }`
 * envelope returned by the app's route handlers.
 */
export async function fetchJson<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, init)
  const text = await res.text()

  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!res.ok) {
    const message = (payload as ErrorEnvelope | null)?.error?.message
    throw new Error(message || `Request failed with status ${res.status}`)
  }

  return payload as T
}
