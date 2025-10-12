"use client";

import { useEffect, useMemo, useTransition } from "react";
import { Dialog } from "primereact/dialog";
import { Calendar as PCalendar } from "primereact/calendar";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { SelectButton } from "primereact/selectbutton";
import { Controller, useForm, useWatch } from "react-hook-form";
import { addSlot } from "@/services/pageService";
import { Calendar as CalType, Slot, SlotType } from "@/lib/types";
import { getSlotVisit, isVisitingTime } from "@/lib/calendar";
import { useDutchLocale } from "@/hooks/useLocale";

interface Props {
  reference: string;
  calendar: CalType;
  visible: boolean;
  onClose: (slot?: Slot) => void;
  selected?: { date: string | null; time: string | null; to?: string | null };
}

type FormValues = {
  type: SlotType; // 'blocked' | 'taken'
  name: string;
  range: Date[] | null; // [from, to]
};

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function formatLocalHM(d: Date): string {
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

export default function SlotForm({ reference, calendar, visible, onClose, selected }: Props) {
  const isExample = reference === "";
  const [pending, startTransition] = useTransition();

  useDutchLocale();

  const defaultFrom = useMemo(() => {
    if (selected?.date && selected?.time) {
      const [h, m] = selected.time.split(":").map(Number);
      const d = new Date(`${selected.date}T00:00:00`);
      d.setHours(h, m, 0, 0);
      return d;
    }
    return null;
  }, [selected?.date, selected?.time]);

  const defaultTo = useMemo(() => {
    if (selected?.date && selected?.to) {
      const [h, m] = selected.to.split(":").map(Number);
      const d = new Date(`${selected.date}T00:00:00`);
      d.setHours(h, m, 0, 0);
      return d;
    }
    return null;
  }, [selected?.date, selected?.to]);

  const { control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: { type: "blocked", name: "", range: defaultFrom ? [defaultFrom, (defaultTo ?? addMinutes(defaultFrom, calendar.duration))] : null },
    mode: "onChange",
  });

  // When dialog opens or selection changes, prefill
  useEffect(() => {
    const range = defaultFrom ? [defaultFrom, (defaultTo ?? addMinutes(defaultFrom, calendar.duration))] : null;
    reset({ type: "blocked", name: "", range });
  }, [defaultFrom, defaultTo, calendar.duration, reset, visible]);

  const minDate = useMemo(() => (calendar.dates[0] ? new Date(calendar.dates[0] + "T00:00:00") : undefined), [calendar.dates]);
  const maxDate = useMemo(() => {
    const last = calendar.dates[calendar.dates.length - 1] ?? calendar.dates[0];
    return last ? new Date(last + "T23:59:59") : undefined;
  }, [calendar.dates]);

  const stepMinute = calendar.step ?? (calendar.duration! < 30 ? 15 : 30);

  // Watch form values to adjust single-click (no end) behavior
  const rangeWatch = useWatch({ control, name: "range" });
  useEffect(() => {
    if (rangeWatch && rangeWatch.length === 1 && rangeWatch[0]) {
      // User clicked a single time; auto-fill end = start + default duration
      const end = addMinutes(rangeWatch[0], calendar.duration);
      setValue("range", [rangeWatch[0], end], { shouldValidate: true });
    }
  }, [rangeWatch, calendar.duration, setValue]);

  const onSubmit = async (data: FormValues) => {
    const r = data.range;
    if (!r || r.length < 2 || !r[0] || !r[1]) return;
    const from = r[0];
    const to = r[1];
    const dateStr = formatLocalDate(from);
    const timeHM = formatLocalHM(from);
    const duration = Math.max(0, Math.round((to.getTime() - from.getTime()) / 60000));

    const payload: Omit<Slot, "nonce"> = {
      name: data.type === "blocked" ? "" : data.name,
      date: dateStr,
      time: timeHM,
      duration,
      type: data.type,
    } as Slot;

    startTransition(async () => {
      if (isExample) {
        onClose({ ...payload });
        return;
      }

      try {
        await addSlot(reference, payload as Required<Slot>);
        onClose(payload as Slot);
      } catch {
        // swallow error; could add toast
        onClose(undefined);
      }
    });
  };

  const footer = (
    <div className="flex items-center justify-end gap-3 w-full">
      <Button
        type="button"
        onClick={handleSubmit(onSubmit)}
        label="Opslaan"
        disabled={pending || isSubmitting}
        loading={pending || isSubmitting}
      />
    </div>
  );

  const typeOptions: { label: string; value: SlotType }[] = [
    { label: "Blokkeren", value: "blocked" },
    { label: "Bezoek", value: "taken" },
  ];

  // Validation helpers
  function validateRange(range: Date[] | null): string | true {
    if (!range || range.length < 2 || !range[0] || !range[1]) return "Van en tot zijn verplicht";
    const [from, to] = range;
    if (to <= from) return "De eindtijd moet later zijn dan de starttijd";

    const dateStr = formatLocalDate(from);
    const timeHM = formatLocalHM(from);
    const duration = Math.round((to.getTime() - from.getTime()) / 60000);

    // Check within allowed windows
    if (!isVisitingTime(calendar, timeHM, duration)) return "Tijd buiten bezoektijden";

    // Overlap check
    const overlap = getSlotVisit(calendar, dateStr, timeHM, duration);
    if (overlap) return "Deze periode overlapt met een andere afspraak";

    return true;
  }

  const watchedType = useWatch({ control, name: "type" });

  return (
    <Dialog header="Afspraak toevoegen" visible={visible} onHide={() => onClose()} style={{ width: "36rem" }} modal footer={footer}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex gap-3 items-center mb-3">
          <Controller
            name="type"
            control={control}
            rules={{ required: true }}
            render={({ field }) => (
              <SelectButton id="type" {...field} options={typeOptions} optionLabel="label" optionValue="value" />
            )}
          />
        </div>

        <div>
          <Controller
            name="range"
            control={control}
            rules={{ required: "Verplicht", validate: validateRange }}
            render={({ field }) => {
              const currentFrom = (field.value?.[0] ?? null) as Date | null;
              const currentTo = ((field.value?.[1] as Date | undefined) ?? (currentFrom ? addMinutes(currentFrom, calendar.duration) : null)) as Date | null;

              const setDatePart = (datePart: Date, timePart: Date | null) => {
                const d = new Date(datePart);
                if (timePart) {
                  d.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
                } else {
                  d.setHours(0, 0, 0, 0);
                }
                return d;
              };

              const dateOnlyValue = currentFrom ? new Date(currentFrom) : null;

              return (
                <div className="flex flex-col gap-3">
                  <div className="w-full">
                    <label htmlFor="date" className="block text-sm text-gray-600 mb-1">Datum</label>
                    <PCalendar
                      id="date"
                      value={dateOnlyValue}
                      onChange={(e) => {
                        const newDate = e.value as Date | null;
                        if (!newDate) {
                          field.onChange(null);
                          return;
                        }
                        const newFrom = setDatePart(newDate, currentFrom);
                        const newToBase = currentTo ?? addMinutes(newFrom, calendar.duration);
                        const newTo = setDatePart(newDate, newToBase);
                        field.onChange([newFrom, newTo]);
                      }}
                      showIcon
                      minDate={minDate}
                      maxDate={maxDate}
                      dateFormat="dd-mm-yy"
                      mask="99-99-9999"
                      className={errors.range ? "p-invalid w-full" : "w-full"}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="timeFrom" className="block text-sm text-gray-600 mb-1">Tijd van</label>
                      <PCalendar
                        id="timeFrom"
                        value={currentFrom}
                        onChange={(e) => {
                          const t = e.value as Date | null;
                          if (!t) return;
                          const baseDate = currentFrom ?? dateOnlyValue ?? (minDate ?? new Date());
                          const newFrom = setDatePart(baseDate, t);
                          const newTo = currentTo ?? addMinutes(newFrom, calendar.duration);
                          field.onChange([newFrom, newTo]);
                        }}
                        timeOnly
                        hourFormat="24"
                        stepMinute={stepMinute}
                        className={errors.range ? "p-invalid w-full" : "w-full"}
                      />
                    </div>

                    <div>
                      <label htmlFor="timeTo" className="block text-sm text-gray-600 mb-1">Tijd tot</label>
                      <PCalendar
                        id="timeTo"
                        value={currentTo}
                        onChange={(e) => {
                          const t = e.value as Date | null;
                          if (!t) return;
                          const baseDate = (currentFrom ?? dateOnlyValue ?? (minDate ?? new Date()));
                          const newTo = setDatePart(baseDate, t);
                          const newFrom = currentFrom ?? setDatePart(baseDate, t);
                          field.onChange([newFrom, newTo]);
                        }}
                        timeOnly
                        hourFormat="24"
                        stepMinute={stepMinute}
                        className={errors.range ? "p-invalid w-full" : "w-full"}
                      />
                    </div>
                  </div>
                </div>
              );
            }}
          />
          {errors.range && <small className="text-red-600">{errors.range.message as string}</small>}
        </div>

        {watchedType === "taken" && (
          <div>
            <label htmlFor="name" className="block text-sm text-gray-700 mb-1">Naam bezoeker(s)</label>
            <Controller
              name="name"
              control={control}
              rules={{ validate: (v, form) => (form.type === "taken" ? (!!v && v.trim().length > 0) || "Verplicht" : true) }}
              render={({ field }) => (
                <InputText id="name" className={`w-full ${errors.name ? "p-invalid" : ""}`} {...field} />
              )}
            />
            {errors.name && <small className="text-red-600">{errors.name.message as string}</small>}
          </div>
        )}
      </form>
    </Dialog>
  );
}
