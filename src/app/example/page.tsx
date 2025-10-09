'use server';

import PageInfo from '@/components/PageInfo';
import VisitSection from '@/components/VisitSection';
import ExampleBaby from "@/assets/example-baby.jpg";
import { Page, Slot } from "@/lib/types"

export default async function ShowPage() {
  // helper to format YYYY-MM-DD
  const today = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 24 * 3600 * 1000);

  // date range: this week through next week (14 days)
  const date_from = fmt(today);
  const date_to = fmt(addDays(today, 13));

  const duration = 60; // standaard 1 uur

  // Build some example visits
  const visit = (offsetDays: number, time: string, name: string): Slot => ({
    date: fmt(addDays(today, offsetDays)),
    time,
    name,
    duration,
    type: 'taken' as const,
  });

  // Find the upcoming Sunday within range and the next Tuesday
  const dayOfWeek = today.getDay(); // 0=Sun .. 6=Sat
  const daysUntil = (target: number) => (target - dayOfWeek + 7) % 7;
  const nextSundayOffset = daysUntil(0);
  const nextTuesdayOffset = daysUntil(2);

  const blockingSlots: Slot[] = [
    // Sunday morning block 10:00-12:00
    {
      date: fmt(addDays(today, nextSundayOffset)),
      time: '10:00',
      name: 'Blok: Zondagochtend',
      duration: 120,
      type: 'blocked' as const,
    },
    // Tuesday block 13:00-16:00
    {
      date: fmt(addDays(today, nextTuesdayOffset)),
      time: '13:00',
      name: 'Blok: Dinsdagmiddag',
      duration: 180,
      type: 'blocked' as const,
    },
  ];

  const page: Page = {
    reference: '',
    nonce: 'example-token',
    email: 'example@visiting-hours.app',
    name: 'Alex',
    parent_name: 'Arnold & Aline',
    date_of_birth: fmt(today),
    description: 'We zijn zo dankbaar en gelukkig om onze kleine Alex met jullie te mogen delen. Haar komst heeft ons leven met zoveel liefde en vreugde gevuld. We kijken er naar uit jullie allemaal te ontvangen en samen deze bijzondere tijd te vieren.',
    gifts: '* maat 56-62 kleertjes\n* luiers (maat 1-2)\n* of een herinnering\n\nGeen bloemen graag',
    date_from,
    date_to,
    morning_from: '10:00',
    morning_to: '12:00',
    morning_amount: 1,
    afternoon_from: '13:00',
    afternoon_to: '18:00',
    afternoon_amount: 2,
    evening_from: '18:00',
    evening_to: '21:00',
    evening_amount: 0,
    duration,
    street: 'Nieuwezijds Voorburgwal 147',
    postalcode: '1012 RJ',
    city: 'Amsterdam',
    slots: [
      visit(1, '10:00', 'Oma & Opa'),       // deze week
      visit(2, '14:00', 'Tante Lisa'),      // deze week
      visit(3, '16:00', 'Burens Joris'),    // deze week
      visit(7, '11:00', 'Vrienden Kim & Jo'), // volgende week
      visit(9, '15:00', 'Collega Eva'),     // volgende week
      ...blockingSlots,
    ],
    theme: 'pink'
  };

  return (
    <main>
      <section className="bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          <PageInfo info={page} image={ExampleBaby} />
        </div>
      </section>
      <section className="bg-gradient-to-br from-gray-200 via-gray-50 to-purple-50 px-6 py-16 md:px-12 md:py-24">
        <div className="max-w-6xl mx-auto">
          <VisitSection page={page} />
        </div>
      </section>
    </main>
  );
}
