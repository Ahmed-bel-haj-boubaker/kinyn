"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

interface SearchProduct {
  id: number;
  name: string;
  category: string;
  price: string;
  image: string;
}

const MOCK_PRODUCTS: SearchProduct[] = [
  {
    id: 1,
    name: "Robe Élégante en Lin",
    category: "Femme — Robes",
    price: "159.000 DT",
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200&q=80",
  },
  {
    id: 2,
    name: "Chemise Oversize Coton",
    category: "Femme — Hauts",
    price: "119.000 DT",
    image:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200&q=80",
  },
  {
    id: 3,
    name: "Pull Cachemire Ivoire",
    category: "Femme — Hauts",
    price: "259.000 DT",
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200&q=80",
  },
  {
    id: 4,
    name: "Pantalon Cargo Sable",
    category: "Femme — Bas",
    price: "97.000 DT",
    image:
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=200&q=80",
  },
  {
    id: 5,
    name: "Blouse Satin Noir",
    category: "Femme — Hauts",
    price: "179.000 DT",
    image:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=200&q=80",
  },
  {
    id: 6,
    name: "Jupe Plissée Beige",
    category: "Femme — Bas",
    price: "139.000 DT",
    image:
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=200&q=80",
  },
];

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Auto-focus input when open ── */
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  /* ── Lock body scroll ── */
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* ── ESC key ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  /* ── Click outside ── */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    },
    [onClose],
  );

  /* ── Filter results ── */
  const trimmed = query.trim().toLowerCase();
  const results =
    trimmed.length > 0
      ? MOCK_PRODUCTS.filter(
          (p) =>
            p.name.toLowerCase().includes(trimmed) ||
            p.category.toLowerCase().includes(trimmed),
        ).slice(0, 6)
      : [];

  const showResults = trimmed.length > 0;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-9999 flex items-start justify-center pt-[15vh] px-4 bg-dark/40 backdrop-blur-sm animate-[fadeIn_280ms_ease-in-out_forwards]"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Recherche"
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition-colors duration-200 hover:text-white"
        aria-label="Fermer la recherche"
      >
        <X className="h-5 w-5" strokeWidth={1.5} />
      </button>

      {/* Search container */}
      <div
        ref={containerRef}
        className="w-full max-w-165 animate-[scaleIn_280ms_ease-in-out_forwards]"
      >
        {/* Input */}
        <div className="relative">
          <Search
            className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-dark/30"
            strokeWidth={1.5}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit…"
            className="w-full rounded-2xl border border-dark/8 bg-white py-4 pl-13 pr-5 font-poppins text-[0.95rem] text-dark shadow-[0_12px_40px_rgba(0,0,0,0.12)] outline-none transition-colors duration-200 placeholder:text-dark/35 focus:border-primary/40"
            aria-label="Rechercher"
          />
        </div>

        {/* Results */}
        {showResults && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-dark/5 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
            {results.length > 0 ? (
              <ul className="divide-y divide-dark/5">
                {results.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors duration-200 hover:bg-background/70"
                      onClick={onClose}
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-dark/3">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-poppins text-[0.85rem] text-dark">
                          {product.name}
                        </p>
                        <p className="mt-0.5 font-poppins text-[0.72rem] text-dark/40">
                          {product.category}
                        </p>
                      </div>
                      <p className="shrink-0 font-poppins text-[0.85rem] font-medium text-dark">
                        {product.price}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-10 text-center">
                <p className="font-poppins text-[0.85rem] text-dark/40">
                  Aucun résultat trouvé
                </p>
                <p className="mt-1 font-poppins text-[0.72rem] text-dark/25">
                  Essayez un autre terme de recherche
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
