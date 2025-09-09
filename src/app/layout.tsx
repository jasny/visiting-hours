import type { Metadata } from "next";
import "./globals.css";
import "primereact/resources/themes/lara-light-pink/theme.css";

export const metadata: Metadata = {
  title: "Op kraambezoek",
  description: "Creëer een persoonlijke pagina om familie en vrienden uit te nodigen voor hun eerste ontmoeting met je pasgeboren kindje.",
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
        {children}
      </body>
    </html>
  );
}
