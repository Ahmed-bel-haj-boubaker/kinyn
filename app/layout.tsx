import type { Metadata } from "next";
import Script from "next/script";
import { Poppins } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kinyn.tn";

const FB_PIXEL_ID = "1069425082670521";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
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
    default: "KINYN — Mode Femme en Tunisie | Livraison Rapide",
    template: "%s | KINYN",
  },
  description:
    "Découvrez KINYN, votre boutique en ligne tunisienne de mode femme . Vêtements élégants, qualité premium et livraison partout en Tunisie.",
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
      <head>
        {/* Meta Pixel Code */}
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${FB_PIXEL_ID}');
fbq('track', 'PageView');
          `}
        </Script>
        {/* End Meta Pixel Code */}
      </head>
      <body
        className={`${poppins.variable} ${erotique.variable} ${erotique.className} antialiased`}
      >
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
        {children}
      </body>
    </html>
  );
}
