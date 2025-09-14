import { InMemoryRateLimiter, checkRateLimit, getRateLimitIdentifier } from '../utils/rate-limiter';

describe('Rate Limiter', () => {
  describe('InMemoryRateLimiter', () => {
    it('should allow requests within limit', async () => {
      const limiter = new InMemoryRateLimiter(60000, 3); // 3 requests per minute
      const identifier = 'test-user';

      const result1 = await limiter.isAllowed(identifier);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(2);

      const result2 = await limiter.isAllowed(identifier);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(1);

      const result3 = await limiter.isAllowed(identifier);
      expect(result3.allowed).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it('should reject requests after limit exceeded', async () => {
      const limiter = new InMemoryRateLimiter(60000, 2); // 2 requests per minute
      const identifier = 'test-user-2';

      // Use up the limit
      await limiter.isAllowed(identifier);
      await limiter.isAllowed(identifier);

      // This should be rejected
      const result = await limiter.isAllowed(identifier);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset after window expires', async () => {
      const limiter = new InMemoryRateLimiter(100, 1); // 1 request per 100ms
      const identifier = 'test-user-3';

      // Use up the limit
      const result1 = await limiter.isAllowed(identifier);
      expect(result1.allowed).toBe(true);

      // Should be rejected immediately
      const result2 = await limiter.isAllowed(identifier);
      expect(result2.allowed).toBe(false);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 110));

      // Should be allowed again
      const result3 = await limiter.isAllowed(identifier);
      expect(result3.allowed).toBe(true);
    });

    it('should handle different identifiers independently', async () => {
      const limiter = new InMemoryRateLimiter(60000, 1); // 1 request per minute
      
      const result1 = await limiter.isAllowed('user1');
      expect(result1.allowed).toBe(true);

      const result2 = await limiter.isAllowed('user2');
      expect(result2.allowed).toBe(true);

      // Both users should be at their limit now
      const result3 = await limiter.isAllowed('user1');
      expect(result3.allowed).toBe(false);

      const result4 = await limiter.isAllowed('user2');
      expect(result4.allowed).toBe(false);
    });
  });

  describe('checkRateLimit', () => {
    it('should return proper headers when allowed', async () => {
      const limiter = new InMemoryRateLimiter(60000, 5);
      const result = await checkRateLimit(limiter, 'test-user');

      expect(result.allowed).toBe(true);
      expect(result.headers['X-RateLimit-Limit']).toBe('5');
      expect(result.headers['X-RateLimit-Remaining']).toBe('4');
      expect(result.headers['X-RateLimit-Reset']).toBeDefined();
    });

    it('should return proper headers when rejected', async () => {
      const limiter = new InMemoryRateLimiter(60000, 1);
      const identifier = 'test-user-limit';
      
      // Use up the limit
      await checkRateLimit(limiter, identifier);
      
      // Should be rejected
      const result = await checkRateLimit(limiter, identifier);
      expect(result.allowed).toBe(false);
      expect(result.headers['X-RateLimit-Remaining']).toBe('0');
    });
  });

  describe('getRateLimitIdentifier', () => {
    it('should prefer userId over IP', () => {
      const result = getRateLimitIdentifier('user123', '192.168.1.1');
      expect(result).toBe('user123');
    });

    it('should fallback to IP when no userId', () => {
      const result = getRateLimitIdentifier(null, '192.168.1.1');
      expect(result).toBe('192.168.1.1');
    });

    it('should use anonymous when neither available', () => {
      const result = getRateLimitIdentifier(null, '');
      expect(result).toBe('anonymous');
    });
  });
});