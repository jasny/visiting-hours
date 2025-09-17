import { Calendar, Page, Slot, SlotState } from "@/lib/types"

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

function getPeriodForTime(visitingTimes: Record<string, { from: string; to: string }>, time: string) {
  for (const [period, times] of Object.entries(visitingTimes)) {
    if (time >= times.from && time <= times.to) return period;
  }
  return null;
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

function isVisitingTime(page: Page, visitingTimes: Record<string, { from: string; to: string }>, time: string | number, slotSize?: number) {
  let minutes: number;
  if (typeof time === 'string') {
    const [h, m] = time.split(':').map(Number);
    minutes = h * 60 + m;
  } else {
    minutes = time;
  }
  const size = slotSize ?? (page.duration! < 30 ? 15 : 30);
  const timeFrom = minutesToTime(minutes);
  const timeTo = minutesToTime(minutes + size);
  for (const vt of Object.values(visitingTimes)) {
    if (timeFrom >= vt.from && timeTo <= vt.to) return true;
  }
  return false;
}

function computeTimeSlots(page: Page, visitingTimes: Record<string, { from: string; to: string }>): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  const times = visitingTimes;
  if (Object.values(times).length === 0) return map;

  const slotSize = page.duration! < 30 ? 15 : 30;
  const first = Object.values(times)[0];
  const last = Object.values(times)[Object.values(times).length - 1];
  const [startHour, startMin] = first.from.split(':').map(Number);
  let start = startHour * 60 + startMin - slotSize;
  start -= start % slotSize;
  const [endHour, endMin] = last.to.split(':').map(Number);
  let end = endHour * 60 + endMin + slotSize;
  end += end % slotSize;
  for (let t = start; t < end; t += slotSize) {
    const slot = `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`;
    map[slot] = isVisitingTime(page, visitingTimes, t, slotSize);
  }
  return map;
}

function getVisits(page: Page): Slot[] {
  return page.slots ?? [];
}

function isPeriodFull(page: Page, visitingTimes: Record<string, { from: string; to: string }>, date: string, time: string) {
  const period = getPeriodForTime(visitingTimes, time);
  if (!period) return true;
  const amount = (page as unknown as Record<string, number | undefined>)[`${period}_amount`];
  if (!amount) return false;
  let count = 0;
  for (const visit of getVisits(page)) {
    if (visit.date === date && getPeriodForTime(visitingTimes, visit.time) === period) count++;
  }
  return count >= amount;
}

function getSlotVisit(page: Page, date: string, time: string) {
  const [h, m] = time.split(':').map(Number);
  const formatted = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  for (const visit of getVisits(page)) {
    const until = timeAddMinutes(visit.time, visit.duration);
    if (visit.date === date && formatted >= visit.time && formatted < until) return visit;
  }
  return null;
}

function getSlotState(page: Page, visitingTimes: Record<string, { from: string; to: string }>, date: string, time: string): SlotState {
  if (!isVisitingTime(page, visitingTimes, time)) return 'disabled';
  if (getSlotVisit(page, date, time)) return 'taken';
  if (
    new Date(date) < new Date(page.date_from!) ||
    (page.date_to && new Date(date) > new Date(page.date_to))
  ) {
    return 'disabled';
  }
  if (isPeriodFull(page, visitingTimes, date, time)) return 'full';
  return 'available';
}

export function buildCalendarDTO(page: Page): Calendar {
  const dates = computeDates(page);
  const visitingTimes = computeVisitingTimes(page);
  const times = Object.keys(computeTimeSlots(page, visitingTimes));
  const states: Calendar['states'] = {};
  for (const d of dates) {
    states[d] = {};
    for (const t of times) {
      states[d][t] = getSlotState(page, visitingTimes, d, t);
    }
  }
  return { dates, times, states };
}
