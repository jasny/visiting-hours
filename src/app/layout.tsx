import type { Metadata } from "next";
import "./globals.css";
import "primereact/resources/themes/lara-light-pink/theme.css";
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
