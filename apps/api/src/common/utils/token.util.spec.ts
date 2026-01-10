import {
  generateSecureToken,
  validateShareTokenFormat,
  isTokenExpired,
  calculateTokenExpiry,
} from './token.util';

describe('Token Utility', () => {
  describe('generateSecureToken', () => {
    it('should generate a 32-character token by default', () => {
      const token = generateSecureToken();
      expect(token).toHaveLength(32);
    });

    it('should generate a token of custom length', () => {
      const token = generateSecureToken(64);
      expect(token).toHaveLength(64);
    });

    it('should generate URL-safe tokens (only alphanumeric, _, -)', () => {
      const token = generateSecureToken();
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSecureToken());
      }
      expect(tokens.size).toBe(100); // All unique
    });
  });

  describe('validateShareTokenFormat', () => {
    it('should validate correct token format', () => {
      const validToken = generateSecureToken();
      expect(validateShareTokenFormat(validToken)).toBe(true);
    });

    it('should reject tokens that are too short', () => {
      expect(validateShareTokenFormat('abc')).toBe(false);
    });

    it('should reject tokens that are too long', () => {
      const longToken = 'a'.repeat(100);
      expect(validateShareTokenFormat(longToken)).toBe(false);
    });

    it('should reject tokens with invalid characters', () => {
      expect(validateShareTokenFormat('invalid!token@with#symbols')).toBe(false);
      expect(validateShareTokenFormat('has spaces in it')).toBe(false);
    });

    it('should accept tokens with underscores and hyphens', () => {
      expect(validateShareTokenFormat('valid_token-with-chars_123')).toBe(true);
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for null expiry (never expires)', () => {
      expect(isTokenExpired(null)).toBe(false);
    });

    it('should return true for past dates', () => {
      const pastDate = new Date('2020-01-01');
      expect(isTokenExpired(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(isTokenExpired(futureDate)).toBe(false);
    });

    it('should return true for current moment (edge case)', () => {
      const now = new Date();
      // Subtract 1ms to ensure it's in the past
      now.setMilliseconds(now.getMilliseconds() - 1);
      expect(isTokenExpired(now)).toBe(true);
    });
  });

  describe('calculateTokenExpiry', () => {
    it('should calculate expiry 7 days from now', () => {
      const expiry = calculateTokenExpiry(7);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 7);

      // Allow 1 second difference for test execution time
      const diff = Math.abs(expiry.getTime() - expectedDate.getTime());
      expect(diff).toBeLessThan(1000);
    });

    it('should calculate expiry 30 days from now', () => {
      const expiry = calculateTokenExpiry(30);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 30);

      const diff = Math.abs(expiry.getTime() - expectedDate.getTime());
      expect(diff).toBeLessThan(1000);
    });

    it('should handle 1 day expiry', () => {
      const expiry = calculateTokenExpiry(1);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 1);

      const diff = Math.abs(expiry.getTime() - expectedDate.getTime());
      expect(diff).toBeLessThan(1000);
    });
  });
});
