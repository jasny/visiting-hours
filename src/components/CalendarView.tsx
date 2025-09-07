'use client';

import { Calendar } from '@/lib/calendar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

interface Props {
  calendar: Calendar;
}

export default function CalendarView({ calendar }: Props) {
  const dates = calendar.getDates();
  const slots = calendar.getTimeSlots();
  type Row = Record<string, string>;
  const data: Row[] = Object.keys(slots).map((time) => {
    const row: Row = { time };
    dates.forEach((date) => (row[date] = calendar.getSlotState(date, time)));
    return row;
  });
  return (
    <DataTable value={data} tableStyle={{ minWidth: '50rem' }}>
      <Column field="time" header="Tijd" />
      {dates.map((d) => (
        <Column key={d} field={d} header={d} />
      ))}
    </DataTable>
  );
}
