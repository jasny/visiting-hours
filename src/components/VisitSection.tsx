'use client';

import { useMemo, useState, useTransition } from 'react';
import CalendarView from '@/components/CalendarView';
import VisitForm from '@/components/VisitForm';
import { Page, Slot } from "@/lib/types"
import { buildCalendar } from "@/lib/calendar"
import { Card } from 'primereact/card';
import { useVisitCookie } from '@/hooks/useVisitCookie';
import { cancelVisit } from '@/services/pageService';

interface Props {
  page: Page;
}

export default function VisitSection({ page }: Props) {
  const calendar = useMemo(() => buildCalendar(page), [page]);
  const { visit, clear } = useVisitCookie(page.reference);
  const [pending, startTransition] = useTransition();

  const [selected, setSelected] = useState<{ date: string | null; time: string | null }>({
    date: null,
    time: null,
  });
  const [showForm, setShowForm] = useState(false);

  const handleSelect = (date: string, time: string) => {
    setSelected({ date, time });
    setShowForm(true);
  };

  const handleCancel = () => {
    if (!visit) return;
    startTransition(async () => {
      // try to cancel on server; ignore failure for example or already-removed
      if (page.reference) {
        try { await cancelVisit(page.reference, { date: visit.date, time: visit.time, name: visit.name }); } catch {}
      }
      // remove from local page.slots
      const idx = page.slots.findIndex((s: Slot) => s.date === visit.date && s.time === visit.time && s.name === visit.name);
      if (idx >= 0) page.slots.splice(idx, 1);
      clear();
    });
  };

  if (!calendar) return <></>;

  const hasVisit = !!visit;

  const title = hasVisit ? 'Jouw afspraak' : 'Plan je bezoek';

  const addressLines: string[] = [];
  if (page.city) addressLines.push(page.city);
  if (page.street) addressLines.push(page.street);
  if (page.postalcode) addressLines.push(page.postalcode);

  return (
    <>
      <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl text-gray-800 mb-4">{title}</h2>
        {!hasVisit && (
          <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
            Kies een moment dat voor jou uitkomt om {page.name} te ontmoeten. We houden de bezoeken kort en gezellig,
            zodat iedereen kan genieten.
          </p>
        )}
      </div>

      {hasVisit ? (
        <Card
          className="shadow-sm"
          title={<span className="font-bold">Jouw afspraak</span>}
          footer={
            <div className="flex justify-end">
              <button type="button" className="p-button p-button-text" onClick={handleCancel} disabled={pending}>
                Afspraak annuleren
              </button>
            </div>
          }
        >
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="text-center min-w-[120px]">
              <div className="uppercase">{new Date(`${visit!.date}T00:00:00`).toLocaleDateString('nl-NL', { weekday: 'short' })}</div>
              <div className="font-bold text-4xl leading-tight">{new Date(`${visit!.date}T00:00:00`).getDate()}</div>
              <div>{new Date(`${visit!.date}T00:00:00`).toLocaleDateString('nl-NL', { month: 'long' })}</div>
              <div className="mt-2 font-bold">{visit!.time} - {formatEndTime(visit!.time, visit!.duration ?? page.duration)}</div>
            </div>
            {addressLines.length > 0 && (
              <div>
                {page.city && <div className="font-bold">{page.city}</div>}
                {page.street && <div>{page.street}</div>}
                {page.postalcode && <div>{page.postalcode}</div>}
              </div>
            )}
          </div>
        </Card>
      ) : (
        <>
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
      )}
    </>
  )
}

function formatEndTime(startHM: string, durationMin: number) {
  const [h, m] = startHM.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  d.setMinutes(d.getMinutes() + durationMin);
  const hh = d.getHours().toString().padStart(2,'0');
  const mm = d.getMinutes().toString().padStart(2,'0');
  return `${hh}:${mm}`;
}
