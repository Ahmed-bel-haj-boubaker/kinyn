"use client";

import Image from "next/image";
import { useState, useCallback } from "react";
import HeroSection from "./HeroSection";
import ProductSlider from "./ProductSlider";
import FeaturedCollection from "./FeaturedCollection";
import Newsletter from "./Newsletter";
import KinynSection from "./KinynSection";
import LogoMarquee from "./LogoMarquee";
import ContactSection from "./ContactSection";

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

  const handleVideoReady = useCallback(() => {
    setVideoReady(true);
  }, []);

  return (
    <>
      {/* Full-screen loading overlay — only logo, fades out when video is ready */}
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
