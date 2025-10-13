'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import CalendarView from '@/components/CalendarView';
import VisitForm from '@/components/VisitForm';
import SlotForm from '@/components/SlotForm';
import { Page, Slot } from "@/lib/types"
import { buildCalendar } from "@/lib/calendar"
import { cancelVisit, getVisitFromCookie } from '@/services/pageService';
import { VisitCard } from "@/components/VisitCard"
import Linkify from "linkify-react"
import { Panel } from "primereact/panel"
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'

interface Props {
  page: Page;
  isAdmin?: boolean
}

export default function VisitSection({ page, isAdmin }: Props) {
  const [slots, setSlots] = useState<Slot[]>(page.slots);
  const [visit, setVisit] = useState<{ date: string; time: string; duration?: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(page.reference === '');

  const calendar = useMemo(
    () => buildCalendar({ ...page, slots }),
    [page, slots]
  );

  useEffect(() => {
    if (loaded) return;

    let active = true;
    (async () => {
      const v = await getVisitFromCookie(page.reference);
      if (active) {
        setVisit(v);
        setLoaded(true);
      }
    })();
    return () => { active = false };
  }, [page.reference, loaded]);

  const [selected, setSelected] = useState<{ date: string | null; time: string | null; to?: string | null }>({
    date: null,
    time: null,
    to: null,
  });
  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);

  const handleSelect = (date: string, time: string, to?: string) => {
    if (isAdmin) {
      const existing = slots.find((s) => s.date === date && s.time === time) || null;
      setEditingSlot(existing);
    }
    setSelected({ date, time, to: to ?? null });
    setShowForm(true);
  };

  const handleForm = (slot?: Slot | null) => {
    if (editingSlot) {
      // edit flow
      if (slot === undefined) {
        // deletion confirmed
        setSlots((prev) => prev.filter((s) => s !== editingSlot));
      } else if (slot) {
        // saved changes
        setSlots((prev) => prev.map((s) => (s === editingSlot ? slot : s)));
      } // else slot === null => cancel: do nothing
      setEditingSlot(null);
    } else if (slot) {
      // create flow
      setSlots((slots) => [...slots, slot]);
      if (!isAdmin) setVisit(slot);
    }

    setShowForm(false);
  };

  const confirmCancel = () => {
    if (!visit) return;
    confirmDialog({
      message: 'Weet je zeker dat je je afspraak wilt annuleren?',
      header: 'Afspraak annuleren',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Ja, annuleren',
      rejectLabel: 'Nee',
      acceptClassName: 'p-button-danger',
      accept: () => {
        startTransition(async () => {
          try {
            await cancelVisit(page.reference);
          } catch {}

          // remove from local page.slots for UI responsiveness
          const idx = page.slots.findIndex((s: Slot) => s.date === visit.date && s.time === visit.time);
          if (idx >= 0) page.slots.splice(idx, 1);
          setVisit(null);
        });
      }
    });
  };

  const hasGifts = !!page.gifts.trim();

  if (!calendar || !loaded) return <></>;

  if (!!visit) {
    return (
      <>
        <ConfirmDialog />
        <VisitCard
          onClick={confirmCancel}
          disabled={pending}
          visit={visit}
          city={page.city}
          street={page.street}
          postalcode={page.postalcode}
        />

        { hasGifts &&
          <Panel className="text-center mb-12 mt-12" header={<span className="font-bold">Wensenlijst</span>}>
            <p className="text-gray-600 max-w-2xl text-left whitespace-pre-line">
              <Linkify>
                { page.gifts }
              </Linkify>
            </p>
          </Panel>
        }
      </>
    );
  }

  return (
    <>
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl text-gray-800 mb-4">{isAdmin ? 'Beheer bezoeken' : 'Plan je bezoek'}</h2>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
          {isAdmin
            ? 'Beheer de agenda: plan een bezoek voor een gast in of blokkeer tijdvakken wanneer bezoek niet mogelijk is.'
            : <>Kies een moment dat voor jou uitkomt om {page.name} te ontmoeten. We houden de bezoeken kort en gezellig, zodat iedereen kan genieten.</>}
        </p>
      </div>

      <CalendarView calendar={calendar} onSelect={handleSelect} selectBlocked={isAdmin} />
      {isAdmin ? (
        <SlotForm
          reference={page.reference}
          calendar={calendar}
          selected={selected}
          existing={editingSlot}
          visible={showForm}
          onClose={handleForm}
        />
      ) : (
        <VisitForm
          reference={page.reference}
          calendar={calendar}
          selected={{ date: selected.date, time: selected.time }}
          visible={showForm}
          onClose={handleForm}
        />
      )}
    </>
  )
}

