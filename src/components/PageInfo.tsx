'use client';


import { Page } from "@/lib/types"

interface Props {
  info: Page;
}

export default function PageInfo({ info }: Props) {
  return (
    <section className="w-full max-w-3xl mx-auto my-6">
      <div className="rounded-2xl border border-indigo-100 bg-white/70 backdrop-blur p-6">
        <h1 className="text-2xl font-semibold text-indigo-800 mb-2">{info.name || 'de baby'}</h1>
        {info.description && <p className="text-gray-700 mb-2">{info.description}</p>}
        {info.city && (
          <p className="text-gray-600">
            {info.street}, {info.postalcode} {info.city}
          </p>
        )}
      </div>
    </section>
  );
}
