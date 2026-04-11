"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import HeroSection from "./component/home/HeroSection";
import ProductSlider from "./component/home/ProductSlider";
import FeaturedCollection from "./component/home/FeaturedCollection";
import Newsletter from "./component/home/Newsletter";
import KinynSection from "./component/home/KinynSection";
import LogoMarquee from "./component/home/LogoMarquee";
import ContactSection from "./component/home/ContactSection";

import JsonLd, {
  organizationJsonLd,
  webSiteJsonLd,
} from "./component/shared/JsonLd";

export default function Page() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function preload() {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error("fetch failed");
        await res.json();
      } catch {
        /* show page even if categories fail */
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    preload();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
        <Image
          src="/images/logo.png"
          alt="KINYN"
          width={120}
          height={120}
          priority
          className="mb-8 animate-pulse"
        />
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kinyn.tn";

  return (
    <>
      <JsonLd data={organizationJsonLd(siteUrl)} />
      <JsonLd data={webSiteJsonLd(siteUrl)} />
      <HeroSection />
      <LogoMarquee />
      <ProductSlider />
      <FeaturedCollection />

      <KinynSection />

      <Newsletter />
      <ContactSection />
    </>
  );
}
