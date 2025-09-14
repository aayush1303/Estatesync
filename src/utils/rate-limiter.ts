// Simple in-memory rate limiter for development
// In production, you'd want to use Redis or similar

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private readonly windowMs: number;
  public readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  public async isAllowed(identifier: string): Promise<{ allowed: boolean; resetTime: number; remaining: number }> {
    const now = Date.now();
    const entry = this.store.get(identifier);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      const resetTime = now + this.windowMs;
      this.store.set(identifier, { count: 1, resetTime });
      return {
        allowed: true,
        resetTime,
        remaining: this.maxRequests - 1
      };
    }

    if (entry.count >= this.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        resetTime: entry.resetTime,
        remaining: 0
      };
    }

    // Increment count
    entry.count++;
    this.store.set(identifier, entry);

    return {
      allowed: true,
      resetTime: entry.resetTime,
      remaining: this.maxRequests - entry.count
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Global rate limiter instances
export const createBuyerLimiter = new InMemoryRateLimiter(60000, 5); // 5 creates per minute
export const updateBuyerLimiter = new InMemoryRateLimiter(60000, 10); // 10 updates per minute
export const generalApiLimiter = new InMemoryRateLimiter(60000, 30); // 30 requests per minute

export async function checkRateLimit(
  limiter: InMemoryRateLimiter,
  identifier: string
): Promise<{ allowed: boolean; headers: Record<string, string> }> {
  const result = await limiter.isAllowed(identifier);
  
  const headers = {
    'X-RateLimit-Limit': limiter.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  };

  return {
    allowed: result.allowed,
    headers
  };
}

export function getRateLimitIdentifier(userId: string | null, ip: string): string {
  // Use userId if available, fallback to IP
  return userId || ip || 'anonymous';
}