'use client';

import { useState } from 'react';
import CalendarView from '@/components/CalendarView';
import VisitForm from '@/components/VisitForm';
import { Calendar } from "@/lib/types"

interface Props {
  calendar: Calendar;
  reference: string;
}

export default function VisitSection({ calendar, reference }: Props) {
  const [selected, setSelected] = useState<{ date: string | null; time: string | null }>({
    date: null,
    time: null,
  });
  const [showForm, setShowForm] = useState(false);

  const handleSelect = (date: string, time: string) => {
    setSelected({ date, time });
    setShowForm(true);
  };

  return (
    <div className="flex flex-col gap-2">
      <CalendarView calendar={calendar} onSelect={handleSelect} />
      <VisitForm
        reference={reference}
        calendar={calendar}
        selected={selected}
        visible={showForm}
        onClose={() => setShowForm(false)}
      />
    </div>
  );
}
