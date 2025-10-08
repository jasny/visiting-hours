'use client';

import { useMemo, useState } from 'react';
import CalendarView from '@/components/CalendarView';
import VisitForm from '@/components/VisitForm';
import { Page } from "@/lib/types"
import { buildCalendar } from "@/lib/calendar"

interface Props {
  page: Page;
}

export default function VisitSection({ page }: Props) {
  const calendar = useMemo(() => buildCalendar(page), [page]);

  const [selected, setSelected] = useState<{ date: string | null; time: string | null }>({
    date: null,
    time: null,
  });
  const [showForm, setShowForm] = useState(false);

  const handleSelect = (date: string, time: string) => {
    setSelected({ date, time });
    setShowForm(true);
  };

  if (!calendar) return <></>;

  return (
    <div className="flex flex-col gap-2">
      <CalendarView calendar={calendar} onSelect={handleSelect} />
      <VisitForm
        reference={page.reference}
        calendar={calendar}
        selected={selected}
        visible={showForm}
        onClose={(slot) => {
          if (slot) page.slots.push(slot);
          setShowForm(false)
        }}
      />
    </div>
  );
}
