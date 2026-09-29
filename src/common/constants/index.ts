/**
 * Fields that must NEVER leave the server (password hash, OTP data, lockout counters).
 * Use with mongoose `select` (string form) in every query whose result is sent to a client.
 */
export const SENSITIVE_SELECT =
  '-password -otp -otpExpired -otpAttempts -otpLockedUntil -loginAttempts -loginLockedUntil';

/** Same list as an array, used to strip the fields from `toObject()` results. */
export const SENSITIVE_FIELDS = [
  'password',
  'otp',
  'otpExpired',
  'otpAttempts',
  'otpLockedUntil',
  'loginAttempts',
  'loginLockedUntil',
] as const;

/** Removes the sensitive fields from a plain object (returns a shallow copy). */
export function stripSensitive<T extends Record<string, any>>(obj: T): Omit<T, (typeof SENSITIVE_FIELDS)[number]> {
  const copy: Record<string, any> = { ...obj };
  for (const f of SENSITIVE_FIELDS) delete copy[f];
  return copy as any;
}

/** Hard cap for list endpoints that used to return an unbounded collection. */
export const DEFAULT_LIST_LIMIT = 1000;

/** Upload limits shared by every FileInterceptor (Vercel itself caps bodies at ~4.5MB). */
export const UPLOAD_LIMITS = { fileSize: 5 * 1024 * 1024, files: 1 } as const;
