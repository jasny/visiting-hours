'use server';

import { notFound } from 'next/navigation';
import { getPage } from '@/services/pageService';
import PageInfo from '@/components/PageInfo';
import VisitSection from '@/components/VisitSection';

export default async function ShowPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const page = await getPage(reference);
  if (!page) return notFound();

  return (
    <main>
      <section className="bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          <PageInfo info={page} />
        </div>
      </section>
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-6 py-16 md:px-12 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl text-indigo-800 mb-4">Plan je bezoek</h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto leading-relaxed">
              Kies een moment dat voor jou uitkomt om {page.name} te ontmoeten. We houden de bezoeken kort en gezellig, zodat iedereen kan genieten.
            </p>
          </div>
          <VisitSection page={page} />
        </div>
      </section>
    </main>
  );
}
