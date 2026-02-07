"use client";

import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ minHeight: "80vh" }}
    >
      <Image
        src="/images/hero.jpg"
        alt="Collection KINYN"
        fill
        className="object-cover object-center"
        priority
        quality={90}
        sizes="100vw"
      />

      <div className="absolute inset-0 bg-dark/30" />

      <div className="relative z-10 flex min-h-[80vh] items-center justify-center px-6 py-20 text-center">
        <div className="max-w-2xl space-y-6">
          <p className="font-poppins text-[0.75rem] font-semibold uppercase tracking-[0.25em] text-background/80">
            Nouvelle Collection 2026
          </p>

          <h1 className="font-erotique text-4xl leading-tight text-background sm:text-5xl md:text-6xl lg:text-7xl">
            L&apos;Élégance Redéfinie
          </h1>

          <p className="mx-auto max-w-md font-poppins text-[0.9rem] leading-relaxed text-background/75 sm:text-base">
            Découvrez des pièces intemporelles conçues pour sublimer chaque
            instant de votre quotidien.
          </p>

          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-block rounded-full bg-primary px-10 py-3.5 font-poppins text-[0.82rem] font-semibold tracking-wide text-background transition-transform duration-200 ease-out hover:scale-105 active:scale-[0.98]"
            >
              Découvrir la collection
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
