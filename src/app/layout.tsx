import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dropship Manager",
  description: "Gestion centralisée de boutiques dropshipping",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
