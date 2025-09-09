'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from 'primereact/button';
import { Plus, Eye, Star, Heart } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  return (
    <main className="flex flex-col min-h-screen">
      <section className="relative bg-gradient-to-br from-pink-100 via-rose-50 to-orange-50 overflow-hidden flex-1">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-16 left-16 w-6 h-6 border-2 border-rose-300 rounded-full" />
          <div className="absolute top-32 right-24 w-4 h-4 bg-pink-300 rounded-full" />
          <div className="absolute bottom-40 left-12 w-8 h-8 border border-orange-200 rounded-full" />
          <div className="absolute bottom-24 right-32 w-5 h-5 bg-rose-200 rounded-full" />
          <Star className="absolute top-24 left-1/4 w-6 h-6 text-rose-400 opacity-20" />
          <Star className="absolute bottom-32 right-1/4 w-4 h-4 text-pink-400 opacity-15" />
        </div>
        <div className="relative z-10 px-6 py-16 md:px-12 md:py-24">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <p className="text-rose-600 italic text-lg md:text-xl mb-4 font-light">Op kraambezoek</p>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-wide text-rose-800 mb-6 leading-tight">
                Verwelkom je<br />
                <span className="text-pink-600">kleine wonder</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed font-light mb-8 max-w-xl">
                Creëer een persoonlijke pagina om familie en vrienden uit te nodigen voor hun eerste ontmoeting met je pasgeboren kindje.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  unstyled
                  onClick={() => router.push('/create')}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 px-4 py-2 text-lg rounded-xl"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Maak je pagina
                </Button>
                <Button
                  unstyled
                  type="button"
                  className="inline-flex items-center justify-center gap-2 border-2 border-rose-200 text-rose-700 bg-white hover:text-black hover:bg-rose-50 hover:border-rose-300 transition-all duration-300 px-4 py-2 text-lg rounded-xl"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Bekijk voorbeeld
                </Button>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="relative max-w-md w-full">
                <Image
                  src="/bg-stork.jpg"
                  alt="Stork carrying baby illustration"
                  width={512}
                  height={512}
                  className="w-full h-auto object-contain"
                />
                <Heart className="absolute -top-4 -right-4 w-8 h-8 text-rose-400 opacity-60" fill="currentColor" />
                <Heart className="absolute top-1/4 -left-6 w-6 h-6 text-pink-400 opacity-40" fill="currentColor" />
                <Heart className="absolute bottom-1/4 -right-8 w-5 h-5 text-rose-300 opacity-50" fill="currentColor" />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full">
          <svg viewBox="0 0 1200 120" className="w-full h-12 md:h-16 lg:h-20" fill="none" preserveAspectRatio="none">
            <path d="M0 60C200 20 400 100 600 60C800 20 1000 100 1200 60V120H0V60Z" fill="white" />
          </svg>
        </div>
      </section>

      <section className="bg-white px-6 py-16 md:px-12 md:py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl text-gray-800 mb-8 font-light">Zo werkt het</h2>
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-gray-700 leading-relaxed font-light mb-8">
              Maak een prachtige pagina die eruitziet als een persoonlijke geboortekaart, maar dan met de handige functie om bezoeken in te plannen. Deel de link met je dierbaren en laat hen zelf een moment kiezen dat voor iedereen uitkomt.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed font-light">
              Perfect voor die eerste weken na de geboorte, wanneer je graag iedereen wilt ontvangen, maar ook rust en overzicht wilt bewaren. Zo kan iedereen op hun eigen tempo kennismaken met je kleine wonder.
            </p>
          </div>
          <div className="flex items-center justify-center mt-12 mb-8">
            <div className="flex-1 h-px bg-rose-200 max-w-24" />
            <Heart className="w-6 h-6 text-rose-400 mx-6" fill="currentColor" />
            <div className="flex-1 h-px bg-rose-200 max-w-24" />
          </div>
        </div>
      </section>

      <footer className="bg-gradient-to-br from-rose-50 to-pink-50 px-6 py-12 md:px-12 md:py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h3 className="text-2xl text-rose-800 mb-4 font-light">Deel je vreugde</h3>
            <p className="text-gray-600 font-light">Met liefde gemaakt voor alle nieuwe ouders en hun kleine wonderen.</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-rose-500">
            <Heart className="w-4 h-4" fill="currentColor" />
            <span className="text-sm font-light">&copy; 2016-2025 &mdash; Gemaakt met liefde door Arnold &amp; Aline Daniels</span>
            <Heart className="w-4 h-4" fill="currentColor" />
          </div>
        </div>
      </footer>
    </main>
  );
}
