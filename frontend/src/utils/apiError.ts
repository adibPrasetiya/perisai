/**
 * Extracts a human-readable error message from an Axios error response.
 *
 * Priority:
 * 1. `details` array (validation errors from backend) → joined detail strings
 * 2. `errors` string (generic backend error message)
 * 3. `fallback` string
 */
export function extractApiError(
  err: unknown,
  fallback = 'Terjadi kesalahan. Coba lagi.',
): string {
  const data = (err as any)?.response?.data
  if (!data) return fallback

  const details = data.details
  if (Array.isArray(details) && details.length > 0) {
    return details.map((d: { path: string; detail: string }) => d.detail).join('\n')
  }

  return data.errors ?? fallback
}
