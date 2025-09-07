'use server';

import CreatePageForm from '@/components/CreatePageForm';

export default async function CreatePage() {
  return (
    <main className="p-4">
      <h1>Pagina voor het kraambezoek aanmaken</h1>
      <CreatePageForm />
    </main>
  );
}
