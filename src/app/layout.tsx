import type { Metadata } from "next";
import "@/styles/theme.css";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3010"),
  title: "VNK Hub — Dropship Manager",
  description: "Gestion centralisée de boutiques dropshipping",
  applicationName: "VNK Hub",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo/svg/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
    other: [{ rel: "mask-icon", url: "/logo/svg/icon-mono-dark.svg" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: "VNK Hub",
    title: "VNK Hub — Dropship Manager",
    description: "Plateforme de gestion dropshipping",
    images: [{ url: "/logo/og-image.png", width: 1200, height: 630, alt: "VNK Hub" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VNK Hub — Dropship Manager",
    description: "Plateforme de gestion dropshipping",
    images: ["/logo/twitter-card.png"],
  },
  other: {
    "msapplication-TileColor": "#0B0D12",
    "msapplication-TileImage": "/mstile-150x150.png",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport = {
  themeColor: "#0B0D12",
};

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("vnkhub-theme");
    if (stored === "light") {
      document.documentElement.classList.add("light");
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
