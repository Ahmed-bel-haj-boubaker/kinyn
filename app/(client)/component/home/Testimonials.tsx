/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  location: string;
  avatar: string;
  quote: string;
  rating: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Amira B.",
    location: "Tunis",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    quote:
      "La qualité des tissus est exceptionnelle. Chaque pièce que j'ai commandée dépasse mes attentes. KINYN est devenu ma marque préférée.",
    rating: 5,
  },
  {
    id: 2,
    name: "Yassine M.",
    location: "Sfax",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    quote:
      "Un style unique et une coupe parfaite. Les t-shirts oversize sont incroyablement confortables. Je recommande vivement !",
    rating: 5,
  },
  {
    id: 3,
    name: "Sarra K.",
    location: "Sousse",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    quote:
      "Livraison rapide et emballage soigné. La robe que j'ai reçue est exactement comme sur les photos. Merci KINYN !",
    rating: 5,
  },
  {
    id: 4,
    name: "Mohamed A.",
    location: "Monastir",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    quote:
      "Enfin une marque tunisienne qui propose du vrai luxe accessible. Les finitions sont impeccables sur chaque article.",
    rating: 4,
  },
  {
    id: 5,
    name: "Nour H.",
    location: "Tunis",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80",
    quote:
      "J'ai acheté pour toute la famille. La collection enfant est adorable et résistante. On adore !",
    rating: 5,
  },
];

const CARD_GAP = 24;

export default function Testimonials() {
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [cardWidth, setCardWidth] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const totalOriginal = TESTIMONIALS.length;
  const extended = [...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS];
  const offset = totalOriginal;

  /* ── Intersection observer for entrance animation ── */
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

  /* ── Measure ── */
  const measure = useCallback(() => {
    const container = trackRef.current?.parentElement;
    if (!container) return;
    const cw = container.clientWidth;
    let cols = 3;
    if (cw < 640) cols = 1;
    else if (cw < 1024) cols = 2;
    const w = (cw - CARD_GAP * (cols - 1)) / cols;
    setCardWidth(w);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      measure();
    }, 100);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  /* ── Translate ── */
  const getTranslateX = useCallback(
    (idx: number) => -(offset + idx) * (cardWidth + CARD_GAP),
    [cardWidth, offset],
  );

  /* ── Infinite loop reset ── */
  const handleTransitionEnd = useCallback(() => {
    setIsTransitioning(false);
    setCurrentIndex((prev) => {
      if (prev >= totalOriginal) return prev - totalOriginal;
      if (prev < -totalOriginal) return prev + totalOriginal;
      return prev;
    });
  }, [totalOriginal]);

  /* ── Navigate ── */
  const scroll = useCallback(
    (dir: "left" | "right") => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + (dir === "right" ? 1 : -1));
    },
    [isTransitioning],
  );

  /* ── Touch / swipe ── */
  const touchStartX = useRef(0);
  const touchDelta = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDelta.current = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchDelta.current = e.touches[0].clientX - touchStartX.current;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (Math.abs(touchDelta.current) > 50) {
      scroll(touchDelta.current < 0 ? "right" : "left");
    }
  }, [scroll]);

  /* ── Loading state ── */
  if (cardWidth === 0) {
    return (
      <section className="bg-dark/[0.02] py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-12 text-center">
            <p className="font-poppins text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-primary">
              Témoignages
            </p>
            <h2 className="mt-1.5 sm:mt-2 font-erotique text-2xl sm:text-3xl lg:text-4xl text-dark">
              Ce Que Disent Nos Clients
            </h2>
          </div>
          <div className="overflow-hidden">
            <div className="h-[300px]" ref={trackRef} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="bg-dark/[0.02] py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-10"
    >
      <div className="mx-auto max-w-[1440px]">
        {/* Header */}
        <div
          className={`mb-8 sm:mb-10 lg:mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div>
            <p className="font-poppins text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-primary">
              Témoignages
            </p>
            <h2 className="mt-2 font-erotique text-3xl text-dark sm:text-4xl">
              Ce Que Disent Nos Clients
            </h2>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-primary text-background transition-transform duration-200 ease-out hover:scale-105 active:scale-95"
              aria-label="Témoignages précédents"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-primary text-background transition-transform duration-200 ease-out hover:scale-105 active:scale-95"
              aria-label="Témoignages suivants"
            >
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Slider */}
        <div
          className={`overflow-hidden transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: isVisible ? "200ms" : "0ms" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            ref={trackRef}
            className={
              isTransitioning
                ? "transition-transform duration-500 ease-out"
                : ""
            }
            style={{
              display: "flex",
              gap: `${CARD_GAP}px`,
              transform: `translateX(${getTranslateX(currentIndex)}px)`,
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {extended.map((t, i) => (
              <div
                key={`${t.id}-${i}`}
                className="shrink-0"
                style={{ width: `${cardWidth}px` }}
              >
                <div className="flex h-full flex-col justify-between rounded-2xl border border-dark/5 bg-background p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] transition-transform duration-200 ease-out hover:scale-[1.02] sm:p-6 md:p-8">
                  {/* Stars */}
                  <div>
                    <div className="mb-4 flex gap-1">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star
                          key={si}
                          className={`h-4 w-4 ${si < t.rating ? "fill-primary text-primary" : "fill-dark/10 text-dark/10"}`}
                          strokeWidth={0}
                        />
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="font-poppins text-[0.82rem] sm:text-[0.88rem] leading-relaxed text-dark/70">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                  </div>

                  {/* Author */}
                  <div className="mt-6 flex items-center gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
                      <Image
                        src={t.avatar}
                        alt={t.name}
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    </div>
                    <div>
                      <p className="font-poppins text-[0.82rem] font-semibold text-dark">
                        {t.name}
                      </p>
                      <p className="font-poppins text-[0.7rem] text-dark/45">
                        {t.location}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
