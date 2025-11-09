'use server';

import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getPage } from '@/services/pageService';
import PageInfo from '@/components/PageInfo';
import VisitSection from '@/components/VisitSection';
import defaultBaby from '@/assets/default-baby.webp';
import ThemeSwitcher, { type VisitTheme } from '@/components/ThemeSwitcher';
import AdminActions from '@/components/AdminActions';

export async function generateMetadata(
  { params }: { params: Promise<{ reference: string }> }
): Promise<Metadata> {
  const { reference } = await params;
  const page = await getPage(reference);

  if (!page) {
    return {};
  }

  const hostname = process.env.NEXT_PUBLIC_S3_HOSTNAME;
  const ogImage = hostname && page.image ? `https://${hostname}/${page.image}` : '/bg-stork.jpg';

  const title = `${page.name} — Kraambezoek plannen`;
  const description = `Plan je kraambezoek voor ${page.name}. Kies eenvoudig een moment en laat weten wanneer je komt.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/page/${reference}`,
      type: 'website',
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ShowPage({ params, searchParams }: { params: Promise<{ reference: string }>, searchParams: Promise<{ manage?: string }> }) {
  const [{ reference }, { manage }] = await Promise.all([params, searchParams]);

  // Backwards compatibility
  if (manage) {
    return redirect(`/page/${reference}/manage?token=${manage}`);
  }

  const page = await getPage(reference);
  if (!page) return notFound();

  const isAdmin = !!page.manage_token;
  const theme = (['pink', 'blue', 'green'].includes(page.theme) ? page.theme : 'pink') as VisitTheme;

  const extraPadding = isAdmin ? 'pt-18 md:pt-8' : 'pt-10 md:pt-8';

  return (
    <main data-visit-theme={theme}>
      <ThemeSwitcher reference={page.reference} theme={theme} isAdmin={isAdmin} />

      {(isAdmin) && (
        <div className="absolute top-3 right-3 md:top-4 md:right-4">
          <AdminActions reference={reference} />
        </div>
      )}

      <section className={`bg-gradient-to-br from-[var(--hero-from)] via-[var(--hero-via)] to-[var(--hero-to)] p-4 md:p-8 ${extraPadding}`}>
        <div className="max-w-6xl mx-auto flex flex-col gap-4 relative">
          <PageInfo info={page} image={defaultBaby} editable={isAdmin} />
        </div>
      </section>

      <section className="bg-gradient-to-br from-gray-200 via-gray-50 to-purple-50 px-6 py-16 md:px-12 md:py-24" style={{ breakBefore: 'page' }}>
        <div className="max-w-6xl mx-auto">
          <VisitSection page={page} isAdmin={isAdmin} />
        </div>
      </section>
    </main>
  );
}
