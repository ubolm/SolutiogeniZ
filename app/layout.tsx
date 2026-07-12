import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";

import "@/app/globals.css";
import { brand } from "@/lib/constants";
import { getSiteUrl } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});
const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "SolutiogeniZ | Automatización y desarrollo a medida para empresas",
  description:
    "Automatización, integración y desarrollo a medida para ordenar procesos y reducir tareas manuales.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SolutiogeniZ | Automatización y desarrollo a medida para empresas",
    description: brand.description,
    url: siteUrl,
    siteName: "SolutiogeniZ",
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1733,
        height: 907,
        alt: "SolutiogeniZ: automatización, integración y desarrollo a medida.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SolutiogeniZ | Automatización y desarrollo a medida para empresas",
    description: brand.description,
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={`${inter.variable} ${sora.variable}`} lang="es">
      <body>{children}</body>
    </html>
  );
}
