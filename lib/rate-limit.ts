interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, entry] of this.requests.entries()) {
        if (entry.resetTime < now) {
          this.requests.delete(key)
        }
      }
    }, 5 * 60 * 1000)
  }

  check(identifier: string, limit: number, windowMs: number): {
    allowed: boolean
    remaining: number
    resetTime: number
  } {
    const now = Date.now()
    const entry = this.requests.get(identifier)

    // No existing entry or window has expired
    if (!entry || entry.resetTime < now) {
      const resetTime = now + windowMs
      this.requests.set(identifier, {
        count: 1,
        resetTime,
      })
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime,
      }
    }

    // Within the time window
    if (entry.count < limit) {
      entry.count++
      return {
        allowed: true,
        remaining: limit - entry.count,
        resetTime: entry.resetTime,
      }
    }

    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  cleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
  }
}

// Create a singleton instance
const rateLimiter = new RateLimiter()

/**
 * Rate limit middleware for API routes
 * @param identifier - Unique identifier (IP address, widget key, etc.)
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60 * 1000 // 1 minute
) {
  return rateLimiter.check(identifier, limit, windowMs)
}

/**
 * Get headers for rate limit response
 */
export function getRateLimitHeaders(result: {
  allowed: boolean
  remaining: number
  resetTime: number
}) {
  return {
    'X-RateLimit-Limit': '60',
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  }
}
