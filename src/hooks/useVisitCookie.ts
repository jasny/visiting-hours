'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Slot } from '@/lib/types';

// Cookie helpers for a simple JSON payload. No security concerns for now.
function cookieName(reference: string) {
  return `vh_visit_${reference}`;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((p) => p.startsWith(name + '='));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function writeCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export type VisitCookie = Pick<Slot, 'date' | 'time' | 'name'> & { duration?: number };

export function useVisitCookie(reference: string) {
  const [visit, setVisit] = useState<VisitCookie | null>(null);

  // read on mount and when reference changes
  useEffect(() => {
    const raw = readCookie(cookieName(reference));
    if (!raw) {
      setVisit(null);
      return;
    }
    try {
      const v = JSON.parse(raw) as VisitCookie;
      if (v && v.date && v.time && v.name) setVisit(v);
      else setVisit(null);
    } catch {
      setVisit(null);
    }
  }, [reference]);

  const store = useCallback((v: VisitCookie) => {
    writeCookie(cookieName(reference), JSON.stringify(v));
    setVisit(v);
  }, [reference]);

  const clear = useCallback(() => {
    deleteCookie(cookieName(reference));
    setVisit(null);
  }, [reference]);

  return { visit, store, clear } as const;
}
