/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Heart } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  discount?: number;
  image: string;
  href: string;
}

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "T-shirt Oversize",
    price: "89,00 TND",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
    href: "/homme/t-shirt",
  },
  {
    id: 2,
    name: "Chemise Lin",
    price: "119,00 TND",
    originalPrice: "149,00 TND",
    discount: 20,
    image:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80",
    href: "/homme/chemise",
  },
  {
    id: 3,
    name: "Robe Élégante",
    price: "159,00 TND",
    originalPrice: "199,00 TND",
    discount: 20,
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80",
    href: "/femme/robe-courte",
  },
  {
    id: 4,
    name: "Pull Cachemire",
    price: "259,00 TND",
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80",
    href: "/femme/pull-sweater",
  },
  {
    id: 5,
    name: "Pantalon Cargo",
    price: "97,00 TND",
    originalPrice: "129,00 TND",
    discount: 25,
    image:
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80",
    href: "/homme/pantalon",
  },
  {
    id: 6,
    name: "Blouse Satin",
    price: "179,00 TND",
    image:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800&q=80",
    href: "/femme/blouse",
  },
  {
    id: 7,
    name: "Hoodie Premium",
    price: "135,00 TND",
    originalPrice: "169,00 TND",
    discount: 20,
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80",
    href: "/homme/sweat-a-capuche-hoodie",
  },
  {
    id: 8,
    name: "Jupe Plissée",
    price: "139,00 TND",
    image:
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&q=80",
    href: "/femme/jupe",
  },
];

const CARD_GAP = 20;

export default function ProductSlider() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const totalOriginal = PRODUCTS.length;
  const extendedProducts = [...PRODUCTS, ...PRODUCTS, ...PRODUCTS];
  const offset = totalOriginal;

  /* ── Measure card width & visible count ── */
  const measure = useCallback(() => {
    if (!trackRef.current) return;
    const container = trackRef.current.parentElement;
    if (!container) return;
    const containerWidth = container.clientWidth;

    let cols = 4;
    if (containerWidth < 640) cols = 1;
    else if (containerWidth < 768) cols = 2;
    else if (containerWidth < 1024) cols = 3;
    else cols = 4;

    setVisibleCount(cols);
    const w = (containerWidth - CARD_GAP * (cols - 1)) / cols;
    setCardWidth(w);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  /* ── Compute translate ── */
  const getTranslateX = useCallback(
    (idx: number) => -(offset + idx) * (cardWidth + CARD_GAP),
    [cardWidth, offset],
  );

  /* ── After transition ends, silently reset position for infinite loop ── */
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

  if (cardWidth === 0) {
    return (
      <section className="bg-background py-16 px-6 lg:px-10">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-10 text-center">
            <p className="font-poppins text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-primary">
              Sélection
            </p>
            <h2 className="mt-2 font-erotique text-3xl text-dark sm:text-4xl">
              Nos Incontournables
            </h2>
          </div>
          <div className="h-[420px]" ref={trackRef} />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background py-16 px-6 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        {/* Header */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="font-poppins text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-primary">
              Sélection
            </p>
            <h2 className="mt-2 font-erotique text-3xl text-dark sm:text-4xl">
              Nos Incontournables
            </h2>
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-background transition-transform duration-200 ease-out hover:scale-105 active:scale-95"
              aria-label="Produits précédents"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-background transition-transform duration-200 ease-out hover:scale-105 active:scale-95"
              aria-label="Produits suivants"
            >
              <ArrowRight className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Slider */}
        <div
          className="overflow-hidden"
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
            {extendedProducts.map((product, i) => (
              <div
                key={`${product.id}-${i}`}
                className="shrink-0"
                style={{ width: `${cardWidth}px` }}
              >
                <div className="group overflow-hidden rounded-xl border border-dark/5 bg-background transition-shadow duration-300 hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)]">
                  {/* Image */}
                  <div className="relative aspect-[3/4] overflow-hidden bg-dark/[0.03]">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      sizes={`(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw`}
                    />

                    {/* Discount badge */}
                    {product.discount && (
                      <div className="absolute top-3 left-3 rounded-full bg-primary px-2.5 py-1 font-poppins text-[0.65rem] font-bold text-background">
                        -{product.discount}%
                      </div>
                    )}

                    {/* Heart button */}
                    <button
                      type="button"
                      className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-dark backdrop-blur-sm transition-all duration-200 hover:bg-primary hover:text-background hover:scale-110"
                      aria-label="Ajouter aux favoris"
                    >
                      <Heart className="h-4 w-4" strokeWidth={2} />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="px-4 py-4 space-y-3">
                    <div>
                      <h3 className="font-erotique text-[1rem] text-dark leading-tight">
                        {product.name}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-2">
                        <p className="font-poppins text-[0.82rem] font-semibold text-dark">
                          {product.price}
                        </p>
                        {product.originalPrice && (
                          <p className="font-poppins text-[0.72rem] text-dark/40 line-through">
                            {product.originalPrice}
                          </p>
                        )}
                      </div>
                    </div>
                    <Link
                      href={product.href}
                      className="inline-block rounded-full border border-dark/15 px-5 py-2 font-poppins text-[0.72rem] font-medium uppercase tracking-[0.1em] text-dark transition-all duration-200 hover:border-primary hover:bg-primary hover:text-background"
                    >
                      Voir
                    </Link>
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
