'use client';

import { useState, useTransition } from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { registerVisit } from '@/services/pageActions';
import { Visit } from '@/services/pageService';

interface Props {
  reference: string;
  calendarDates: string[];
  timeSlots: string[];
}

type FormState = Partial<Omit<Visit, 'duration'>>;

export default function VisitForm({ reference, calendarDates, timeSlots }: Props) {
  const [form, setForm] = useState<FormState>({});
  const [pending, startTransition] = useTransition();

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    startTransition(async () => {
      await registerVisit(reference, form as Omit<Visit, 'duration'>);
    });
  };

  return (
    <div className="p-fluid formgrid grid">
      <div className="field col-6">
        <label htmlFor="date">Datum</label>
        <Dropdown
          id="date"
          options={calendarDates.map((d) => ({ label: d, value: d }))}
          onChange={(e) => update('date', e.value)}
        />
      </div>
      <div className="field col-6">
        <label htmlFor="time">Tijd</label>
        <Dropdown
          id="time"
          options={timeSlots.map((t) => ({ label: t, value: t }))}
          onChange={(e) => update('time', e.value)}
        />
      </div>
      <div className="field col-12">
        <label htmlFor="name">Wat is uw/jullie naam?</label>
        <InputText id="name" onChange={(e) => update('name', e.target.value)} />
      </div>
      <div className="field col-12">
        <Button label="Inplannen" onClick={submit} loading={pending} />
      </div>
    </div>
  );
}
