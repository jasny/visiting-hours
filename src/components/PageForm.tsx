'use client';

import { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { InputSwitch } from 'primereact/inputswitch';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { Baby, MapPinIcon, CalendarDays, Settings, Clock, Info } from 'lucide-react';
import { savePage } from '@/services/pageService';
import { Page } from "@/lib/types";
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { useDutchLocale } from "@/hooks/useLocale"
import { partialMatch } from "@/lib/utils"

// Keep same shape as before but managed by react-hook-form
type FormState = Partial<Page>;

const toTimeValue = (value?: string | null) =>
  value ? new Date(`1970-01-01T${value}`) : undefined;

const fromTimeValue = (date: Date | null | undefined) =>
  date ? date.toTimeString().slice(0, 5) : null;

const defaultTimes = {
  duration: 60,
  morning_from: '10:00', morning_to: '12:00', morning_amount: 1,
  afternoon_from: '12:00', afternoon_to: '18:00', afternoon_amount: 2,
  evening_from: '18:00', evening_to: '21:00', evening_amount: 0,
};

export default function PageForm({ values: defaultValues }: { values: Partial<Page> }) {
  const router = useRouter();
  const toast = useRef<Toast | null>(null);
  const pageExists = !!defaultValues.reference;

  const [showAddress, setShowAddress] = useState(!!defaultValues.street);
  const [customTimes, setCustomTimes] = useState(!partialMatch(defaultValues, defaultTimes));
  const [durationHours, setDurationHours] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(0);

  const { control, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormState>({
    defaultValues
  });

  useDutchLocale();

  // keep duration in minutes in the form and update via hours/minutes controls
  useEffect(() => {
    setValue('duration', durationHours * 60 + durationMinutes);
  }, [durationHours, durationMinutes, setValue]);

  // Convenience watches for conditional rendering
  const morning_amount = watch('morning_amount');
  const afternoon_amount = watch('afternoon_amount');
  const evening_amount = watch('evening_amount');

  const onSubmit: SubmitHandler<FormState> = async (data) => {
    const defaults = !customTimes ? defaultTimes : {};
    const normalized = { ...defaults, ...data } as Partial<Page>;

    const ensureTimeWindow = (
      fromKey: 'morning_from' | 'afternoon_from' | 'evening_from',
      toKey: 'morning_to' | 'afternoon_to' | 'evening_to',
      amountKey: 'morning_amount' | 'afternoon_amount' | 'evening_amount',
      fallbackFrom: string,
      fallbackTo: string
    ) => {
      const amt = normalized[amountKey];
      if (amt === undefined || amt === null) normalized[amountKey] = 0;
      if (!normalized[fromKey]) normalized[fromKey] = fallbackFrom;
      if (!normalized[toKey]) normalized[toKey] = fallbackTo;
    };

    ensureTimeWindow('morning_from','morning_to','morning_amount','10:00','12:00');
    ensureTimeWindow('afternoon_from','afternoon_to','afternoon_amount','12:00','18:00');
    ensureTimeWindow('evening_from','evening_to','evening_amount','18:00','21:00');

    const pagePayload: Omit<Page, 'reference' | 'nonce' | 'slots'> = {
      email: normalized.email as string,
      name: normalized.name as string,
      parent_name: normalized.parent_name as string,
      description: normalized.description as string,
      gifts: normalized.gifts as string,
      date_from: normalized.date_from as string,
      date_to: normalized.date_to as string,
      morning_from: normalized.morning_from as string,
      morning_to: normalized.morning_to as string,
      morning_amount: normalized.morning_amount as number,
      afternoon_from: normalized.afternoon_from as string,
      afternoon_to: normalized.afternoon_to as string,
      afternoon_amount: normalized.afternoon_amount as number,
      evening_from: normalized.evening_from as string,
      evening_to: normalized.evening_to as string,
      evening_amount: normalized.evening_amount as number,
      duration: (normalized.duration as number) ?? 60,
      date_of_birth: normalized.date_of_birth ?? null,
      street: normalized.street ?? null,
      postalcode: normalized.postalcode ?? null,
      city: normalized.city ?? null,
      theme: normalized.theme as Page['theme'],
    };

    const reference = await savePage({ ...pagePayload, reference: defaultValues.reference as string | undefined });
    toast.current?.show({ severity: 'success', summary: 'Pagina succesvol opgeslagen', life: 2000 });
    setTimeout(() => {
      router.push(`/page/${reference}`);
    }, 800);
  };

  // Helpers for error UI
  const invalid = (key: keyof FormState) => errors[key] ? 'p-invalid' : '';
  const errorText = (key: keyof FormState) => errors[key]?.message as string | undefined;

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
      <Toast ref={toast} />
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
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Vereist' }}
              render={({ field }) => (
                <InputText id="name" {...field} className={`p-inputtext-sm ${invalid('name')}`} />
              )}
            />
            {errorText('name') && <small className="p-error">{errorText('name')}</small>}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="date_of_birth" className="text-sm font-medium text-rose-700">
              Wanneer is de baby geboren?
            </label>
            <Controller
              name="date_of_birth"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Calendar
                  id="date_of_birth"
                  value={value ? new Date(value) : undefined}
                  onChange={(e) => onChange(e.value ? (e.value as Date).toISOString() : null)}
                  dateFormat="dd-mm-yy"
                  className="p-inputtext-sm"
                />
              )}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="parent_name" className="text-sm font-medium text-rose-700">
              Wat is jouw/jullie naam?
            </label>
            <Controller
              name="parent_name"
              control={control}
              rules={{ required: 'Vereist' }}
              render={({ field }) => (
                <InputText id="parent_name" {...field} className={`p-inputtext-sm ${invalid('parent_name')}`} />
              )}
            />
            {errorText('parent_name') && <small className="p-error">{errorText('parent_name')}</small>}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-rose-700">
              Wat is jouw e-mailadres?
            </label>
            <Controller
              name="email"
              control={control}
              rules={{ required: 'Vereist', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Ongeldig e-mailadres' } }}
              render={({ field }) => (
                <InputText id="email" {...field} className={`p-inputtext-sm ${invalid('email')}`} />
              )}
            />
            {errorText('email') && <small className="p-error">{errorText('email')}</small>}
          </div>
          <div className="flex flex-col gap-1 md:col-span-2 mt-8">
            <label htmlFor="description" className="text-sm font-medium text-rose-700">
              Wat wil je vertellen aan het bezoek?
            </label>
            <Controller
              name="description"
              control={control}
              rules={{ required: 'Vereist' }}
              render={({ field }) => (
                <InputTextarea id="description" {...field} rows={3} className={`p-inputtext-sm ${invalid('description')}`} placeholder="We zijn zo dankbaar en gelukkig om ons kleine wonder met jullie te mogen delen..." />
              )}
            />
            {errorText('description') && <small className="p-error">{errorText('description')}</small>}
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label htmlFor="gifts" className="text-sm font-medium text-rose-700">
              Wat zijn de wensen voor kraamcadeautjes? <span className="text-gray-500 font-normal">(optioneel)</span>
            </label>
            <Controller
              name="gifts"
              control={control}
              render={({ field }) => (
                <InputTextarea id="gifts" {...field} rows={3} className={`p-inputtext-sm ${invalid('gifts')}`} />
              )}
            />
            {errorText('gifts') && <small className="p-error">{errorText('gifts')}</small>}
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
              <Controller
                name="street"
                control={control}
                rules={{ required: showAddress ? 'Vereist' : false }}
                render={({ field }) => (
                  <InputText id="street" {...field} className={`p-inputtext-sm ${invalid('street')}`} />
                )}
              />
              {errorText('street') && <small className="p-error">{errorText('street')}</small>}
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="postalcode" className="text-sm font-medium text-rose-700">
                Postcode
              </label>
              <Controller
                name="postalcode"
                control={control}
                rules={{ required: showAddress ? 'Vereist' : false }}
                render={({ field }) => (
                  <InputText id="postalcode" {...field} className={`p-inputtext-sm ${invalid('postalcode')}`} />
                )}
              />
              {errorText('postalcode') && <small className="p-error">{errorText('postalcode')}</small>}
            </div>
            <div className="flex flex-col gap-1 md:col-span-3">
              <label htmlFor="city" className="text-sm font-medium text-rose-700">
                Woonplaats
              </label>
              <Controller
                name="city"
                control={control}
                rules={{ required: showAddress ? 'Vereist' : false }}
                render={({ field }) => (
                  <InputText id="city" {...field} className={`p-inputtext-sm ${invalid('city')}`} />
                )}
              />
              {errorText('city') && <small className="p-error">{errorText('city')}</small>}
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
            <Controller
              name="date_from"
              control={control}
              rules={{ required: 'Vereist' }}
              render={({ field: { value, onChange } }) => (
                <Calendar
                  id="date_from"
                  value={value ? new Date(value) : undefined}
                  onChange={(e) => onChange((e.value as Date | undefined)?.toISOString())}
                  dateFormat="dd-mm-yy"
                  className={`p-inputtext-sm ${invalid('date_from')}`}
                />
              )}
            />
            {errorText('date_from') && <small className="p-error">{errorText('date_from')}</small>}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="date_to" className="text-sm font-medium text-rose-700">
              Tot
            </label>
            <Controller
              name="date_to"
              control={control}
              rules={{ required: 'Vereist' }}
              render={({ field: { value, onChange } }) => (
                <Calendar
                  id="date_to"
                  value={value ? new Date(value) : undefined}
                  onChange={(e) => onChange((e.value as Date | undefined)?.toISOString())}
                  dateFormat="dd-mm-yy"
                  className={`p-inputtext-sm ${invalid('date_to')}`}
                />
              )}
            />
            {errorText('date_to') && <small className="p-error">{errorText('date_to')}</small>}
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
              <Controller
                name="morning_amount"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <InputSwitch
                    checked={(value || 0) > 0}
                    onChange={(e) => onChange(e.value ? 1 : 0)}
                  />
                )}
              />
            </div>
            {(morning_amount || 0) > 0 && (
              <div className="grid md:grid-cols-3 gap-4 pt-4 pl-4 border-l-2 border-rose-100" style={{ marginTop: '-15px' }}>
                <div className="flex flex-col gap-1">
                  <label htmlFor="morning_from" className="text-sm font-medium text-rose-700">
                    Ochtend van
                  </label>
                  <Controller
                    name="morning_from"
                    control={control}
                    rules={{ required: 'Vereist' }}
                    render={({ field: { value, onChange } }) => (
                      <Calendar
                        id="morning_from"
                        value={toTimeValue(value)}
                        onChange={(e) => onChange(fromTimeValue(e.value))}
                        timeOnly
                        stepMinute={15}
                        hourFormat="24"
                        className={`p-inputtext-sm ${invalid('morning_from')}`}
                      />
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="morning_to" className="text-sm font-medium text-rose-700">
                    Ochtend tot
                  </label>
                  <Controller
                    name="morning_to"
                    control={control}
                    rules={{ required: 'Vereist' }}
                    render={({ field: { value, onChange } }) => (
                      <Calendar
                        id="morning_to"
                        value={toTimeValue(value)}
                        onChange={(e) => onChange(fromTimeValue(e.value))}
                        timeOnly
                        stepMinute={15}
                        hourFormat="24"
                        className={`p-inputtext-sm ${invalid('morning_to')}`}
                      />
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="morning_amount" className="text-sm font-medium text-rose-700">
                    Max bezoeken
                  </label>
                  <Controller
                    name="morning_amount"
                    control={control}
                    rules={{ required: 'Vereist', min: { value: 1, message: 'Min 1' } }}
                    render={({ field: { value, onChange } }) => (
                      <InputNumber id="morning_amount" value={value ?? undefined} onValueChange={(e) => onChange(e.value ?? null)} className={`p-inputtext-sm ${invalid('morning_amount')}`} />
                    )}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-rose-700">
                Voor de middag bezoek ontvangen?
              </span>
              <Controller
                name="afternoon_amount"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <InputSwitch
                    checked={(value || 0) > 0}
                    onChange={(e) => onChange(e.value ? 2 : 0)}
                  />
                )}
              />
            </div>
            {(afternoon_amount || 0) > 0 && (
              <div className="grid md:grid-cols-3 gap-4 pt-4 pl-4 border-l-2 border-rose-100" style={{ marginTop: '-15px' }}>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="afternoon_from"
                    className="text-sm font-medium text-rose-700"
                  >
                    Middag van
                  </label>
                  <Controller
                    name="afternoon_from"
                    control={control}
                    rules={{ required: 'Vereist' }}
                    render={({ field: { value, onChange } }) => (
                      <Calendar
                        id="afternoon_from"
                        value={toTimeValue(value)}
                        onChange={(e) => onChange(fromTimeValue(e.value))}
                        timeOnly
                        stepMinute={15}
                        hourFormat="24"
                        className={`p-inputtext-sm ${invalid('afternoon_from')}`}
                      />
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="afternoon_to"
                    className="text-sm font-medium text-rose-700"
                  >
                    Middag tot
                  </label>
                  <Controller
                    name="afternoon_to"
                    control={control}
                    rules={{ required: 'Vereist' }}
                    render={({ field: { value, onChange } }) => (
                      <Calendar
                        id="afternoon_to"
                        value={toTimeValue(value)}
                        onChange={(e) => onChange(fromTimeValue(e.value))}
                        timeOnly
                        stepMinute={15}
                        hourFormat="24"
                        className={`p-inputtext-sm ${invalid('afternoon_to')}`}
                      />
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="afternoon_amount"
                    className="text-sm font-medium text-rose-700"
                  >
                    Max bezoeken
                  </label>
                  <Controller
                    name="afternoon_amount"
                    control={control}
                    rules={{ required: 'Vereist', min: { value: 1, message: 'Min 1' } }}
                    render={({ field: { value, onChange } }) => (
                      <InputNumber id="afternoon_amount" value={value ?? undefined} onValueChange={(e) => onChange(e.value ?? null)} className={`w-full p-inputtext-sm ${invalid('afternoon_amount')}`} />
                    )}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-rose-700">
                Voor de avond bezoek ontvangen?
              </span>
              <Controller
                name="evening_amount"
                control={control}
                render={({ field: { value, onChange } }) => (
                  <InputSwitch
                    checked={(value || 0) > 0}
                    onChange={(e) => onChange(e.value ? 1 : 0)}
                  />
                )}
              />
            </div>

            {(evening_amount || 0) > 0 && (
              <div className="grid md:grid-cols-3 gap-4 pt-4 pl-4 border-l-2 border-rose-100" style={{ marginTop: '-15px' }}>
                <div className="flex flex-col gap-1">
                  <label htmlFor="evening_from" className="text-sm font-medium text-rose-700">
                    Avond van
                  </label>
                  <Controller
                    name="evening_from"
                    control={control}
                    rules={{ required: 'Vereist' }}
                    render={({ field: { value, onChange } }) => (
                      <Calendar
                        id="evening_from"
                        value={toTimeValue(value)}
                        onChange={(e) => onChange(fromTimeValue(e.value))}
                        timeOnly
                        stepMinute={15}
                        hourFormat="24"
                        className={`w-full p-inputtext-sm ${invalid('evening_from')}`}
                      />
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="evening_to" className="text-sm font-medium text-rose-700">
                    Avond tot
                  </label>
                  <Controller
                    name="evening_to"
                    control={control}
                    rules={{ required: 'Vereist' }}
                    render={({ field: { value, onChange } }) => (
                      <Calendar
                        id="evening_to"
                        value={toTimeValue(value)}
                        onChange={(e) => onChange(fromTimeValue(e.value))}
                        timeOnly
                        stepMinute={15}
                        hourFormat="24"
                        className={`w-full p-inputtext-sm ${invalid('evening_to')}`}
                      />
                    )}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="evening_amount"
                    className="text-sm font-medium text-rose-700"
                  >
                    Max bezoeken
                  </label>
                  <Controller
                    name="evening_amount"
                    control={control}
                    rules={{ required: 'Vereist', min: { value: 1, message: 'Min 1' } }}
                    render={({ field: { value, onChange } }) => (
                      <InputNumber id="evening_amount" value={value ?? undefined} onValueChange={(e) => onChange(e.value ?? null)} className={`w-full p-inputtext-sm ${invalid('evening_amount')}`} />
                    )}
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
        label={pageExists ? 'Pagina aanpassen' : 'Pagina aanmaken'}
        type="submit"
        loading={isSubmitting}
        className="mt-2 w-full"
      />
    </form>
  );
}

