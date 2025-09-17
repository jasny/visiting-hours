
import { minutesToTime, timeAddMinutes } from "@/lib/time"
import { CalendarDTO, Page, SlotState, Visit } from "@/lib/types"

export class Calendar {
  private readonly page: Page;

  // Public readonly replacements for previous lazy getters
  public readonly dates: string[];
  public readonly visitingTimes: Record<string, { from: string; to: string }>;
  public readonly timeslots: Record<string, boolean>;

  constructor(page: Page) {
    this.page = page;
    this.dates = this.initDates();
    this.visitingTimes = this.initVisitingTimes();
    this.timeslots = this.initTimeSlots();
  }

  // Initialize all dates in the period
  private initDates(): string[] {
    const result: string[] = [];
    const start = new Date(this.page.date_from!);
    const end = this.page.date_to
      ? new Date(this.page.date_to)
      : new Date(start.getTime() + 14 * 24 * 3600 * 1000);
    for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 24 * 3600 * 1000)) {
      result.push(d.toISOString().slice(0, 10));
    }
    return result;
  }

  // Initialize visiting time ranges per period
  private initVisitingTimes(): Record<string, { from: string; to: string }> {
    const vt: Record<string, { from: string; to: string }> = {};
    const p = this.page;
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

  // Determine if a time falls within any visiting period
  private isVisitingTime(time: string | number, slotSize?: number) {
    let minutes: number;
    if (typeof time === 'string') {
      const [h, m] = time.split(':').map(Number);
      minutes = h * 60 + m;
    } else {
      minutes = time;
    }
    const size = slotSize ?? (this.page.duration! < 30 ? 15 : 30);
    const timeFrom = minutesToTime(minutes);
    const timeTo = minutesToTime(minutes + size);
    for (const vt of Object.values(this.visitingTimes)) {
      if (timeFrom >= vt.from && timeTo <= vt.to) return true;
    }
    return false;
  }

  // Initialize time slots map (string HH:MM -> isVisitingTime)
  private initTimeSlots(): Record<string, boolean> {
    const map: Record<string, boolean> = {};

    const times = this.visitingTimes;
    if (Object.values(times).length === 0) return map;

    const slotSize = this.page.duration! < 30 ? 15 : 30;
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
      map[slot] = this.isVisitingTime(t, slotSize);
    }

    return map;
  }

  private getPeriodForTime(time: string) {
    for (const [period, times] of Object.entries(this.visitingTimes)) {
      if (time >= times.from && time <= times.to) return period;
    }
    return null;
  }

  private getVisits(): Visit[] {
    return this.page.visits ? JSON.parse(this.page.visits) : [];
  }

  isPeriodFull(date: string, time: string) {
    const period = this.getPeriodForTime(time);
    if (!period) return true;
    const amount = (this.page as unknown as Record<string, number | undefined>)[
      `${period}_amount`
    ];
    if (!amount) return false;
    let count = 0;
    for (const visit of this.getVisits()) {
      if (visit.date === date && this.getPeriodForTime(visit.time) === period)
        count++;
    }
    return count >= amount;
  }

  getSlotVisit(date: string, time: string) {
    const [h, m] = time.split(':').map(Number);
    const formatted = `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}`;
    for (const visit of this.getVisits()) {
      const until = timeAddMinutes(visit.time, visit.duration);
      if (visit.date === date && formatted >= visit.time && formatted < until)
        return visit;
    }
    return null;
  }

  getSlotState(date: string, time: string): SlotState {
    if (!this.isVisitingTime(time)) return 'disabled';
    if (this.getSlotVisit(date, time)) return 'taken';
    if (
      new Date(date) < new Date(this.page.date_from!) ||
      (this.page.date_to && new Date(date) > new Date(this.page.date_to))
    ) {
      return 'disabled';
    }
    if (this.isPeriodFull(date, time)) return 'full';
    return 'available';
  }
}

export function buildCalendarDTO(page: Page): CalendarDTO {
  const c = new Calendar(page);
  const dates = c.dates;
  const times = Object.keys(c.timeslots);
  const states: CalendarDTO['states'] = {};
  for (const d of dates) {
    states[d] = {};
    for (const t of times) {
      states[d][t] = c.getSlotState(d, t);
    }
  }
  return { dates, times, states };
}
