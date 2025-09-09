'use client';

import { useEffect, useState, useTransition } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { InputSwitch } from 'primereact/inputswitch';
import { InputNumber } from 'primereact/inputnumber';
import { Page, savePage } from '@/services/pageService';

type FormState = Partial<Page>;

export default function CreatePageForm() {
  const [form, setForm] = useState<FormState>({});
  const [pending, startTransition] = useTransition();

  const [showAddress, setShowAddress] = useState(false);
  const [customTimes, setCustomTimes] = useState(false);
  const [showMorning, setShowMorning] = useState(false);
  const [showAfternoon, setShowAfternoon] = useState(false);
  const [showEvening, setShowEvening] = useState(false);
  const [durationHours, setDurationHours] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(0);

  useEffect(() => {
    setForm((f) => ({ ...f, duration: durationHours * 60 + durationMinutes }));
  }, [durationHours, durationMinutes]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const submit = async () => {
    startTransition(async () => {
      await savePage(form as Page);
    });
  };

  const toTimeValue = (value?: string | null) =>
    value ? new Date(`1970-01-01T${value}`) : undefined;

  const fromTimeValue = (date: Date | null | undefined) =>
    date ? date.toTimeString().slice(0, 5) : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Baby & ouder informatie */}
      <section className="rounded-2xl bg-white/70 p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-pink-700">
          Baby &amp; ouder informatie
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium">
              Wat is de naam van de baby?
            </label>
            <InputText
              id="name"
              value={form.name || ''}
              onChange={(e) => update('name', e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="date_of_birth" className="text-sm font-medium">
              Wanneer is de baby geboren?
            </label>
            <Calendar
              id="date_of_birth"
              value={form.date_of_birth ? new Date(form.date_of_birth) : undefined}
              onChange={(e) => update('date_of_birth', e.value?.toISOString() ?? undefined)}
              dateFormat="dd-mm-yy"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="parent_name" className="text-sm font-medium">
              Wat is jouw/jullie naam?
            </label>
            <InputText
              id="parent_name"
              value={form.parent_name || ''}
              onChange={(e) => update('parent_name', e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium">
              Wat is jouw e-mailadres?
            </label>
            <InputText
              id="email"
              value={form.email || ''}
              onChange={(e) => update('email', e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label htmlFor="description" className="text-sm font-medium">
              Wil je een welkomst tekst toevoegen?
            </label>
            <InputTextarea
              id="description"
              value={form.description || ''}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label htmlFor="gifts" className="text-sm font-medium">
              Wil je de reden voor kraamcadeautjes toevoegen?
            </label>
            <InputTextarea
              id="gifts"
              value={form.gifts || ''}
              onChange={(e) => update('gifts', e.target.value)}
              rows={3}
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* Adres informatie */}
      <section className="rounded-2xl bg-white/70 p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-pink-700">
            Adres informatie
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <span>Adres tonen</span>
            <InputSwitch
              checked={showAddress}
              onChange={(e) => setShowAddress(!!e.value)}
            />
          </div>
        </div>
        {showAddress && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1 md:col-span-2">
              <label htmlFor="street" className="text-sm font-medium">
                Straat en huisnummer
              </label>
              <InputText
                id="street"
                value={form.street || ''}
                onChange={(e) => update('street', e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="postalcode" className="text-sm font-medium">
                Postcode
              </label>
              <InputText
                id="postalcode"
                value={form.postalcode || ''}
                onChange={(e) => update('postalcode', e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-1 md:col-span-3">
              <label htmlFor="city" className="text-sm font-medium">
                Woonplaats
              </label>
              <InputText
                id="city"
                value={form.city || ''}
                onChange={(e) => update('city', e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        )}
      </section>

      {/* Bezoekperiode */}
      <section className="rounded-2xl bg-white/70 p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-pink-700">
          Bezoekperiode
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="date_from" className="text-sm font-medium">
              Periode kraambezoek van
            </label>
            <Calendar
              id="date_from"
              value={form.date_from ? new Date(form.date_from) : undefined}
              onChange={(e) => update('date_from', e.value?.toISOString())}
              dateFormat="dd-mm-yy"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="date_to" className="text-sm font-medium">
              Tot
            </label>
            <Calendar
              id="date_to"
              value={form.date_to ? new Date(form.date_to) : undefined}
              onChange={(e) => update('date_to', e.value?.toISOString())}
              dateFormat="dd-mm-yy"
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* Kalender instellingen */}
      <section className="rounded-2xl bg-white/70 p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-pink-700">
            Kalender instellingen
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <span>Aangepast</span>
            <InputSwitch
              checked={customTimes}
              onChange={(e) => setCustomTimes(!!e.value)}
            />
          </div>
        </div>

        <div className="mb-6 flex items-center gap-2">
          <label className="flex-1 text-sm font-medium">
            Hoe lang mag een bezoek duren?
          </label>
          <InputNumber
            value={durationHours}
            onValueChange={(e) => setDurationHours(e.value || 0)}
            showButtons
            min={0}
            max={12}
            inputClassName="w-16"
            className="w-24"
          />
          <span>uren</span>
          <InputNumber
            value={durationMinutes}
            onValueChange={(e) => setDurationMinutes(e.value || 0)}
            showButtons
            min={0}
            max={59}
            step={15}
            inputClassName="w-16"
            className="w-24"
          />
          <span>minuten</span>
        </div>

        {customTimes && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                Voor de ochtend kraam bezoek ontvangen?
              </span>
              <InputSwitch
                checked={showMorning}
                onChange={(e) => setShowMorning(!!e.value)}
              />
            </div>
            {showMorning && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="morning_from" className="text-sm font-medium">
                    Ochtend van
                  </label>
                  <Calendar
                    id="morning_from"
                    value={toTimeValue(form.morning_from)}
                    onChange={(e) =>
                      update('morning_from', fromTimeValue(e.value))
                    }
                    timeOnly
                    hourFormat="24"
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="morning_to" className="text-sm font-medium">
                    Ochtend tot
                  </label>
                  <Calendar
                    id="morning_to"
                    value={toTimeValue(form.morning_to)}
                    onChange={(e) =>
                      update('morning_to', fromTimeValue(e.value))
                    }
                    timeOnly
                    hourFormat="24"
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="morning_amount" className="text-sm font-medium">
                    Max ochtenden bezoek
                  </label>
                  <InputNumber
                    id="morning_amount"
                    value={form.morning_amount || undefined}
                    onValueChange={(e) =>
                      update('morning_amount', e.value ?? null)
                    }
                    className="w-full"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm">
                Voor de middag bezoek ontvangen?
              </span>
              <InputSwitch
                checked={showAfternoon}
                onChange={(e) => setShowAfternoon(!!e.value)}
              />
            </div>
            {showAfternoon && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="afternoon_from"
                    className="text-sm font-medium"
                  >
                    Middag van
                  </label>
                  <Calendar
                    id="afternoon_from"
                    value={toTimeValue(form.afternoon_from)}
                    onChange={(e) =>
                      update('afternoon_from', fromTimeValue(e.value))
                    }
                    timeOnly
                    hourFormat="24"
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="afternoon_to"
                    className="text-sm font-medium"
                  >
                    Middag tot
                  </label>
                  <Calendar
                    id="afternoon_to"
                    value={toTimeValue(form.afternoon_to)}
                    onChange={(e) =>
                      update('afternoon_to', fromTimeValue(e.value))
                    }
                    timeOnly
                    hourFormat="24"
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="afternoon_amount"
                    className="text-sm font-medium"
                  >
                    Max middagen bezoek
                  </label>
                  <InputNumber
                    id="afternoon_amount"
                    value={form.afternoon_amount || undefined}
                    onValueChange={(e) =>
                      update('afternoon_amount', e.value ?? null)
                    }
                    className="w-full"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm">
                Voor de avond bezoek ontvangen?
              </span>
              <InputSwitch
                checked={showEvening}
                onChange={(e) => setShowEvening(!!e.value)}
              />
            </div>
            {showEvening && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor="evening_from" className="text-sm font-medium">
                    Avond van
                  </label>
                  <Calendar
                    id="evening_from"
                    value={toTimeValue(form.evening_from)}
                    onChange={(e) =>
                      update('evening_from', fromTimeValue(e.value))
                    }
                    timeOnly
                    hourFormat="24"
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="evening_to" className="text-sm font-medium">
                    Avond tot
                  </label>
                  <Calendar
                    id="evening_to"
                    value={toTimeValue(form.evening_to)}
                    onChange={(e) =>
                      update('evening_to', fromTimeValue(e.value))
                    }
                    timeOnly
                    hourFormat="24"
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="evening_amount"
                    className="text-sm font-medium"
                  >
                    Max avonden bezoek
                  </label>
                  <InputNumber
                    id="evening_amount"
                    value={form.evening_amount || undefined}
                    onValueChange={(e) =>
                      update('evening_amount', e.value ?? null)
                    }
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <Button
        label="Pagina aanmaken"
        onClick={submit}
        loading={pending}
        className="mt-2 w-full"
      />
    </div>
  );
}

