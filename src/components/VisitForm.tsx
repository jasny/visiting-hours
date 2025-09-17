'use client';

import { useState, useTransition } from 'react';
import { InputText } from 'primereact/inputtext';
import { addVisit } from '@/services/pageService';
import { Visit } from "@/lib/types"

interface Props {
  reference: string;
  calendarDates: string[];
  timeSlots: string[];
  selected?: { date: string | null; time: string | null };
}

type FormState = Partial<Omit<Visit, 'duration'>>;

export default function VisitForm({ reference, selected }: Props) {
  const [form, setForm] = useState<FormState>({});
  const [pending, startTransition] = useTransition();

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canSubmit = Boolean((selected?.date && selected?.time) || (form.date && form.time)) && Boolean(form.name);

  const submit = async () => {
    const payload: Omit<Visit, 'duration'> = {
      name: form.name as string,
      date: (selected?.date || form.date) as string,
      time: (selected?.time || form.time) as string,
    };
    startTransition(async () => {
      await addVisit(reference, payload);
    });
  };

  return (
    <section className="w-full max-w-3xl mx-auto mt-6">
      <div className="rounded-2xl border border-indigo-100 bg-white/70 backdrop-blur p-6">
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm text-gray-700 mb-1">Wat is uw/jullie naam?</label>
          <InputText id="name" onChange={(e) => update('name', e.target.value)} className="w-full" />
        </div>
        <div className="text-center">
          <button
            className={`inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium h-12 px-8 py-4 text-lg rounded-xl transition-all duration-300 ${
              canSubmit ? 'bg-pink-500 hover:bg-pink-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!canSubmit || pending}
            onClick={submit}
          >
            Bevestig je bezoek
          </button>
        </div>
      </div>
    </section>
  );
}
