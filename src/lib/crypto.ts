import crypto from 'crypto';

const ALPHANUM = '0123456789abcdefghijklmnopqrstuvwxyz'; // base36

/**
 * Generate a cryptographically secure random base36 (alphanumeric) string.
 * Uses rejection sampling to ensure uniform distribution across the 36-char alphabet.
 *
 * @param length number of characters to generate (default 8)
 */
export function randomString(length: number = 8): string {
  if (length <= 0) return '';

  const result: string[] = [];
  // We consume random bytes in chunks; to avoid bias when mapping 0-255 to 0-35,
  // we only accept values < 252 (floor(256 / 36) * 36). Others are discarded.
  const acceptThreshold = 252; // 36 * 7

  while (result.length < length) {
    const needed = length - result.length;
    // Request a bit more than needed to reduce syscalls; upper bound doesn't matter
    const buf = crypto.randomBytes(Math.max(needed * 2, 16));
    for (let i = 0; i < buf.length && result.length < length; i++) {
      const byte = buf[i];
      if (byte >= acceptThreshold) continue; // reject to prevent modulo bias
      const idx = byte % 36;
      result.push(ALPHANUM[idx]);
    }
  }

  return result.join('');
}

export function randomNonce(): string {
  const buf = crypto.randomBytes(32);
  return buf.toString('hex');
}
