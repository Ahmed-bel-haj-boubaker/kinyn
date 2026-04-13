"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

interface Collection {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
}

export default function FeaturedCollection({
  initialCollections,
}: {
  initialCollections?: Collection[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>(
    initialCollections ?? [],
  );

  useEffect(() => {
    if (initialCollections && initialCollections.length > 0) return;
    fetch("/api/collections")
      .then((res) => res.json())
      .then((data) => {
        if (data.collections) {
          setCollections(
            data.collections
              .slice(0, 3)
              .map(
                (c: {
                  id: string;
                  name: string;
                  description: string;
                  image: string;
                  slug: string;
                }) => ({
                  id: c.id,
                  title: c.name,
                  description: c.description,
                  image: c.image,
                  href: `/collections/${c.slug}`,
                }),
              ),
          );
        }
      })
      .catch(() => {});
  }, [initialCollections]);

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
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const count = collections.length;

  return (
    <section
      ref={sectionRef}
      className="relative bg-background py-14 sm:py-16 lg:py-20 overflow-hidden"
    >
      {count === 0 ? null : (
        <>
          {/* Header */}
          <div
            className={`mb-8 sm:mb-10 lg:mb-12 transition-all duration-700 ease-out ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-3 mb-3">
                <span className="h-px w-8 bg-primary/60" />
                <p className="font-poppins text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-primary">
                  Collections
                </p>
                <span className="h-px w-8 bg-primary/60" />
              </div>
              <h2 className="font-erotique text-2xl sm:text-3xl md:text-[2.1rem] text-dark leading-tight">
                Nos Univers
              </h2>
            </div>
          </div>

          {/* Cards grid */}
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10">
            <div
              className={
                count === 3
                  ? "grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-3 md:auto-rows-fr"
                  : count === 1
                    ? "flex justify-center"
                    : "grid grid-cols-1 md:grid-cols-2 gap-3"
              }
            >
              {collections.map((col, idx) => {
                const isHero = count === 3 && idx === 0;

                return (
                  <Link
                    key={col.id}
                    href={col.href}
                    className={`group relative block overflow-hidden transition-all duration-700 ease-out ${
                      isHero ? "md:row-span-2" : ""
                    } ${count === 1 ? "w-full max-w-lg" : ""} ${
                      isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-10"
                    }`}
                    style={{
                      transitionDelay: isVisible
                        ? `${150 + idx * 120}ms`
                        : "0ms",
                    }}
                    onMouseEnter={() => setHoveredId(col.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    aria-label={`Découvrir la collection ${col.title}`}
                  >
                    {/* Image */}
                    <div
                      className={`relative w-full overflow-hidden ${
                        isHero
                          ? "aspect-[3/4] sm:aspect-[4/5] md:aspect-auto md:h-full"
                          : "aspect-[3/4] sm:aspect-[4/5] md:aspect-[5/4]"
                      }`}
                    >
                      <Image
                        src={col.image}
                        alt={col.title}
                        fill
                        className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.25,.46,.45,.94)] group-hover:scale-105"
                        sizes={
                          isHero
                            ? "(max-width: 768px) 100vw, 50vw"
                            : "(max-width: 768px) 100vw, 50vw"
                        }
                        priority={idx < 2}
                      />

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                      {/* Hover overlay */}
                      <div
                        className={`absolute inset-0 bg-black/20 transition-opacity duration-600 ${
                          hoveredId === col.id ? "opacity-100" : "opacity-0"
                        }`}
                      />

                      {/* Top border accent on hover */}
                      <div
                        className={`absolute top-0 left-0 right-0 h-[2px] bg-primary transition-all duration-500 origin-left ${
                          hoveredId === col.id ? "scale-x-100" : "scale-x-0"
                        }`}
                      />
                    </div>

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
                      {/* Collection number */}
                      <span
                        className={`font-poppins text-[0.6rem] font-medium uppercase tracking-[0.25em] text-white/50 mb-2 transition-all duration-500 ${
                          hoveredId === col.id
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-2"
                        }`}
                      >
                        Collection 0{idx + 1}
                      </span>

                      {/* Title */}
                      <h3
                        className={`font-erotique text-background leading-none mb-2 transition-transform duration-500 ease-out group-hover:-translate-y-0.5 ${
                          isHero
                            ? "text-2xl sm:text-3xl lg:text-[2.2rem]"
                            : "text-xl sm:text-2xl"
                        }`}
                      >
                        {col.title}
                      </h3>

                      {/* Animated divider */}
                      <div
                        className={`h-[1.5px] bg-primary mb-3 transition-all duration-500 ease-out origin-left ${
                          hoveredId === col.id ? "w-10" : "w-6"
                        }`}
                      />

                      {/* Description */}
                      <p
                        className={`font-poppins text-[0.7rem] leading-relaxed text-white/70 mb-4 transition-all duration-500 ease-out ${
                          isHero ? "max-w-[300px]" : "max-w-[260px]"
                        } ${
                          hoveredId === col.id
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-3"
                        }`}
                      >
                        {col.description}
                      </p>

                      {/* CTA */}
                      <div className="flex items-center gap-2 transition-all duration-500 ease-out group-hover:gap-3">
                        <span className="font-poppins text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-background/90">
                          Découvrir
                        </span>
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full border text-background transition-all duration-400 ${
                            hoveredId === col.id
                              ? "bg-primary border-primary scale-100"
                              : "border-white/30 scale-90"
                          }`}
                        >
                          <ArrowRight
                            className={`h-3 w-3 transition-transform duration-400 ${
                              hoveredId === col.id ? "translate-x-0.5" : ""
                            }`}
                            strokeWidth={2}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
