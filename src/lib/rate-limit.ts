// Simple in-memory rate limiter for API routes
// Works on Vercel serverless (per-instance), good enough for auth protection

const rateMap = new Map<string, { count: number; resetAt: number }>()

// Clean up stale entries periodically
setInterval(() => {
  const now = Date.now()
  rateMap.forEach((val, key) => {
    if (now > val.resetAt) rateMap.delete(key)
  })
}, 60_000)

interface RateLimitResult {
  limited: boolean
  remaining: number
  resetIn: number
}

export function rateLimit(
  key: string,
  { maxRequests = 5, windowMs = 60_000 }: { maxRequests?: number; windowMs?: number } = {}
): RateLimitResult {
  const now = Date.now()
  const entry = rateMap.get(key)

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false, remaining: maxRequests - 1, resetIn: windowMs }
  }

  entry.count++

  if (entry.count > maxRequests) {
    return { limited: true, remaining: 0, resetIn: entry.resetAt - now }
  }

  return { limited: false, remaining: maxRequests - entry.count, resetIn: entry.resetAt - now }
}

export function getRateLimitKey(request: Request, prefix: string): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown'
  return `${prefix}:${ip}`
}
