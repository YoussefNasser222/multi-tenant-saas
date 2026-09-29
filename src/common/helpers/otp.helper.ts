import { createHash, randomInt, timingSafeEqual } from 'crypto';

/** 5-digit OTP generated with a CSPRNG (Math.random is predictable). */
export const generateOtp = () => {
  return randomInt(10000, 100000).toString();
};

export const generateOtpExpire = () => {
  return new Date(Date.now() + 15 * 60 * 1000);
};

/** We store only a hash of the OTP, so a DB leak doesn't expose usable codes. */
export const hashOtp = (otp: string) =>
  createHash('sha256').update(String(otp)).digest('hex');

/** Constant-time comparison of a plain OTP against the stored hash. */
export const verifyOtp = (plain: string, storedHash?: string | null) => {
  if (!storedHash || typeof plain !== 'string') return false;
  const a = Buffer.from(hashOtp(plain), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
};
