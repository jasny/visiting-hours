'use client';

import { useMemo, useState } from 'react';

import { CalendarDTO } from "@/lib/types"

interface Props {
  calendar: CalendarDTO;
  onSelect?: (date: string, time: string) => void;
}

export default function CalendarView({ calendar, onSelect }: Props) {
  const dates = calendar.dates;
  const times = useMemo(() => calendar.times, [calendar.times]);
  const [selected, setSelected] = useState<{ date: string | null; time: string | null }>({
    date: null,
    time: null,
  });

  const handlePick = (date: string, time: string, disabled: boolean) => {
    if (disabled) return;
    setSelected({ date, time });
    onSelect?.(date, time);
  };

  // Helper: simple date label split into day name and date string if provided by calendar
  const toLabel = (date: string) => ({
    day: new Date(date).toLocaleDateString('nl-NL', { weekday: 'long' }),
    dmy: new Date(date).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' }),
  });

  const getState = (date: string, time: string) => calendar.states[date]?.[time] ?? 'disabled';

  return (
    <section className="w-full max-w-5xl mx-auto my-6">
      {/* Desktop grid */}
      <div className="hidden md:grid grid-cols-5 gap-4 mb-8">
        {dates.map((date) => {
          const { day, dmy } = toLabel(date);
          return (
            <div key={date} className="flex flex-col gap-4 rounded-xl border p-4 bg-white/80 backdrop-blur border-indigo-100">
              <div className="text-center">
                <h3 className="text-lg text-indigo-800 mb-1 capitalize">{day}</h3>
                <p className="text-sm text-gray-600">{dmy}</p>
              </div>
              <div className="space-y-2">
                {times.map((time) => {
                  const state = getState(date, time);
                  const disabled = state === 'disabled' || state === 'taken' || state === 'full';
                  const isSelected = selected.date === date && selected.time === time;
                  const base = 'w-full py-2 px-3 rounded-lg border text-sm font-medium transition-all duration-200';
                  const enabledCls = isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300';
                  const disabledCls = 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed';
                  return (
                    <button
                      key={time}
                      className={`${base} ${disabled ? disabledCls : enabledCls}`}
                      disabled={disabled}
                      onClick={() => handlePick(date, time, disabled)}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="inline-block w-3 h-3 rounded-full border border-current" aria-hidden />
                        {time}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile stacked cards */}
      <div className="md:hidden space-y-6 mb-8">
        {dates.map((date) => {
          const { day, dmy } = toLabel(date);
          return (
            <div key={date} className="flex flex-col gap-6 rounded-xl border p-6 bg-white/80 backdrop-blur border-indigo-100">
              <div className="mb-2">
                <h3 className="text-xl text-indigo-800 mb-1 capitalize">{day}</h3>
                <p className="text-gray-600">{dmy}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {times.map((time) => {
                  const state = getState(date, time);
                  const disabled = state === 'disabled' || state === 'taken' || state === 'full';
                  const isSelected = selected.date === date && selected.time === time;
                  const base = 'py-3 px-4 rounded-lg border font-medium transition-all duration-200';
                  const enabledCls = isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300';
                  const disabledCls = 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed';
                  return (
                    <button
                      key={time}
                      className={`${base} ${disabled ? disabledCls : enabledCls}`}
                      disabled={disabled}
                      onClick={() => handlePick(date, time, disabled)}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span className="inline-block w-4 h-4 rounded-full border border-current" aria-hidden />
                        {time}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
