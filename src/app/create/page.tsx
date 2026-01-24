import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PageForm from '@/components/PageForm';

export default async function CreatePage() {
  const defaultValues = {
    name: '',
    parent_name: '',
    email: '',
    description: '',
    gifts: '',
    date_from: undefined,
    date_to: undefined,
    date_of_birth: null,
    street: '',
    postalcode: '',
    city: '',
    duration: 60,
    morning_from: '10:00',
    morning_to: '12:00',
    morning_amount: 1,
    afternoon_from: '12:00',
    afternoon_to: '18:00',
    afternoon_amount: 2,
    evening_from: '18:00',
    evening_to: '21:00',
    evening_amount: 0,
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-6">
      <div className="max-w-4xl mx-auto px-4">
        <header className="mb-6 flex items-center gap-2">
          <Link href="/" className="flex items-center text-sm text-pink-600">
            <ArrowLeft className="mr-1 h-4 w-4" /> Terug
          </Link>
        </header>
        <h1 className="text-center text-2xl font-light text-pink-700">
          Maak je pagina
        </h1>
        <p className="mb-8 text-center text-sm font-light text-gray-500">
          Deel je vreugde met familie en vrienden
        </p>
        <PageForm values={defaultValues} />
      </div>
    </main>
  );
}
