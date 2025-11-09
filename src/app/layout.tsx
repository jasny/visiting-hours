import type { Metadata } from "next";
import "./globals.css";
import { PrimeReactProvider } from "primereact/api"
import { Analytics } from '@vercel/analytics/react'
import { ConfirmDialog } from "primereact/confirmdialog"

export const metadata: Metadata = {
  metadataBase: new URL("https://www.opkraambezoek.nl"),
  title: "Gratis kraambezoek plannen | OpKraambezoek.nl",
  description: "Plan en beheer eenvoudig gratis kraambezoek: deel een link, laat bezoekers zelf een tijdslot kiezen en houd alles overzichtelijk.",
  openGraph: {
    title: "Gratis kraambezoek plannen | OpKraambezoek.nl",
    description: "Plan en beheer eenvoudig gratis kraambezoek: deel een link, laat bezoekers zelf een tijdslot kiezen en houd alles overzichtelijk.",
    url: "/",
    siteName: "OpKraambezoek.nl",
    locale: "nl_NL",
    type: "website",
    images: [
      {
        url: "/bg-stork.jpg",
        width: 1200,
        height: 630,
        alt: "OpKraambezoek.nl — Gratis kraambezoek plannen",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gratis kraambezoek plannen | OpKraambezoek.nl",
    description: "Plan en beheer eenvoudig gratis kraambezoek: deel een link, laat bezoekers zelf een tijdslot kiezen en houd alles overzichtelijk.",
    images: ["/bg-stork.jpg"],
  },
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
          <ConfirmDialog />
        </PrimeReactProvider>
        <Analytics />
      </body>
    </html>
  );
}
