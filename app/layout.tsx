import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kinyn.tn";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const erotique = localFont({
  src: "./fonts/ErotiqueTrial-Bold.ttf",
  variable: "--font-erotique",
  weight: "700",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "KINYN — Mode Femme & Enfant en Tunisie | Livraison Rapide",
    template: "%s | KINYN",
  },
  description:
    "Découvrez KINYN, votre boutique en ligne tunisienne de mode femme et enfant. Vêtements élégants, qualité premium et livraison partout en Tunisie.",
  keywords: [
    "mode femme Tunisie",
    "vêtements enfant Tunisie",
    "boutique en ligne Tunisie",
    "acheter vêtements Tunisie",
    "mode en ligne Tunisie",
    "livraison Tunisie",
    "KINYN",
    "robe femme Tunisie",
    "vêtements enfant en ligne",
    "prêt-à-porter Tunisie",
  ],
  authors: [{ name: "KINYN" }],
  creator: "KINYN",
  publisher: "KINYN",
  formatDetection: { telephone: true, email: true },
  openGraph: {
    type: "website",
    locale: "fr_TN",
    url: SITE_URL,
    siteName: "KINYN",
    title: "KINYN — Mode Femme & Enfant en Tunisie",
    description:
      "Boutique en ligne de mode femme et enfant. Qualité premium, prix accessibles, livraison rapide partout en Tunisie.",
    images: [
      {
        url: "/images/logo-white.png",
        width: 1200,
        height: 630,
        alt: "KINYN — Mode Femme & Enfant",
      },
    ],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: "/images/fav.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${poppins.variable} ${erotique.variable} ${erotique.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
