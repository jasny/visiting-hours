import type { Metadata } from "next";
import "./globals.css";
import "primereact/resources/themes/lara-light-pink/theme.css";
import { PrimeReactProvider } from "primereact/api"

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
        <link id="theme-link" rel="stylesheet" href="/themes/lara-light-pink/theme.css" />
      </head>
      <body
        className={`antialiased`}
      >
        <PrimeReactProvider>
          {children}
        </PrimeReactProvider>
      </body>
    </html>
  );
}
