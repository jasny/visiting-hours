import { cookies } from 'next/headers';
import crypto from 'crypto';

export interface VisitCookie {
  date: string;
  time: string;
  duration: number;
  verification: string; // HMAC over reference|date|time
}

const HMAC_SECRET = process.env.VISIT_HMAC_SECRET ?? '';

function cookieName(prefix: string, reference: string) {
  return `vh_${prefix}_${reference}`;
}

export function getPageToken(reference: string, nonce: string) {
  const data = `${reference}|${nonce}`;
  return crypto.createHmac('sha256', HMAC_SECRET).update(data).digest('hex');
}

export function verifyPageCookie(reference: string, token: string, nonce: string): boolean {
  return token === getPageToken(reference, nonce);
}

export async function getPageCookie(reference: string): Promise<string | null> {
  const store = await cookies();

  try {
    return store.get(cookieName('visit', reference))?.value ?? null;
  } catch {}

  return null;
}

export async function setPageCookie(reference: string, nonce: string): Promise<void> {
  const token = getPageToken(reference, nonce);

  const store = await cookies();
  store.set(cookieName('visit', reference), token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });
}

export async function clearPageCookie(reference: string): Promise<void> {
  const store = await cookies();
  store.delete(cookieName('visit', reference));
}

export function computeVisitVerification(reference: string, date: string, time: string, nonce: string) {
  const data = `${reference}|${date}|${time}|${nonce}`;
  return crypto.createHmac('sha256', HMAC_SECRET).update(data).digest('hex');
}

export async function getVisitCookie(reference: string): Promise<VisitCookie | null> {
  const store = await cookies();
  const raw = store.get(cookieName('visit', reference))?.value;

  if (!raw) return null;

  try {
    const data = JSON.parse(raw) as VisitCookie;
    if (data && data.date && data.time && data.verification) return data;
  } catch {}

  return null;
}

export async function setVisitCookie(reference: string, data: Omit<VisitCookie, 'verification'>, nonce: string) {
  const verification = computeVisitVerification(reference, data.date, data.time, nonce);

  const [sh, sm] = data.time.split(':').map(Number);
  const expires = new Date(data.date + 'T00:00:00');
  expires.setHours(sh, sm, 0, 0);
  expires.setMinutes(expires.getMinutes() + data.duration);

  const store = await cookies();
  store.set(cookieName('visit', reference), JSON.stringify({ ...data, verification }), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    expires,
    path: '/',
  });
}

export function verifyVisitCookie(reference: string, cookie: VisitCookie, nonce: string): boolean {
  const expected = computeVisitVerification(reference, cookie.date, cookie.time, nonce);
  return cookie.verification === expected;
}

export async function clearVisitCookie(reference: string) {
  const store = await cookies();
  store.delete(cookieName('visit', reference));
}
