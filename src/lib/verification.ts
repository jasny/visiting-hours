import { cookies } from 'next/headers';
import crypto from 'crypto';

export interface VisitCookie {
  name: string;
  date: string;
  time: string;
  verification: string; // HMAC over reference|date|time
  nonce: string; // random per booking, stored server-side with slot
  duration: number;
}

const HMAC_SECRET = process.env.VISIT_HMAC_SECRET ?? '';

function cookieName(prefix: string, reference: string) {
  return `vh_${prefix}_${reference}`;
}

export function computeVisitVerification(reference: string, date: string, time: string) {
  const data = `${reference}|${date}|${time}`;
  return crypto.createHmac('sha256', HMAC_SECRET).update(data).digest('hex');
}

export async function getVisitCookie(reference: string): Promise<VisitCookie | null> {
  const store = await cookies();
  const raw = store.get(cookieName('visit', reference))?.value;

  if (!raw) return null;

  try {
    const data = JSON.parse(raw) as VisitCookie;
    if (data && data.date && data.time && data.verification && data.nonce) return data;
  } catch {}

  return null;
}

export async function setVisitCookie(reference: string, data: VisitCookie) {
  const [sh, sm] = data.time.split(':').map(Number);
  const expires = new Date(data.date + 'T00:00:00');
  expires.setHours(sh, sm, 0, 0);
  expires.setMinutes(expires.getMinutes() + data.duration);

  const store = await cookies();
  store.set(cookieName('visit', reference), JSON.stringify(data), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    expires,
    path: '/',
  });
}

export async function verifyVisitCookie(reference: string): Promise<VisitCookie | null> {
  const cookie = await getVisitCookie(reference);
  if (!cookie) return null;

  const expected = computeVisitVerification(reference, cookie.date, cookie.time);
  return cookie.verification === expected ? cookie : null;
}

export async function clearVisitCookie(reference: string) {
  const store = await cookies();
  store.delete(cookieName('visit', reference));
}
