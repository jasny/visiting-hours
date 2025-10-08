'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar as RBCalendar, dateFnsLocalizer, Event as RbcEvent, SlotInfo, Views, } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { addMinutes, format as dfFormat, getDay, parse as dfParse, setHours, setMinutes, startOfWeek } from 'date-fns';
import { nl } from 'date-fns/locale';

import { Calendar } from "@/lib/types";
import { getSlotVisit, isPeriodFull, isVisitingTime, toDate } from "@/lib/calendar";
import CalendarToolbar from "@/components/CalendarToolbar"

interface Props {
  calendar: Calendar;
  onSelect?: (date: string, time: string) => void;
}

const locales = { nl } as const;
const localizer = dateFnsLocalizer({
  format: dfFormat,
  parse: dfParse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export default function CalendarView({ calendar, onSelect }: Props) {
  const dates = calendar.dates;
  const [selected, setSelected] = useState<{ date: string | null; time: string | null }>({
    date: null,
    time: null,
  });

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

  // events for taken visits and full periods (shown as busy) + unavailable gaps
  const busyEvents: RbcEvent[] = useMemo(() => {
    const evs: RbcEvent[] = [];

    const dayWindows = Object.values(calendar.windows).filter(Boolean) as { from: string; to: string }[];
    const earliestFrom = dayWindows.length ? dayWindows.map(w => w.from).sort()[0] : null;
    const latestTo = dayWindows.length ? dayWindows.map(w => w.to).sort().slice(-1)[0] : null;

    // existing visits as busy blocks spanning their duration
    for (const v of calendar.visits ?? []) {
      const start = toDate(v.date, v.time);
      const end = addMinutes(start, v.duration);
      evs.push({ title: 'Bezet', start, end, resource: { kind: 'busy' } });
    }

    // Sort visiting windows by start time for gap computation
    const sortedWindows = [...dayWindows].sort((a, b) => a.from.localeCompare(b.from));

    // per date events
    for (const date of dates) {
      // Full periods per date as one continuous busy block
      for (const [period, vt] of Object.entries(calendar.windows)) {
        if (!vt) continue;
        if (isPeriodFull(calendar, date, vt.from)) {
          const start = toDate(date, vt.from);
          const end = toDate(date, vt.to);
          evs.push({ title: 'Vol', start, end, resource: { kind: 'full', period } });
        }
      }

      // Unavailable before earliest window
      if (earliestFrom) {
        const dayMin = setMinutes(setHours(new Date(date + 'T00:00:00'), (minMax.min as Date).getHours()), (minMax.min as Date).getMinutes());
        const firstStart = toDate(date, earliestFrom);
        if (dayMin < firstStart) {
          evs.push({ title: 'Niet beschikbaar', start: dayMin, end: firstStart, resource: { kind: 'unavailable' } });
        }
      }

      // Unavailable gaps between visiting windows
      for (let i = 0; i < sortedWindows.length - 1; i++) {
        const current = sortedWindows[i];
        const next = sortedWindows[i + 1];
        const gapStart = toDate(date, current.to);
        const gapEnd = toDate(date, next.from);
        if (gapStart < gapEnd) {
          evs.push({ title: 'Niet beschikbaar', start: gapStart, end: gapEnd, resource: { kind: 'unavailable' } });
        }
      }

      // Unavailable after latest window
      if (latestTo) {
        const lastEnd = toDate(date, latestTo);
        const dayMax = setMinutes(setHours(new Date(date + 'T00:00:00'), (minMax.max as Date).getHours()), (minMax.max as Date).getMinutes());
        if (lastEnd < dayMax) {
          evs.push({ title: 'Niet beschikbaar', start: lastEnd, end: dayMax, resource: { kind: 'unavailable' } });
        }
      }
    }

    return evs;
  }, [calendar, dates, minMax.min, minMax.max]);

  const defaultDate = useMemo(() => new Date(dates[0] ?? new Date()), [dates]);

  // responsive view switching
  const [currentView, setCurrentView] = useState<typeof Views[keyof typeof Views]>(Views.WEEK);
  const [availableViews, setAvailableViews] = useState<typeof Views[keyof typeof Views][]>([Views.WEEK, Views.DAY]);
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
    const dateStr = dfFormat(start, 'yyyy-MM-dd');
    const timeStr = dfFormat(start, 'HH:mm');
    const canSelect = withinDateRange(dateStr)
      && notPast(dateStr, timeStr)
      && isVisitingTime(calendar, timeStr)
      && !getSlotVisit(calendar, dateStr, timeStr)
      && !isPeriodFull(calendar, dateStr, timeStr);
    if (!canSelect) return;
    setSelected({ date: dateStr, time: timeStr });
    onSelect?.(dateStr, timeStr);
  };

  const onSelecting = ({ start }: { start: Date; end: Date }) => {
    const startStrDate = dfFormat(start, 'yyyy-MM-dd');
    const startHM = dfFormat(start, 'HH:mm');
    return withinDateRange(startStrDate)
      && notPast(startStrDate, startHM)
      && isVisitingTime(calendar, startHM)
      && !getSlotVisit(calendar, startStrDate, startHM)
      && !isPeriodFull(calendar, startStrDate, startHM);
  };

  // helper to style events and selected slot marker
  const eventPropGetter = (event: RbcEvent) => {
    const kind = event.resource.kind as string | undefined;
    if (kind === 'selected') {
      return {
        className: '',
        style: {
          backgroundColor: '#bfdbfe', // blue-200
          borderColor: '#60a5fa',
          color: '#1e3a8a',
        },
      };
    }
    if (kind === 'unavailable') {
      return {
        className: '',
        style: {
          backgroundColor: '#f3f4f6', // gray-100
          borderColor: '#e5e7eb',
          color: '#6b7280',
        },
      };
    }
    return {
      className: '',
      style: {
        backgroundColor: '#e5e7eb',
        borderColor: '#d1d5db',
        color: '#374151',
      },
    };
  };

  // selected event overlay
  const selectedEvents: RbcEvent[] = useMemo(() => {
    if (!selected.date || !selected.time) return [];
    const start = toDate(selected.date, selected.time);
    const end = addMinutes(start, calendar.duration);
    return [{ start, end, resource: { kind: 'selected' } }];
  }, [selected, calendar.duration]);

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

  return (
    <section className="w-full max-w-5xl mx-auto my-6">
      <RBCalendar
        localizer={localizer}
        view={currentView}
        onView={(v) => setCurrentView(v)}
        defaultView={Views.WEEK}
        views={availableViews}
        defaultDate={defaultDate}
        culture="nl"
        min={minMax.min}
        max={minMax.max}
        step={step}
        timeslots={timeslots}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelecting={onSelecting}
        events={[...busyEvents, ...selectedEvents]}
        eventPropGetter={eventPropGetter}
        dayPropGetter={dayPropGetter}
        popup={false}
        toolbar={true}
        allDayMaxRows={0}
        style={{ height: 720, background: 'white', borderRadius: 12, padding: 8 }}
        components={{ toolbar: CalendarToolbar }}
      />
      <style jsx global>{`
        .rbc-calendar {
          background: #ffffff;
        }
        .rbc-header {
          color: #111827;
          background: #ffffff;
          border-color: #e5e7eb;
          font-weight: 600;
        }
        .rbc-time-gutter .rbc-timeslot-group,
        .rbc-time-gutter .rbc-time-slot,
        .rbc-label {
          color: #374151;
        }
        .rbc-time-content > * + * > * {
          border-color: #e5e7eb;
        }
        .rbc-time-content {
          border-top-color: #e5e7eb;
        }
        .rbc-today {
          background-color: inherit;
        }
        .rbc-event {
          background-color: #e5e7eb;
          color: #111827;
          border: 1px solid #d1d5db;
        }
        .rbc-allday-cell {
          display: none;
        }
      `}</style>
    </section>
  );
}
