import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SafeDocs Portal - Sicherer Dokumentenaustausch",
  description:
    "Tauschen Sie Dokumente sicher über unser Portal aus. Kein E-Mail-Risiko, volle Kontrolle, DSGVO-konform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
