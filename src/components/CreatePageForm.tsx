'use client';

import { useEffect, useState, useTransition } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { InputSwitch } from 'primereact/inputswitch';
import { InputNumber } from 'primereact/inputnumber';
import { Baby, MapPinIcon, CalendarDays, Settings, Clock, Info } from 'lucide-react';
import { Page, savePage } from '@/services/pageService';

type FormState = Partial<Page>;

export default function CreatePageForm() {
  const [form, setForm] = useState<FormState>({
    duration: 60,
    morning_from: '10:00',
    morning_to: '12:00',
    morning_amount: 1,
    afternoon_from: '12:00',
    afternoon_to: '18:00',
    afternoon_amount: 2,
    evening_from: '18:00',
    evening_to: '00:00',
    evening_amount: 0,
  });
  const [pending, startTransition] = useTransition();

  const [showAddress, setShowAddress] = useState(false);
  const [customTimes, setCustomTimes] = useState(false);
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
      <Card title={
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
            <Baby className="w-5 h-5 text-rose-600"/>
          </div>
          <div>
            <h2 className="text-xl text-rose-800 font-light">Baby &amp; ouder informatie</h2>
            <p className="text-sm text-gray-600 font-light">Vertel ons over je kleine wonder</p>
          </div>
        </div>
      }>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium text-rose-700">
              Wat is de naam van de baby?
            </label>
            <InputText
              id="name"
              value={form.name || ''}
              className="p-inputtext-sm"
              onChange={(e) => update('name', e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="date_of_birth" className="text-sm font-medium text-rose-700">
              Wanneer is de baby geboren?
            </label>
            <Calendar
              id="date_of_birth"
              value={form.date_of_birth ? new Date(form.date_of_birth) : undefined}
              onChange={(e) => update('date_of_birth', e.value?.toISOString() ?? undefined)}
              dateFormat="dd-mm-yy"
              className="p-inputtext-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="parent_name" className="text-sm font-medium text-rose-700">
              Wat is jouw/jullie naam?
            </label>
            <InputText
              id="parent_name"
              value={form.parent_name || ''}
              onChange={(e) => update('parent_name', e.target.value)}
              className="p-inputtext-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-rose-700">
              Wat is jouw e-mailadres?
            </label>
            <InputText
              id="email"
              value={form.email || ''}
              onChange={(e) => update('email', e.target.value)}
              className="p-inputtext-sm"
            />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2 mt-8">
            <label htmlFor="description" className="text-sm font-medium text-rose-700">
              Wat wil je vertellen aan het bezoek?
            </label>
            <InputTextarea
              id="description"
              value={form.description || ''}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              className="p-inputtext-sm"
              placeholder="We zijn zo dankbaar en gelukkig om ons kleine wonder met jullie te mogen delen..."
            />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label htmlFor="gifts" className="text-sm font-medium text-rose-700">
              Wat zijn de wensen voor kraamcadeautjes? <span className="text-gray-500 font-normal">(optioneel)</span>
            </label>
            <InputTextarea
              id="gifts"
              value={form.gifts || ''}
              onChange={(e) => update('gifts', e.target.value)}
              rows={3}
              className="p-inputtext-sm"
            />
          </div>
        </div>
      </Card>

      {/* Adres informatie */}
      <Card title={
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
              <MapPinIcon className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h2 className="text-lg text-rose-800 font-light">Adres informatie</h2>
              <p className="text-sm text-gray-600 font-light">Optioneel: deel je adres met bezoekers</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-light">
            <span>Adres tonen</span>
            <InputSwitch
              checked={showAddress}
              onChange={(e) => setShowAddress(e.value)}
            />
          </div>
        </div>
      }>
        {showAddress && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1 md:col-span-2">
              <label htmlFor="street" className="text-sm font-medium text-rose-700">
                Straat en huisnummer
              </label>
              <InputText
                id="street"
                value={form.street || ''}
                onChange={(e) => update('street', e.target.value)}
                className="p-inputtext-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="postalcode" className="text-sm font-medium text-rose-700">
                Postcode
              </label>
              <InputText
                id="postalcode"
                value={form.postalcode || ''}
                onChange={(e) => update('postalcode', e.target.value)}
                className="p-inputtext-sm"
              />
            </div>
            <div className="flex flex-col gap-1 md:col-span-3">
              <label htmlFor="city" className="text-sm font-medium text-rose-700">
                Woonplaats
              </label>
              <InputText
                id="city"
                value={form.city || ''}
                onChange={(e) => update('city', e.target.value)}
                className="p-inputtext-sm"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Bezoekperiode */}
      <Card title={
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h2 className="text-xl text-rose-800 font-light">Bezoekperiode</h2>
            <p className="text-sm text-gray-600 font-light">Stel de periode voor kraambezoek in</p>
          </div>
        </div>
      }>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="date_from" className="text-sm font-medium text-rose-700">
              Periode kraambezoek van
            </label>
            <Calendar
              id="date_from"
              value={form.date_from ? new Date(form.date_from) : undefined}
              onChange={(e) => update('date_from', e.value?.toISOString())}
              dateFormat="dd-mm-yy"
              className="p-inputtext-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="date_to" className="text-sm font-medium text-rose-700">
              Tot
            </label>
            <Calendar
              id="date_to"
              value={form.date_to ? new Date(form.date_to) : undefined}
              onChange={(e) => update('date_to', e.value?.toISOString())}
              dateFormat="dd-mm-yy"
              className="p-inputtext-sm"
            />
          </div>
        </div>
      </Card>

      {/* Kalender instellingen */}
      <Card title={
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-rose-600"/>
            </div>
            <div>
              <h2 className="text-xl text-rose-800 font-light">Kalender instellingen</h2>
              <p className="text-sm text-gray-600 font-light">Pas de duur en tijden van bezoek aan</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-light">
            <span>Aangepast</span>
            <InputSwitch
              checked={customTimes}
              onChange={(e) => setCustomTimes(e.value)}
            />
          </div>
        </div>
      }>
        {!customTimes && (
          <div className="bg-rose-50 rounded-lg p-6 border border-rose-100">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-rose-600" />
              <h3 className="text-rose-800">Standaard kalender</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Bezoeken van <strong>1 uur</strong> tussen <strong>10:00-18:00</strong>, maximaal 3 bezoeken per dag. Perfect voor de meeste situaties.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mt-1">
              Na het aanmaken van de pagina kun je per dag tijdstippen blokkeren.
            </p>
          </div>
        )}

        {customTimes && (
          <div className="flex flex-col gap-6">
            <div className="mb-6 flex flex-col gap-2">
              <label className="flex-1 text-sm font-medium text-rose-700">
                Hoe lang mag een bezoek duren?
              </label>
              <div>
                <InputNumber
                  value={durationHours}
                  onValueChange={(e) => setDurationHours(e.value || 0)}
                  min={0}
                  max={12}
                  className="p-inputtext-sm compact"
                />
                <span className="ml-3 mr-4">
                  uur
                </span>
                <InputNumber
                  value={durationMinutes}
                  onValueChange={(e) => setDurationMinutes(e.value || 0)}
                  min={0}
                  max={59}
                  step={15}
                  className="p-inputtext-sm compact"
                />
                <span className="ml-3">
                  minuten
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-rose-700">
                Voor de ochtend kraam bezoek ontvangen?
              </span>
              <InputSwitch
                checked={(form.morning_amount || 0) > 0}
                onChange={(e) => {
                  const on = e.value;
                  setForm(f => {
                    if (on) {
                      return { ...f, morning_amount: 1, morning_from: f.morning_from || '10:00', morning_to: f.morning_to || '12:00' };
                    }
                    return { ...f, morning_amount: 0 };
                  });
                }}
              />
            </div>
            {(form.morning_amount || 0) > 0 && (
              <div className="grid md:grid-cols-3 gap-4 pt-4 pl-4 border-l-2 border-rose-100" style={{ marginTop: '-15px' }}>
                <div className="flex flex-col gap-1">
                  <label htmlFor="morning_from" className="text-sm font-medium text-rose-700">
                    Ochtend van
                  </label>
                  <Calendar
                    id="morning_from"
                    value={toTimeValue(form.morning_from)}
                    onChange={(e) =>
                      update('morning_from', fromTimeValue(e.value))
                    }
                    timeOnly
                    stepMinute={15}
                    hourFormat="24"
                    className="p-inputtext-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="morning_to" className="text-sm font-medium text-rose-700">
                    Ochtend tot
                  </label>
                  <Calendar
                    id="morning_to"
                    value={toTimeValue(form.morning_to)}
                    onChange={(e) =>
                      update('morning_to', fromTimeValue(e.value))
                    }
                    timeOnly
                    stepMinute={15}
                    hourFormat="24"
                    className="p-inputtext-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="morning_amount" className="text-sm font-medium text-rose-700">
                    Max bezoeken
                  </label>
                  <InputNumber
                    id="morning_amount"
                    value={form.morning_amount || undefined}
                    onValueChange={(e) =>
                      update('morning_amount', e.value ?? null)
                    }
                    className="p-inputtext-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-rose-700">
                Voor de middag bezoek ontvangen?
              </span>
              <InputSwitch
                checked={(form.afternoon_amount || 0) > 0}
                onChange={(e) => {
                  const on = e.value;
                  setForm(f => {
                    if (on) {
                      return { ...f, afternoon_amount: 2, afternoon_from: f.afternoon_from || '12:00', afternoon_to: f.afternoon_to || '18:00' };
                    }
                    return { ...f, afternoon_amount: 0 };
                  });
                }}
              />
            </div>
            {(form.afternoon_amount || 0) > 0 && (
              <div className="grid md:grid-cols-3 gap-4 pt-4 pl-4 border-l-2 border-rose-100" style={{ marginTop: '-15px' }}>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="afternoon_from"
                    className="text-sm font-medium text-rose-700"
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
                    stepMinute={15}
                    hourFormat="24"
                    className="p-inputtext-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="afternoon_to"
                    className="text-sm font-medium text-rose-700"
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
                    stepMinute={15}
                    hourFormat="24"
                    className="p-inputtext-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="afternoon_amount"
                    className="text-sm font-medium text-rose-700"
                  >
                    Max bezoeken
                  </label>
                  <InputNumber
                    id="afternoon_amount"
                    value={form.afternoon_amount || undefined}
                    onValueChange={(e) =>
                      update('afternoon_amount', e.value ?? null)
                    }
                    className="w-full p-inputtext-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-rose-700">
                Voor de avond bezoek ontvangen?
              </span>
              <InputSwitch
                checked={(form.evening_amount || 0) > 0}
                onChange={(e) => {
                  const on = e.value;
                  setForm(f => {
                    if (on) {
                      return { ...f, evening_amount: 1, evening_from: f.evening_from || '18:00', evening_to: f.evening_to || '21:00' };
                    }
                    return { ...f, evening_amount: 0 };
                  });
                }}
              />
            </div>

            {(form.evening_amount || 0) > 0 && (
              <div className="grid md:grid-cols-3 gap-4 pt-4 pl-4 border-l-2 border-rose-100" style={{ marginTop: '-15px' }}>
                <div className="flex flex-col gap-1">
                  <label htmlFor="evening_from" className="text-sm font-medium text-rose-700">
                    Avond van
                  </label>
                  <Calendar
                    id="evening_from"
                    value={toTimeValue(form.evening_from)}
                    onChange={(e) =>
                      update('evening_from', fromTimeValue(e.value))
                    }
                    timeOnly
                    stepMinute={15}
                    hourFormat="24"
                    className="w-full p-inputtext-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="evening_to" className="text-sm font-medium text-rose-700">
                    Avond tot
                  </label>
                  <Calendar
                    id="evening_to"
                    value={toTimeValue(form.evening_to)}
                    onChange={(e) =>
                      update('evening_to', fromTimeValue(e.value))
                    }
                    timeOnly
                    stepMinute={15}
                    hourFormat="24"
                    className="w-full p-inputtext-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="evening_amount"
                    className="text-sm font-medium text-rose-700"
                  >
                    Max bezoeken
                  </label>
                  <InputNumber
                    id="evening_amount"
                    value={form.evening_amount || undefined}
                    onValueChange={(e) =>
                      update('evening_amount', e.value ?? null)
                    }
                    className="w-full p-inputtext-sm"
                  />
                </div>
              </div>
            )}

            <div className="bg-rose-50 rounded-lg p-6 border border-rose-100">
              <div className="flex items-center gap-3 mb-3">
                <Info className="w-5 h-5 text-rose-600" />
                <h3 className="text-rose-800">Specifieke tijden</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                De tijden die je hier instelt gelden standaard voor alle dagen. Na het aanmaken van de pagina kun je per dag tijdstippen blokkeren.
              </p>
            </div>
          </div>
        )}
      </Card>

      <Button
        label="Pagina aanmaken"
        onClick={submit}
        loading={pending}
        className="mt-2 w-full"
      />
    </div>
  );
}

