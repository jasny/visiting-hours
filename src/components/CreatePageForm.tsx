'use client';

import { useState, useTransition } from 'react';
import { InputText } from 'primereact/inputtext';
import { Calendar as PCalendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Page, savePage } from '@/services/pageService';

type FormState = Partial<Page>;

export default function CreatePageForm() {
  const [form, setForm] = useState<FormState>({});
  const [pending, startTransition] = useTransition();

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const submit = async () => {
    startTransition(async () => {
      await savePage(form as Page);
    });
  };

  return (
    <div className="p-fluid formgrid grid">
      <div className="field col-12">
        <label htmlFor="name">Wat is de naam van de baby?</label>
        <InputText id="name" onChange={(e) => update('name', e.target.value)} />
      </div>
      <div className="field col-12">
        <label htmlFor="email">Wat is jouw e-mailadres?</label>
        <InputText id="email" onChange={(e) => update('email', e.target.value)} />
      </div>
      <div className="field col-6">
        <label htmlFor="date_from">Bezoek vanaf</label>
        <PCalendar id="date_from" onChange={(e) => update('date_from', e.value?.toISOString())} />
      </div>
      <div className="field col-6">
        <label htmlFor="date_to">Bezoek tot</label>
        <PCalendar id="date_to" onChange={(e) => update('date_to', e.value?.toISOString())} />
      </div>
      <div className="field col-6">
        <label htmlFor="morning_from">Ochtend van</label>
        <InputText id="morning_from" onChange={(e) => update('morning_from', e.target.value)} />
      </div>
      <div className="field col-6">
        <label htmlFor="morning_to">Ochtend tot</label>
        <InputText id="morning_to" onChange={(e) => update('morning_to', e.target.value)} />
      </div>
      <div className="field col-6">
        <label htmlFor="duration">Bezoekduur (minuten)</label>
        <Dropdown
          id="duration"
          options={[15, 30, 45, 60].map((v) => ({ label: v.toString(), value: v }))}
          onChange={(e) => update('duration', e.value)}
        />
      </div>
      <div className="field col-12">
        <Button label="Opslaan" onClick={submit} loading={pending} />
      </div>
    </div>
  );
}
