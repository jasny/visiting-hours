import type { Metadata } from "next";
import "./globals.css";
import "primereact/resources/themes/lara-light-pink/theme.css";

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
        {children}
      </body>
    </html>
  );
}
