"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

interface Collection {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  href: string;
}

const COLLECTIONS: Collection[] = [
  {
    id: 1,
    title: "Femme",
    subtitle: "Élégance intemporelle",
    description:
      "Une collection raffinée qui sublime chaque silhouette avec des coupes intemporelles.",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1200&q=80",
    href: "/femme",
  },
  {
    id: 2,
    title: "Enfant",
    subtitle: "Style & confort",
    description:
      "Du style et du confort pour les petits, des tenues qui accompagnent chaque aventure.",
    image:
      "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1200&q=80",
    href: "/enfant",
  },
];

export default function FeaturedCollection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-background py-10 sm:py-12 lg:py-16 overflow-hidden"
    >
      {/* Decorative top accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-[2px] rounded-full bg-primary" />

      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10">
        {/* Header */}
        <div
          className={`mb-6 sm:mb-8 lg:mb-10 transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex flex-col items-center text-center">
            <p className="font-poppins text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-primary mb-2.5">
              Collections
            </p>
            <h2 className="font-erotique text-xl sm:text-2xl md:text-3xl text-dark">
              Nos Univers
            </h2>
            <div className="mt-3 h-px w-10 bg-dark/20" />
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 lg:gap-3">
          {COLLECTIONS.map((col, idx) => (
            <Link
              key={col.id}
              href={col.href}
              className={`group relative block overflow-hidden rounded-t-full transition-all duration-700 ease-out ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-12"
              }`}
              style={{
                transitionDelay: isVisible ? `${200 + idx * 150}ms` : "0ms",
              }}
              onMouseEnter={() => setHoveredId(col.id)}
              onMouseLeave={() => setHoveredId(null)}
              aria-label={`Découvrir la collection ${col.title}`}
            >
              {/* Image container */}
              <div className="relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden">
                <Image
                  src={col.image}
                  alt={col.title}
                  fill
                  className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />

                {/* Base overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/20 to-dark/5 transition-opacity duration-500" />

                {/* Hover overlay */}
                <div
                  className={`absolute inset-0 bg-dark/30 transition-opacity duration-500 ${
                    hoveredId === col.id ? "opacity-100" : "opacity-0"
                  }`}
                />
              </div>

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-4 md:p-5">
                {/* Subtitle tag */}
                <span
                  className={`self-start font-poppins text-[0.55rem] font-semibold uppercase tracking-[0.2em] text-background/70 mb-1 transition-all duration-500 ${
                    hoveredId === col.id
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-2"
                  }`}
                >
                  {col.subtitle}
                </span>

                {/* Title */}
                <h3 className="font-erotique text-xl sm:text-2xl lg:text-3xl text-background leading-[1.05] mb-1.5 transition-transform duration-500 ease-out group-hover:-translate-y-1">
                  {col.title}
                </h3>

                {/* Divider */}
                <div
                  className={`h-[1.5px] bg-primary rounded-full mb-2 transition-all duration-600 ease-out origin-left ${
                    hoveredId === col.id ? "w-8" : "w-5"
                  }`}
                />

                {/* Description — revealed on hover */}
                <p
                  className={`font-poppins text-[0.7rem] leading-relaxed text-background/80 max-w-[280px] mb-2.5 transition-all duration-500 ease-out ${
                    hoveredId === col.id
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-3"
                  }`}
                >
                  {col.description}
                </p>

                {/* CTA */}
                <div className="flex items-center gap-1.5 transition-all duration-500 ease-out group-hover:gap-2.5">
                  <span className="font-poppins text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-background">
                    Découvrir
                  </span>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-background/40 text-background transition-all duration-300 group-hover:bg-primary group-hover:border-primary group-hover:scale-110">
                    <ArrowRight
                      className="h-2.5 w-2.5 transition-transform duration-300 group-hover:translate-x-0.5"
                      strokeWidth={2}
                    />
                  </div>
                </div>
              </div>

              {/* Corner accent — top right */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                <div
                  className={`w-7 h-7 border border-background/20 rounded-full flex items-center justify-center transition-all duration-500 ${
                    hoveredId === col.id
                      ? "border-background/50 rotate-90 scale-110"
                      : ""
                  }`}
                >
                  <span className="font-poppins text-[0.54rem] font-semibold text-background/60 tracking-wider">
                    0{idx + 1}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
