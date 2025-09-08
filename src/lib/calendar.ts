import type { Page, Visit } from '@/services/pageService';

export class Calendar {
  private readonly page: Page;
  private periodDates?: string[];
  private visitingTimes?: Record<string, { from: string; to: string }>;
  private timeSlots?: Record<string, boolean>;

  constructor(page: Page) {
    this.page = page;
  }

  getDates(): string[] {
    if (!this.periodDates) {
      this.periodDates = [];
      const start = new Date(this.page.date_from!);
      const end = this.page.date_to
        ? new Date(this.page.date_to)
        : new Date(start.getTime() + 14 * 24 * 3600 * 1000);
      for (
        let d = new Date(start);
        d <= end;
        d = new Date(d.getTime() + 24 * 3600 * 1000)
      ) {
        this.periodDates.push(d.toISOString().slice(0, 10));
      }
    }
    return this.periodDates;
  }

  getVisitingTimes() {
    if (!this.visitingTimes) {
      this.visitingTimes = {};
      const p = this.page;
      if (p.morning_from)
        this.visitingTimes['morning'] = {
          from: p.morning_from.padStart(5, '0'),
          to: p.morning_to!.padStart(5, '0'),
        };
      if (p.afternoon_from)
        this.visitingTimes['afternoon'] = {
          from: p.afternoon_from.padStart(5, '0'),
          to: p.afternoon_to!.padStart(5, '0'),
        };
      if (p.evening_from)
        this.visitingTimes['evening'] = {
          from: p.evening_from.padStart(5, '0'),
          to: p.evening_to!.padStart(5, '0'),
        };
    }
    return this.visitingTimes;
  }

  private isVisitingTime(time: string | number, slotSize?: number) {
    let minutes: number;
    if (typeof time === 'string') {
      const [h, m] = time.split(':').map(Number);
      minutes = h * 60 + m;
    } else {
      minutes = time;
    }
    const size = slotSize ?? (this.page.duration! < 30 ? 15 : 30);
    const timeFrom = Calendar.minutesToTime(minutes);
    const timeTo = Calendar.minutesToTime(minutes + size);
    for (const vt of Object.values(this.getVisitingTimes())) {
      if (timeFrom >= vt.from && timeTo <= vt.to) return true;
    }
    return false;
  }

  getTimeSlots() {
    if (!this.timeSlots) {
      this.timeSlots = {};
      const times = this.getVisitingTimes();
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
        this.timeSlots[slot] = this.isVisitingTime(t, slotSize);
      }
    }
    return this.timeSlots;
  }

  private getPeriodForTime(time: string) {
    for (const [period, times] of Object.entries(this.getVisitingTimes())) {
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
      const until = Calendar.timeAddMinutes(visit.time, visit.duration);
      if (visit.date === date && formatted >= visit.time && formatted < until)
        return visit;
    }
    return null;
  }

  getSlotState(date: string, time: string) {
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

  static timeAddMinutes(time: string, addMinutes: number) {
    const [h, m] = time.split(':').map(Number);
    const sum = h * 60 + m + addMinutes;
    return Calendar.minutesToTime(sum);
  }

  static minutesToTime(minutes: number) {
    return `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60)
      .toString()
      .padStart(2, '0')}`;
  }
}
