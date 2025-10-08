'use client';

import { useMemo, useState } from 'react';
import {
  Calendar as RBCalendar,
  dateFnsLocalizer,
  Views,
  SlotInfo,
} from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format as dfFormat, parse as dfParse, startOfWeek, getDay, addMinutes, setHours, setMinutes } from 'date-fns';
import { nl } from 'date-fns/locale';

import { Calendar } from "@/lib/types";
import { dtoGetSlotVisit, dtoIsPeriodFull, dtoIsVisitingTime } from "@/lib/calendar";
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

type RbcEvent = { title: string; start: Date; end: Date; resource?: unknown };

function toDate(dateStr: string, hm: string) {
  const [h, m] = hm.split(':').map(Number);
  const d = new Date(dateStr + 'T00:00:00');
  return setMinutes(setHours(d, h), m);
}

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

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
    const windows = Object.values(calendar.windows).filter(Boolean) as { from: string; to: string }[];
    // Determine earliest start and latest end from filtered windows
    const earliestFrom = windows.length ? windows.map(w => w.from).sort()[0] : '08:00';
    const latestTo = windows.length ? windows.map(w => w.to).sort().slice(-1)[0] : '18:00';
    // Floor min to full hour of earliestFrom
    const [minH, minM] = earliestFrom.split(':').map(Number);
    const minBase = setMinutes(setHours(new Date(firstDate + 'T00:00:00'), minH), 0);
    const min = minM === 0 ? toDate(firstDate, earliestFrom) : minBase;
    // Ceil max to full hour after latestTo if needed
    const [maxH, maxM] = latestTo.split(':').map(Number);
    const maxBase = setMinutes(setHours(new Date(firstDate + 'T00:00:00'), maxH + (maxM > 0 ? 1 : 0)), 0);
    const max = maxM === 0 ? toDate(firstDate, latestTo) : maxBase;
    return { min, max };
  }, [dates, calendar.windows]);

  // events for taken visits and full periods (shown as busy)
  const busyEvents: RbcEvent[] = useMemo(() => {
    const evs: RbcEvent[] = [];

    const windows = Object.values(calendar.windows).filter(Boolean) as { from: string; to: string }[];
    const earliestFrom = windows.length ? windows.map(w => w.from).sort()[0] : null;
    const latestTo = windows.length ? windows.map(w => w.to).sort().slice(-1)[0] : null;

    // existing visits as busy blocks spanning their duration
    for (const v of calendar.visits ?? []) {
      const start = toDate(v.date, v.time);
      const end = addMinutes(start, v.duration);
      evs.push({ title: 'Bezet', start, end });
    }

    // full periods per date as one continuous busy block
    for (const date of dates) {
      for (const [period, vt] of Object.entries(calendar.windows)) {
        if (!vt) continue;
        if (dtoIsPeriodFull(calendar, date, vt.from)) {
          const start = toDate(date, vt.from);
          const end = toDate(date, vt.to);
          evs.push({ title: 'Vol', start, end, resource: { period } });
        }
      }
      // padding blocks in the first/last hour if windows start/end mid-hour
      if (earliestFrom) {
        const [h, m] = earliestFrom.split(':').map(Number);
        if (m > 0) {
          const padStart = setMinutes(setHours(new Date(date + 'T00:00:00'), h), 0);
          const padEnd = toDate(date, earliestFrom);
          evs.push({ title: 'Niet beschikbaar', start: padStart, end: padEnd });
        }
      }
      if (latestTo) {
        const [h, m] = latestTo.split(':').map(Number);
        if (m > 0) {
          const padStart = toDate(date, latestTo);
          const padEnd = setMinutes(setHours(new Date(date + 'T00:00:00'), h + 1), 0);
          evs.push({ title: 'Niet beschikbaar', start: padStart, end: padEnd });
        }
      }
    }

    return evs;
  }, [calendar.visits, calendar.windows, dates]);

  const defaultDate = useMemo(() => new Date(dates[0] ?? new Date()), [dates]);

  const handleSelectSlot = (slot: SlotInfo) => {
    const start = slot.start as Date;
    const dateStr = dfFormat(start, 'yyyy-MM-dd');
    const timeStr = dfFormat(start, 'HH:mm');
    const canSelect = dtoIsVisitingTime(calendar, timeStr)
      && !dtoGetSlotVisit(calendar, dateStr, timeStr)
      && !dtoIsPeriodFull(calendar, dateStr, timeStr);
    if (!canSelect) return;
    setSelected({ date: dateStr, time: timeStr });
    onSelect?.(dateStr, timeStr);
  };

  const onSelecting = ({ start }: { start: Date; end: Date }) => {
    const startStrDate = dfFormat(start, 'yyyy-MM-dd');
    const startHM = dfFormat(start, 'HH:mm');
    return dtoIsVisitingTime(calendar, startHM)
      && !dtoGetSlotVisit(calendar, startStrDate, startHM)
      && !dtoIsPeriodFull(calendar, startStrDate, startHM);
  };

  // helper to style events and selected slot marker
  const eventPropGetter = (event: RbcEvent) => {
    return {
      className: '',
      style: {
        backgroundColor: '#e5e7eb',
        borderColor: '#d1d5db',
        color: '#374151',
      },
    };
  };

  return (
    <section className="w-full max-w-5xl mx-auto my-6">
      <RBCalendar
        localizer={localizer}
        defaultView={Views.WEEK}
        views={[Views.WEEK]}
        date={defaultDate}
        culture="nl"
        min={minMax.min}
        max={minMax.max}
        step={step}
        timeslots={timeslots}
        showMultiDayTimes
        selectable
        onSelectSlot={handleSelectSlot}
        onSelecting={onSelecting}
        events={busyEvents}
        eventPropGetter={eventPropGetter}
        popup={false}
        toolbar={true}
        allDayMaxRows={0}
        style={{ height: 720, background: 'white', borderRadius: 12, padding: 8 }}
        components={{ toolbar: CalendarToolbar }}
      />
      {selected.date && selected.time ? (
        <p className="mt-3 text-sm text-gray-700">Geselecteerd: {selected.date} om {selected.time}</p>
      ) : null}
      <style jsx global>{`
        .rbc-calendar {
          background: #ffffff;
        }
        .rbc-toolbar {
          color: #111827;
        }
        .rbc-toolbar button {
          color: #111827;
          border-color: #e5e7eb;
        }
        .rbc-toolbar button.rbc-active,
        .rbc-toolbar button:focus,
        .rbc-toolbar button:hover {
          background-color: #f3f4f6;
          border-color: #d1d5db;
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
          background-color: #f9fafb;
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
