import { Calendar, Page, Slot } from "@/lib/types"
import { setHours, setMinutes } from "date-fns"

function computeDates(page: Page): string[] {
  const result: string[] = [];
  const start = new Date(page.date_from!);
  const end = page.date_to ? new Date(page.date_to) : new Date(start.getTime() + 14 * 24 * 3600 * 1000);
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 24 * 3600 * 1000)) {
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

function computeVisitingTimes(page: Page): Record<string, { from: string; to: string }> {
  const vt: Record<string, { from: string; to: string }> = {};
  const p = page;
  if (p.morning_from)
    vt['morning'] = {
      from: p.morning_from.padStart(5, '0'),
      to: p.morning_to!.padStart(5, '0'),
    };
  if (p.afternoon_from)
    vt['afternoon'] = {
      from: p.afternoon_from.padStart(5, '0'),
      to: p.afternoon_to!.padStart(5, '0'),
    };
  if (p.evening_from)
    vt['evening'] = {
      from: p.evening_from.padStart(5, '0'),
      to: p.evening_to!.padStart(5, '0'),
    };
  return vt;
}

function minutesToTime(minutes: number) {
  return `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60)
    .toString()
    .padStart(2, '0')}`;
}

function timeAddMinutes(time: string, addMinutes: number) {
  const [h, m] = time.split(':').map(Number);
  const sum = h * 60 + m + addMinutes;
  return minutesToTime(sum);
}

function getVisits(page: Page): Slot[] {
  return page.slots ?? [];
}

export function buildCalendar(page: Page): Calendar {
  const dates = computeDates(page);
  const step = page.duration! < 30 ? 15 : 30;
  const visits = getVisits(page);
  const capacities: Calendar['capacities'] = {
    morning: page.morning_amount,
    afternoon: page.afternoon_amount,
    evening: page.evening_amount,
  };
  // compute windows and drop periods with zero capacity (ignore dayparts with 0 visits)
  const rawWindows = computeVisitingTimes(page) as Calendar['windows'];
  const windows = Object.fromEntries(
    Object.entries(rawWindows).filter(([key, vt]) => {
      const cap = capacities[key as keyof Calendar['capacities']];
      return !!vt && (cap === undefined || cap > 0);
    })
  ) as Calendar['windows'];
  const duration = page.duration;

  return { dates, step, windows, slots: visits, capacities, duration };
}

export function isVisitingTime(cal: Calendar, timeHM: string, duration?: number): boolean {
  // ensure selection fits fully within at least one window using visit duration
  const timeTo = timeAddMinutes(timeHM, duration ?? cal.duration);
  for (const vt of Object.values(cal.windows)) {
    if (vt && timeHM >= vt.from && timeTo <= vt.to) return true;
  }
  return false;
}

export function getSlotVisit(cal: Calendar, date: string, timeHM: string, duration?: number): Slot | null {
  const [h, m] = timeHM.split(':').map(Number);
  const startHM = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  const endHM = timeAddMinutes(startHM, duration ?? cal.duration);
  for (const visit of cal.slots ?? []) {
    if (visit.date !== date) continue;
    const visitEnd = timeAddMinutes(visit.time, visit.duration);
    // overlap if not (proposed ends before existing starts OR proposed starts after existing ends)
    const overlaps = !(endHM <= visit.time || startHM >= visitEnd);
    if (overlaps) return visit;
  }
  return null;
}

export function isPeriodFull(cal: Calendar, date: string, timeHM: string): boolean {
  // find which period the time belongs to
  const period = (() => {
    for (const [key, vt] of Object.entries(cal.windows)) {
      if (vt && timeHM >= vt.from && timeHM <= vt.to) return key as keyof Calendar['capacities'];
    }
    return null;
  })();
  if (!period) return true;
  const capacity = cal.capacities[period];
  if (!capacity || capacity <= 0) return false;
  let count = 0;
  for (const visit of cal.slots ?? []) {
    const vt = cal.windows[period];
    if (!vt) continue;
    if (visit.date !== date) continue;
    if (visit.time >= vt.from && visit.time <= vt.to) count++;
  }
  return count >= capacity;
}

export function toDate(dateStr: string, hm: string) {
  const [h, m] = hm.split(':').map(Number);
  const d = new Date(dateStr + 'T00:00:00');
  return setMinutes(setHours(d, h), m);
}

export function isTimeAvailable(cal: Calendar | Page, date: string, timeHM: string): boolean {
  if (isPage(cal)) cal = buildCalendar(cal);

  const minDate = cal.dates[0];
  const maxDate = cal.dates[cal.dates.length - 1] ?? minDate;
  if (!minDate || date < minDate || date > maxDate) return false;

  const now = new Date();
  const nowDateStr = now.toISOString().slice(0, 10);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const nowHM = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  return (date > nowDateStr || (date === nowDateStr && timeHM >= nowHM)) &&
    isVisitingTime(cal, timeHM) &&
    !isPeriodFull(cal, date, timeHM) &&
    !getSlotVisit(cal, date, timeHM);
}

function isPage(input: Calendar | Page): input is Page {
  return 'reference' in input;
}
