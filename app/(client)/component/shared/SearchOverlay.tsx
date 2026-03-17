"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  promoPrice: number | null;
  image: string;
  categoryMere: string;
  categoryMereSlug: string;
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* ── Auto-focus input when open ── */
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(timer);
    } else {
      setQuery("");
      setResults([]);
      setSearched(false);
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

  /* ── Debounced search ── */
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(
          `/api/products?search=${encodeURIComponent(trimmed)}&limit=6`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        const products = (data.products ?? []).map(
          (p: Record<string, unknown>) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            promoPrice: p.promoPrice ?? null,
            image: p.image || "/images/placeholder.png",
            categoryMere: p.categoryMere || "",
            categoryMereSlug: p.categoryMereSlug || "",
          }),
        );
        setResults(products);
        setSearched(true);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResults([]);
          setSearched(true);
        }
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

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

  const formatPrice = (price: number) =>
    price.toLocaleString("fr-TN", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }) + " DT";

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
          {loading && (
            <Loader2 className="absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-dark/30 animate-spin" />
          )}
        </div>

        {/* Results */}
        {searched && (
          <div className="mt-3 overflow-hidden rounded-2xl border border-dark/5 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
            {results.length > 0 ? (
              <ul className="divide-y divide-dark/5">
                {results.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/${product.categoryMereSlug}/${product.slug}`}
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
                          {product.categoryMere}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        {product.promoPrice ? (
                          <>
                            <p className="font-poppins text-[0.85rem] font-medium text-primary">
                              {formatPrice(product.promoPrice)}
                            </p>
                            <p className="font-poppins text-[0.68rem] text-dark/35 line-through">
                              {formatPrice(product.price)}
                            </p>
                          </>
                        ) : (
                          <p className="font-poppins text-[0.85rem] font-medium text-dark">
                            {formatPrice(product.price)}
                          </p>
                        )}
                      </div>
                    </Link>
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
