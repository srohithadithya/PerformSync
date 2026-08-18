import { checkRateLimit } from '@/utils/rate-limit';

describe('Rate Limiter', () => {
  it('allows requests under the limit', () => {
    const isAllowed = checkRateLimit('user1', 5, 10000);
    expect(isAllowed).toBe(true);
  });

  it('blocks requests over the limit', () => {
    // Fill the quota
    checkRateLimit('user2', 2, 10000);
    checkRateLimit('user2', 2, 10000);
    
    // Third request should be blocked
    const isAllowed = checkRateLimit('user2', 2, 10000);
    expect(isAllowed).toBe(false);
  });
});
