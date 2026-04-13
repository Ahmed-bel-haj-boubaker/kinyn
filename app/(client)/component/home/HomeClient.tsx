"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useState, useCallback, useEffect } from "react";
import HeroSection from "./HeroSection";
import LogoMarquee from "./LogoMarquee";

/* ── Lazy-load below-fold sections (code-split) ── */
const ProductSlider = dynamic(() => import("./ProductSlider"), {
  ssr: false,
});
const FeaturedCollection = dynamic(() => import("./FeaturedCollection"), {
  ssr: false,
});
const KinynSection = dynamic(() => import("./KinynSection"), {
  ssr: false,
});
const Newsletter = dynamic(() => import("./Newsletter"), {
  ssr: false,
});
const ContactSection = dynamic(() => import("./ContactSection"), {
  ssr: false,
});

interface Collection {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
}

export default function HomeClient({
  collections,
}: {
  collections: Collection[];
}) {
  const [videoReady, setVideoReady] = useState(false);
  const [loaderDismissed, setLoaderDismissed] = useState(false);

  const handleVideoReady = useCallback(() => {
    setVideoReady(true);
  }, []);

  /* Auto-dismiss the loader after 3s even if video hasn't loaded */
  useEffect(() => {
    const timer = setTimeout(() => setVideoReady(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  /* Remove loader from DOM after fade-out completes */
  useEffect(() => {
    if (!videoReady) return;
    const timer = setTimeout(() => setLoaderDismissed(true), 700);
    return () => clearTimeout(timer);
  }, [videoReady]);

  return (
    <>
      {/* Full-screen loading overlay — fades out when video ready or after 3s */}
      {!loaderDismissed && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-700 ${
            videoReady ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <Image
            src="/images/logo.png"
            alt="KINYN"
            width={120}
            height={120}
            priority
            className="animate-pulse"
          />
        </div>
      )}

      <HeroSection onVideoReady={handleVideoReady} />
      <LogoMarquee />
      <ProductSlider />
      <FeaturedCollection initialCollections={collections} />
      <KinynSection />
      <Newsletter />
      <ContactSection />
    </>
  );
}
