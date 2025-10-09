'use server';

import { notFound } from 'next/navigation';
import { getPage } from '@/services/pageService';
import PageInfo from '@/components/PageInfo';
import VisitSection from '@/components/VisitSection';
import defaultBaby from '@/assets/default-baby.png';

export default async function ShowPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const page = await getPage(reference);
  if (!page) return notFound();

  return (
    <main>
      <section className="bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          <PageInfo info={page} image={defaultBaby} />
        </div>
      </section>
      <section className="bg-gradient-to-br from-gray-200 via-gray-50 to-purple-50 px-6 py-16 md:px-12 md:py-24">
        <div className="max-w-6xl mx-auto">
          <VisitSection page={page}/>
        </div>
      </section>
    </main>
  );
}
