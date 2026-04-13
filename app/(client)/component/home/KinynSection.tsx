"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

// Animated counter hook
function useCounter(
  target: number,
  isActive: boolean,
  duration: number = 2000,
) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Easing function (easeOutQuart)
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isActive, target, duration]);

  return count;
}

// Counter display component
function AnimatedCounter({
  value,
  suffix = "",
  isVisible,
}: {
  value: number;
  suffix?: string;
  isVisible: boolean;
}) {
  const count = useCounter(value, isVisible);
  return (
    <>
      {count.toLocaleString()}
      {suffix}
    </>
  );
}

export default function KinynSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-background py-14 sm:py-20 md:py-24 lg:py-32 overflow-hidden"
    >
      {/* decorative accent line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-primary rounded-full" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
          {/* -------- image column -------- */}
          <div
            className={`relative transition-all duration-700 ease-out delay-100 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-12"
            }`}
          >
            {/* main lifestyle frame */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5]">
              <Image
                src="/images/kyninimg2.jpg"
                alt="Collection Kinyn — Lifestyle"
                fill
                sizes="(max-width:1024px)100vw,50vw"
                className="object-cover"
                loading="lazy"
              />
              {/* subtle gradient overlay at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark/30 via-transparent to-transparent" />
            </div>

            {/* floating logo badge */}
            <div
              className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6
                          w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl bg-white
                          shadow-xl flex items-center justify-center p-2 sm:p-3"
            >
              <Image
                src="/images/logo2.png"
                alt="Kinyn"
                width={112}
                height={112}
                className="object-contain"
                loading="lazy"
              />
            </div>

            {/* decorative dot grid */}
            <div
              className="absolute -top-6 -left-6 w-28 h-28 opacity-20 pointer-events-none
                          hidden lg:block"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #b31b21 1.5px, transparent 1.5px)",
                backgroundSize: "12px 12px",
              }}
            />
          </div>

          {/* -------- text column -------- */}
          <div
            className={`flex flex-col transition-all duration-700 ease-out delay-300 ${
              isVisible
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-12"
            }`}
          >
            {/* small eyebrow */}
            <span className="font-erotique text-primary text-sm sm:text-base tracking-widest uppercase mb-4">
              Notre histoire
            </span>

            <h2 className="font-erotique text-dark text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-tight leading-tight mb-4 sm:mb-6">
              À propos de Kinyn
            </h2>

            {/* accent bar */}
            <span className="block w-12 sm:w-16 h-1 bg-primary rounded-full mb-5 sm:mb-8" />

            <p className="font-poppins text-dark/70 text-sm sm:text-base md:text-lg leading-relaxed mb-4 sm:mb-5">
              Née d&apos;une passion pour l&apos;artisanat et l&apos;élégance
              intemporelle,{" "}
              <strong className="text-dark font-semibold">Kinyn</strong> est
              bien plus qu&apos;une marque — c&apos;est une vision. Chaque pièce
              est pensée comme une œuvre : des coupes précises, des matières
              nobles et un souci du détail qui reflète notre engagement envers
              l&apos;excellence.
            </p>

            <p className="font-poppins text-dark/70 text-sm sm:text-base md:text-lg leading-relaxed mb-4 sm:mb-5">
              Inspirée par la richesse du savoir-faire tunisien et les codes du
              luxe contemporain, Kinyn habille ceux qui recherchent un style
              raffiné, authentique et durable. Nos collections sont conçues pour
              transcender les tendances et devenir les classiques de demain.
            </p>

            <p className="font-erotique text-dark/60 text-sm sm:text-base md:text-lg leading-relaxed mb-6 sm:mb-10 italic">
              &ldquo;L&apos;élégance n&apos;est pas une question de mode, mais
              d&apos;attitude.&rdquo;
            </p>

            {/* stats row */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-10">
              <div className="text-center lg:text-left">
                <span className="block font-poppins text-primary text-2xl sm:text-3xl font-semibold tabular-nums">
                  <AnimatedCounter
                    value={500}
                    suffix="+"
                    isVisible={isVisible}
                  />
                </span>
                <span className="font-poppins text-dark/50 text-xs sm:text-sm">
                  Créations
                </span>
              </div>
              <div className="text-center lg:text-left">
                <span className="block font-poppins text-primary text-2xl sm:text-3xl font-semibold tabular-nums">
                  <AnimatedCounter
                    value={15}
                    suffix="k+"
                    isVisible={isVisible}
                  />
                </span>
                <span className="font-poppins text-dark/50 text-xs sm:text-sm">
                  Clients
                </span>
              </div>
              <div className="text-center lg:text-left">
                <span className="block font-poppins text-primary text-2xl sm:text-3xl font-semibold tabular-nums">
                  <AnimatedCounter
                    value={100}
                    suffix="%"
                    isVisible={isVisible}
                  />
                </span>
                <span className="font-poppins text-dark/50 text-xs sm:text-sm">
                  Qualité
                </span>
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/femme"
              aria-label="Découvrir la collection Kinyn"
              className="group inline-flex items-center gap-3 self-start
                         bg-primary text-white font-poppins font-semibold
                         text-sm sm:text-base px-8 py-3.5 rounded-full
                         hover:bg-dark transition-colors duration-300
                         shadow-lg hover:shadow-xl"
            >
              Découvrir la collection
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
