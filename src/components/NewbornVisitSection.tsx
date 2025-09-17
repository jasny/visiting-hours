'use client';

import { useState } from 'react';
import CalendarView from '@/components/CalendarView';
import VisitForm from '@/components/VisitForm';
import { Calendar } from "@/lib/types"

interface Props {
  calendar: Calendar;
  reference: string;
}

export default function NewbornVisitSection({ calendar, reference }: Props) {
  const [selected, setSelected] = useState<{ date: string | null; time: string | null }>({
    date: null,
    time: null,
  });

  return (
    <div className="flex flex-col gap-2">
      <CalendarView calendar={calendar} onSelect={(date, time) => setSelected({ date, time })} />
      <VisitForm reference={reference} selected={selected} />
    </div>
  );
}
