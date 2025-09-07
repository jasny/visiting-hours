'use server';

import Link from 'next/link';
import { Button } from 'primereact/button';

export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center text-center p-4"
      style={{ backgroundImage: 'url(/bg-stork.jpg)', backgroundSize: 'cover' }}
    >
      <h1>Op kraambezoek</h1>
      <p>
        Maak in twee stappen een eigen pagina voor jouw kraambezoek. Via deze pagina kunnen familie en vrienden zelf aangeven wanneer ze op bezoek willen komen.
      </p>
      <p>Jij geeft aan wanneer, hoeveel en hoelang je bezoek wilt ontvangen.</p>
      <Link href="/create">
        <Button label="Start" />
      </Link>
    </main>
  );
}
