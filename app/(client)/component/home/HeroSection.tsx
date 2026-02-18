"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-primary">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[80vh]">
        {/* ─── Left: Text Content ─── */}
        <div className="relative flex items-center justify-center px-6 py-20 lg:py-24 lg:px-12">
          <div className="max-w-xl space-y-7">
            {/* Label with accent */}
            <div className="flex items-center gap-4">
              <div className="h-[1px] w-9 bg-white" />
              <p className="font-poppins text-[0.58rem] font-semibold uppercase tracking-[0.35em] text-white">
                Nouvelle Collection 2026
              </p>
            </div>

            {/* Main heading */}
            <h1 className="font-erotique text-4xl leading-[1.05] text-background sm:text-5xl md:text-6xl lg:text-7xl">
              L&apos;Élégance
              <br />
              <span className="italic">Redéfinie</span>
            </h1>

            {/* Description */}
            <p className="font-poppins text-[0.82rem] leading-[1.85] text-background/70 max-w-md">
              Découvrez des pièces intemporelles conçues pour sublimer chaque
              instant de votre quotidien.
            </p>

            {/* CTA button */}
            <div className="pt-4">
              <Link
                href="/femme"
                className="group inline-flex items-center gap-3 rounded-full bg-background px-10 py-4 font-poppins text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-primary transition-all duration-300 ease-out hover:gap-4 hover:pl-11 hover:pr-9 hover:bg-background/95 active:scale-[0.97]"
              >
                Découvrir la collection
                <span className="text-lg transition-transform duration-300 group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </div>

            {/* Bottom decorative element */}
            <div className="flex items-center gap-3 pt-6">
              <div className="h-[1px] w-12 bg-background/20" />
              <div className="h-1 w-1 rounded-full bg-background/40" />
              <div className="h-[1px] w-12 bg-background/20" />
            </div>
          </div>
        </div>

        {/* ─── Right: Video ─── */}
        <div className="relative overflow-hidden min-h-[60vh] lg:min-h-full">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/video/hero.mp4" type="video/mp4" />
          </video>

          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-dark/10 via-transparent to-dark/20" />

          {/* Decorative corner element */}
          <div className="absolute bottom-8 right-8 hidden lg:block">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-background/10 backdrop-blur-sm bg-background/5">
              <div className="h-1.5 w-1.5 rounded-full bg-background animate-pulse" />
              <span className="font-poppins text-[0.52rem] font-medium uppercase tracking-[0.25em] text-background/70">
                Collection 2026
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
