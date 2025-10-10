'use server';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPage } from '@/services/pageService';
import PageInfo from '@/components/PageInfo';
import VisitSection from '@/components/VisitSection';
import defaultBaby from '@/assets/default-baby.png';
import { Pencil } from 'lucide-react';
import ThemeSwitcher, { type VisitTheme } from '@/components/ThemeSwitcher';

export default async function ShowPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const page = await getPage(reference);
  if (!page) return notFound();

  const isAdmin = !!page.manage_token;
  const theme = (['pink', 'blue', 'green'].includes(page.theme) ? page.theme : 'pink') as VisitTheme;

  return (
    <main data-visit-theme={theme}>
      <ThemeSwitcher reference={page.reference} theme={theme} isAdmin={isAdmin} />

      {(isAdmin) && (
        <Link
          href={`/edit/${reference}`}
          className="absolute top-2 right-2 md:top-4 md:right-4 inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur border border-[var(--divider)] px-3 py-2 text-[var(--theme-700)] shadow-sm hover:bg-white hover:text-[var(--theme-800)] z-50"
          aria-label="Pagina bewerken"
        >
          <Pencil className="w-4 h-4" />
          <span className="hidden sm:inline">Bewerken</span>
        </Link>
      )}

      <section className="bg-gradient-to-br from-[var(--hero-from)] via-[var(--hero-via)] to-[var(--hero-to)] p-4 md:p-8">
        <div className="max-w-6xl mx-auto flex flex-col gap-4 relative">
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
