import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PageForm from '@/components/PageForm';
import { getPage } from "@/services/pageService"
import { notFound } from "next/navigation"

export default async function EditPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const page = await getPage(reference);
  if (!page?.manage_token) return notFound();

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-6">
      <div className="max-w-4xl mx-auto px-4">
        <header className="mb-6 flex items-center gap-2">
          <Link href={`/page/${reference}`} className="flex items-center text-sm text-pink-600">
            <ArrowLeft className="mr-1 h-4 w-4" /> Terug
          </Link>
        </header>
        <h1 className="text-center text-2xl font-light text-pink-700">
          Jouw pagina
        </h1>
        <p className="mb-8 text-center text-sm font-light text-gray-500">
          Deel je vreugde met familie en vrienden
        </p>
        <PageForm values={page} />
      </div>
    </main>
  );
}
