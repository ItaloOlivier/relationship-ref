import { nanoid } from 'nanoid';

/**
 * Generate a cryptographically secure random token for share links
 * @param length Token length (default: 32)
 * @returns URL-safe random string
 */
export function generateSecureToken(length: number = 32): string {
  return nanoid(length);
}

/**
 * Validate a share token format
 * @param token Token to validate
 * @returns true if token format is valid
 */
export function validateShareTokenFormat(token: string): boolean {
  // nanoid uses: A-Za-z0-9_-
  const tokenRegex = /^[A-Za-z0-9_-]{20,64}$/;
  return tokenRegex.test(token);
}

/**
 * Check if a share token is expired
 * @param expiryDate Expiry date from database
 * @returns true if token is expired
 */
export function isTokenExpired(expiryDate: Date | null): boolean {
  if (!expiryDate) return false; // No expiry = never expires
  return new Date() > expiryDate;
}

/**
 * Calculate expiry date from now
 * @param days Number of days until expiry
 * @returns Expiry date
 */
export function calculateTokenExpiry(days: number): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}
