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
    <>
      <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl text-gray-800 mb-4">Plan je bezoek</h2>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
          Kies een moment dat voor jou uitkomt om {page.name} te ontmoeten. We houden de bezoeken kort en gezellig,
          zodat iedereen kan genieten.
        </p>
      </div>
      <CalendarView calendar={calendar} onSelect={handleSelect}/>
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
    </>
  )
}
