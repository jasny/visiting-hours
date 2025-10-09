'use client';

import { useEffect, useMemo, useTransition } from 'react';
import { Dialog } from 'primereact/dialog';
import { Calendar as PCalendar } from 'primereact/calendar';
import { InputText } from 'primereact/inputtext';
import { Controller, useForm } from 'react-hook-form';
import { addVisit } from '@/services/pageService';
import { Calendar as CalType, Slot } from "@/lib/types";
import { isTimeAvailable } from '@/lib/calendar';

interface Props {
  reference: string;
  calendar: CalType;
  visible: boolean;
  onClose: (slot?: Slot) => void;
  selected?: { date: string | null; time: string | null };
}

type FormValues = {
  name: string;
  dateTime: Date | null;
};

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function formatLocalHM(d: Date): string {
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

export default function VisitForm({ reference, calendar, visible, onClose, selected }: Props) {
  const isExample = reference === '';
  const [pending, startTransition] = useTransition();

  const defaultDate = useMemo(() => {
    if (selected?.date && selected?.time) {
      const [h, m] = selected.time.split(':').map(Number);
      const d = new Date(`${selected.date}T00:00:00`);
      d.setHours(h, m, 0, 0);
      return d;
    }
    return null;
  }, [selected?.date, selected?.time]);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: { name: '', dateTime: defaultDate },
    mode: 'onChange',
  });

  useEffect(() => {
    // when selection changes or dialog opens, prefill
    reset({ name: '', dateTime: defaultDate });
  }, [defaultDate, visible, reset]);

  const minDate = useMemo(() => (calendar.dates[0] ? new Date(calendar.dates[0] + 'T00:00:00') : undefined), [calendar.dates]);
  const maxDate = useMemo(() => {
    const last = calendar.dates[calendar.dates.length - 1] ?? calendar.dates[0];
    return last ? new Date(last + 'T23:59:59') : undefined;
  }, [calendar.dates]);

  const stepMinute = calendar.step ?? (calendar.duration! < 30 ? 15 : 30);

  const onSubmit = async (data: FormValues) => {
    if (!data.dateTime) return;
    const dateStr = formatLocalDate(data.dateTime);
    const timeHM = formatLocalHM(data.dateTime);

    const payload = {
      name: data.name,
      date: dateStr,
      time: timeHM,
    };

    startTransition(async () => {
      if (isExample) {
        onClose({ ...payload, type: 'taken', duration: 60 });
        return;
      }

      const slot = await addVisit(reference, payload);
      onClose(slot);
    });
  };

  const footer = (
    <div className="flex items-center justify-end gap-3 w-full">
      <button
        type="button"
        onClick={handleSubmit(onSubmit)}
        className={`px-4 py-2 rounded-lg ${pending ? 'bg-pink-300' : 'bg-pink-500 hover:bg-pink-600'} text-white`}
        disabled={pending || isSubmitting}
      >
        Bevestig je bezoek
      </button>
    </div>
  );

  return (
    <Dialog header="Bezoek plannen" visible={visible} onHide={() => onClose()} style={{ width: '32rem' }} modal footer={footer}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="datetime" className="block text-sm text-gray-700 mb-1">Gekozen datum en tijd</label>
          <Controller
            name="dateTime"
            control={control}
            rules={{
              required: 'Verplicht',
              validate: (value) => {
                if (!value) return 'Datum en tijd zijn verplicht';
                const dateStr = formatLocalDate(value);
                const timeHM = formatLocalHM(value);
                return isTimeAvailable(calendar, dateStr, timeHM) || 'Dit tijdstip is niet beschikbaar';
              },
            }}
            render={({ field }) => (
              <PCalendar
                id="datetime"
                {...field}
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                showIcon
                showTime
                hourFormat="24"
                stepMinute={stepMinute}
                minDate={minDate}
                maxDate={maxDate}
                className={ errors.dateTime ? 'p-invalid w-full' : 'w-full'}
              />
            )}
          />
          {errors.dateTime && <small className="text-red-600">{errors.dateTime.message as string}</small>}
        </div>
        <div>
          <label htmlFor="name" className="block text-sm text-gray-700 mb-1">Wat is uw/jullie naam?</label>
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Verplicht' }}
            render={({ field }) => (
              <InputText id="name" className={`w-full ${errors.name ? 'p-invalid' : ''}`} {...field} />
            )}
          />
          {errors.name && <small className="text-red-600">{errors.name.message}</small>}
        </div>
      </form>
    </Dialog>
  );
}
