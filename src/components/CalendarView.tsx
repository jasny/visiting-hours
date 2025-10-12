'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar as RBCalendar, dateFnsLocalizer, Event as RbcEvent, SlotInfo, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { addMinutes, format as dfFormat, getDay, parse as dfParse, setHours, setMinutes, startOfWeek } from 'date-fns';
import { nl } from 'date-fns/locale';

import { Calendar } from "@/lib/types";
import { futureDate, getSlotVisit, isPeriodFull, isVisitingTime, toDate } from "@/lib/calendar";
import CalendarToolbar from "@/components/CalendarToolbar"

interface Props {
  calendar: Calendar;
  onSelect?: (date: string, time: string, to?: string) => void;
  selectBlocked?: boolean; // admin-only: allow selecting blocked/visit events for editing
}

const locales = { nl } as const;
const localizer = dateFnsLocalizer({
  format: dfFormat,
  parse: dfParse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export default function CalendarView({ calendar, onSelect, selectBlocked }: Props) {
  const dates = calendar.dates;

  // slot size (minutes) provided by DTO
  const step = calendar.step;

  // number of slots per hour (visual rows per hour)
  const timeslots = useMemo(() => {
    const ts = Math.round(60 / step);
    return ts >= 1 ? ts : 1;
  }, [step]);

  // min/max working hours derived from windows
  const minMax = useMemo(() => {
    const firstDate = dates[0] ?? dfFormat(new Date(), 'yyyy-MM-dd');
    const lastDate = dates[dates.length - 1] ?? firstDate;
    const windows = Object.values(calendar.windows).filter(Boolean) as { from: string; to: string }[];
    // Determine earliest start and latest end from filtered windows
    const earliestFrom = windows.length ? windows.map(w => w.from).sort()[0] : '08:00';
    const latestTo = windows.length ? windows.map(w => w.to).sort().slice(-1)[0] : '18:00';
    // Floor min to full hour of earliestFrom (first day)
    const [minH, minM] = earliestFrom.split(':').map(Number);
    const minBase = setMinutes(setHours(new Date(firstDate + 'T00:00:00'), minH), 0);
    const min = minM === 0 ? toDate(firstDate, earliestFrom) : minBase;
    // Ceil max to full hour after latestTo (last day) if needed
    const [maxH, maxM] = latestTo.split(':').map(Number);
    const maxBase = setMinutes(setHours(new Date(lastDate + 'T00:00:00'), maxH + (maxM > 0 ? 1 : 0)), 0);
    const max = maxM === 0 ? toDate(lastDate, latestTo) : maxBase;
    return { min, max };
  }, [dates, calendar.windows]);

  // events for visits (always) and blocked (admin when selectBlocked)
  const visitEvents: RbcEvent[] = useMemo(() => {
    const evs: RbcEvent[] = [];
    for (const v of calendar.slots ?? []) {
      if (v.type !== 'taken') continue;
      const start = toDate(v.date, v.time);
      const end = addMinutes(start, v.duration);
      evs.push({ title: v.name, start, end, resource: { kind: 'taken', slot: v } });
    }
    return evs;
  }, [calendar.slots]);

  const blockedEvents: RbcEvent[] = useMemo(() => {
    if (!selectBlocked) return [];
    const evs: RbcEvent[] = [];
    for (const v of calendar.slots ?? []) {
      if (v.type !== 'blocked') continue;
      const start = toDate(v.date, v.time);
      const end = addMinutes(start, v.duration);
      evs.push({ start, end, resource: { kind: 'blocked', slot: v } });
    }
    return evs;
  }, [calendar.slots, selectBlocked]);

  // responsive view switching
  const [currentView, setCurrentView] = useState<typeof Views[keyof typeof Views]>(Views.WEEK);
  const [availableViews, setAvailableViews] = useState<typeof Views[keyof typeof Views][]>([Views.WEEK, Views.DAY]);
  const [currentDate, setCurrentDate] = useState(() => futureDate(calendar.dates[0]));

  useEffect(() => {
    const decide = () => {
      if (typeof window === 'undefined') return;
      const isSmall = window.innerWidth < 800;
      setCurrentView(isSmall ? Views.DAY : Views.WEEK);
      setAvailableViews(isSmall ? [Views.DAY, Views.WEEK] : [Views.WEEK, Views.DAY]);
    };
    decide();
    window.addEventListener('resize', decide);
    return () => window.removeEventListener('resize', decide);
  }, []);

  // helpers for date range checks
  const minDateStr = dates[0] ?? dfFormat(new Date(), 'yyyy-MM-dd');
  const maxDateStr = dates[dates.length - 1] ?? minDateStr;
  const withinDateRange = (dateStr: string) => dateStr >= minDateStr && dateStr <= maxDateStr;

  // disallow selections in the past (relative to current local time)
  const now = new Date();
  const nowDateStr = dfFormat(now, 'yyyy-MM-dd');
  const nowHM = dfFormat(now, 'HH:mm');
  const notPast = (dateStr: string, timeHM: string) =>
    dateStr > nowDateStr || (dateStr === nowDateStr && timeHM >= nowHM);

  const handleSelectSlot = (slot: SlotInfo) => {
    const start = slot.start as Date;
    if (!canSelect({ start: start })) return;

    const dateStr = dfFormat(start, 'yyyy-MM-dd');
    const timeStr = dfFormat(start, 'HH:mm');
    let toStr: string | undefined;
    const end = slot.end as Date | undefined;
    // Only pass an explicit end when user drag-selects a range
    if ((slot as SlotInfo & { action?: string }).action === 'select' && end && end > start) {
      toStr = dfFormat(end, 'HH:mm');
    }
    onSelect?.(dateStr, timeStr, toStr);
  };

  const canSelect = ({ start }: { start: Date; end?: Date }) => {
    const startStrDate = dfFormat(start, 'yyyy-MM-dd');
    const startHM = dfFormat(start, 'HH:mm');
    return withinDateRange(startStrDate)
      && notPast(startStrDate, startHM)
      && isVisitingTime(calendar, startHM)
      && !getSlotVisit(calendar, startStrDate, startHM)
      && !isPeriodFull(calendar, startStrDate, startHM);
  };

  // helper to style events
  const eventPropGetter = (event: RbcEvent) => {
    const kind = event.resource?.kind as string | undefined;
    if (kind === 'taken') {
      // visits use theme colors
      return {
        className: 'event-visit',
        style: {
          backgroundColor: 'var(--theme-50)',
          borderColor: 'var(--theme-300)',
          color: 'var(--theme-600)'
        }
      }
    }
    if (kind === 'blocked') {
      return {
        className: 'event-blocked',
        style: {
          backgroundColor: '#f3f4f6', // gray-100
          borderColor: '#e5e7eb', // gray-200
          color: '#6b7280'
        }
      }
    }
    return {};
  };

  // gray out days outside the allowed date range (before min or after max)
  const dayPropGetter = (date: Date) => {
    const dateStr = dfFormat(date, 'yyyy-MM-dd');
    if (dateStr < minDateStr || dateStr > maxDateStr) {
      return {
        className: '',
        style: { backgroundColor: '#f3f4f6' }, // gray-100
      };
    }
    return {};
  };

  // style individual time slots: gray out anything that can't be selected (unavailable/full/past)
  const slotPropGetter = (date: Date) => {
    const dateStr = dfFormat(date, 'yyyy-MM-dd');
    const timeHM = dfFormat(date, 'HH:mm');
    // Only apply inside our overall date range; out-of-range days already styled by dayPropGetter
    const selectable = withinDateRange(dateStr)
      && isVisitingTime(calendar, timeHM, calendar.step)
      && !getSlotVisit(calendar, dateStr, timeHM, calendar.step)
      && !isPeriodFull(calendar, dateStr, timeHM);
    if (!selectable) {
      return {
        className: 'timeslot-disabled',
        style: { backgroundColor: '#f3f4f6' }, // gray-100
      };
    }
    return { className: 'timeslot-available' };
  };

  return (
    <section className="w-full max-w-5xl mx-auto my-6 h-[720px] max-h-[80vh]">
      <RBCalendar
        localizer={localizer}
        view={currentView}
        onView={(v) => setCurrentView(v)}
        views={availableViews}
        date={currentDate}
        onNavigate={(date) => setCurrentDate(date)}
        culture="nl"
        min={minMax.min}
        max={minMax.max}
        step={step}
        timeslots={timeslots}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelecting={canSelect}
        events={[...visitEvents, ...blockedEvents]}
        onSelectEvent={(event) => {
          if (!selectBlocked) return;
          const d = event.start as Date;
          const dateStr = dfFormat(d, 'yyyy-MM-dd');
          const timeStr = dfFormat(d, 'HH:mm');
          onSelect?.(dateStr, timeStr);
        }}
        eventPropGetter={eventPropGetter}
        dayPropGetter={dayPropGetter}
        slotPropGetter={slotPropGetter}
        popup={false}
        toolbar={true}
        allDayMaxRows={0}
        components={{ toolbar: CalendarToolbar }}
      />
    </section>
  );
}
