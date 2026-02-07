"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Collection {
  id: number;
  title: string;
  description: string;
  image: string;
  href: string;
  cta: string;
}

const COLLECTIONS: Collection[] = [
  {
    id: 1,
    title: "Homme",
    description:
      "Des pièces essentielles pensées pour l'homme moderne, entre élégance et confort au quotidien.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    href: "/homme",
    cta: "Découvrir",
  },
  {
    id: 2,
    title: "Femme",
    description:
      "Une collection raffinée qui sublime chaque silhouette avec des coupes intemporelles.",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80",
    href: "/femme",
    cta: "Découvrir",
  },
  {
    id: 3,
    title: "Enfant",
    description:
      "Du style et du confort pour les petits, des tenues qui accompagnent chaque aventure.",
    image:
      "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&q=80",
    href: "/enfant",
    cta: "Découvrir",
  },
];

export default function FeaturedCollection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

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
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="bg-background py-20 px-6 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        {/* Header */}
        <div
          className={`mb-14 text-center transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <p className="font-poppins text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-primary">
            Collections
          </p>
          <h2 className="mt-2 font-erotique text-3xl text-dark sm:text-4xl">
            Nos Univers
          </h2>
          <p className="mx-auto mt-4 max-w-lg font-poppins text-[0.88rem] leading-relaxed text-dark/55">
            Explorez nos collections soigneusement conçues pour chaque style et
            chaque moment.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTIONS.map((col, idx) => (
            <div
              key={col.id}
              className={`transition-all duration-700 ease-out ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
              style={{
                transitionDelay: isVisible ? `${150 + idx * 120}ms` : "0ms",
              }}
            >
              <div className="group relative overflow-hidden rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-transform duration-200 ease-out hover:scale-[1.03]">
                {/* Image */}
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src={col.image}
                    alt={col.title}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark/70 via-dark/20 to-transparent" />
                </div>

                {/* Content overlay */}
                <div className="absolute inset-x-0 bottom-0 flex flex-col items-start p-6 sm:p-8">
                  <h3 className="font-erotique text-2xl text-background sm:text-3xl">
                    {col.title}
                  </h3>
                  <p className="mt-2 max-w-xs font-poppins text-[0.8rem] leading-relaxed text-background/75">
                    {col.description}
                  </p>
                  <Link
                    href={col.href}
                    className="mt-5 inline-block rounded-full bg-primary px-7 py-2.5 font-poppins text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-background transition-all duration-200 ease-out hover:bg-primary/90 hover:scale-105 active:scale-[0.98]"
                    aria-label={`Découvrir la collection ${col.title}`}
                  >
                    {col.cta}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
