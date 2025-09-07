'use server';

import { notFound } from 'next/navigation';
import { getPage } from '@/services/pageService';
import PageInfo from '@/components/PageInfo';
import { Calendar } from '@/lib/calendar';
import CalendarView from '@/components/CalendarView';
import VisitForm from '@/components/VisitForm';

export default async function ShowPage({ params }: { params: { reference: string } }) {
  const page = await getPage(params.reference);
  if (!page) return notFound();
  const calendar = new Calendar(page);
  const dates = calendar.getDates();
  const slots = Object.keys(calendar.getTimeSlots());
  return (
    <main className="p-4">
      <PageInfo info={page} />
      <CalendarView calendar={calendar} />
      <VisitForm reference={page.reference} calendarDates={dates} timeSlots={slots} />
    </main>
  );
}
