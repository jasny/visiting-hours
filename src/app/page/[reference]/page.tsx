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
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-4">
        <PageInfo info={page} />
        <VisitSection page={page} />
      </div>
    </main>
  );
}
