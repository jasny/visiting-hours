import type { Metadata } from "next";
import "./globals.css";
import { PrimeReactProvider } from "primereact/api"
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  title: "Gratis kraambezoek plannen | OpKraambezoek.nl",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>Gratis kraambezoek plannen | OpKraambezoek.nl</title>
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link id="theme-link" rel="stylesheet" href="/themes/lara-light-pink/theme.css" />
      </head>
      <body
        className={`antialiased`}
      >
        <PrimeReactProvider>
          {children}
        </PrimeReactProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
