"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Trash2, X, Loader2 } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  promoPrice: number | null;
  images: { url: string; color: string }[];
  categoryMereName: string;
  categorySlug: string;
}

const emptySubscribe = () => () => {};

async function fetchProductsByIds(ids: string[]): Promise<WishlistProduct[]> {
  const results: WishlistProduct[] = [];
  for (const id of ids) {
    try {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) continue;
      const data = await res.json();
      const p = data.product;
      if (p) {
        results.push({
          id: p.id ?? p._id ?? id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          promoPrice: p.promoPrice ?? null,
          images: p.images ?? [],
          categoryMereName: p.categoryMere ?? p.categoryMereName ?? "",
          categorySlug:
            p.categoryMereSlug ??
            p.categorySlug ??
            slugify(p.categoryMere ?? p.categoryMereName ?? ""),
        });
      }
    } catch {
      /* skip */
    }
  }
  return results;
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function WishlistDrawer({
  isOpen,
  onClose,
}: WishlistDrawerProps) {
  const { items: wishlistIds, count, remove } = useWishlist();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const safeCount = mounted ? count : 0;

  /* ── Fetch product details when drawer opens ── */
  useEffect(() => {
    if (!isOpen) return;
    if (wishlistIds.length === 0) {
      setProducts([]);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/me/wishlist");
        if (res.ok) {
          const data = await res.json();
          const serverProducts: WishlistProduct[] = (data.products ?? []).map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (p: any) => ({
              id: p.id ?? p._id,
              name: p.name,
              slug: p.slug,
              price: p.price,
              promoPrice: p.promoPrice ?? null,
              images: p.images ?? [],
              categoryMereName: p.categoryMere ?? p.categoryMereName ?? "",
              categorySlug:
                p.categoryMereSlug ??
                p.categorySlug ??
                slugify(p.categoryMere ?? p.categoryMereName ?? ""),
            }),
          );
          if (cancelled) return;
          const inContext = serverProducts.filter((p) =>
            wishlistIds.includes(p.id),
          );
          const serverIds = new Set(serverProducts.map((p) => p.id));
          const localOnly = wishlistIds.filter((id) => !serverIds.has(id));
          const extra = await fetchProductsByIds(localOnly);
          const resolved = [...inContext, ...extra];
          if (!cancelled) {
            setProducts(resolved);
            // Remove stale IDs that resolved to no product
            const resolvedIds = new Set(resolved.map((p) => p.id));
            wishlistIds.forEach((id) => {
              if (!resolvedIds.has(id)) remove(id);
            });
          }
        } else {
          const fetched = await fetchProductsByIds(wishlistIds);
          if (!cancelled) {
            setProducts(fetched);
            const resolvedIds = new Set(fetched.map((p) => p.id));
            wishlistIds.forEach((id) => {
              if (!resolvedIds.has(id)) remove(id);
            });
          }
        }
      } catch {
        const fetched = await fetchProductsByIds(wishlistIds);
        if (!cancelled) {
          setProducts(fetched);
          const resolvedIds = new Set(fetched.map((p) => p.id));
          wishlistIds.forEach((id) => {
            if (!resolvedIds.has(id)) remove(id);
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, wishlistIds, remove]);

  /* ── ESC to close + focus trap ── */
  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    requestAnimationFrame(() => {
      const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    });

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = useCallback(() => onClose(), [onClose]);

  const removeItem = (productId: string) => {
    setRemovingId(productId);
    remove(productId);
    setProducts((prev) => prev.filter((item) => item.id !== productId));
    setRemovingId(null);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed font-poppins inset-0 z-60 bg-dark/40 backdrop-blur-[2px] transition-opacity duration-300 ease-out ${
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Liste de souhaits"
        className={`fixed font-poppins top-0 right-0 z-70 flex h-dvh w-full flex-col bg-background shadow-[-8px_0_30px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out md:w-100 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between border-b border-dark/10 px-6 py-5">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-[1.3rem] font-bold uppercase tracking-[0.08em] text-dark">
              Souhaits
            </h2>
            <span className="text-[0.75rem] font-medium text-dark/40">
              {safeCount} {safeCount > 1 ? "articles" : "article"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-dark/60 transition-colors duration-200 hover:bg-dark/5 hover:text-dark"
            aria-label="Fermer la liste de souhaits"
          >
            <X className="h-4.5 w-4.5" strokeWidth={2} />
          </button>
        </div>

        {/* ─── Items ─── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-dark/40">
              <Loader2 className="h-8 w-8 animate-spin" strokeWidth={1.5} />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-dark/40">
              <Heart className="h-12 w-12" strokeWidth={1.2} />
              <p className="font-poppins text-[0.85rem]">
                Votre liste de souhaits est vide
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 font-poppins text-[0.78rem] font-medium text-primary underline underline-offset-2 transition-colors hover:text-primary/80"
              >
                Continuer mes achats
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {products.map((item) => {
                const price = item.promoPrice ?? item.price;

                return (
                  <div
                    key={item.id}
                    className="group flex gap-4 rounded-lg border border-dark/4 bg-dark/1.5 p-3 transition-colors duration-200 hover:border-dark/10"
                  >
                    {/* Thumbnail */}
                    <Link
                      href={`/${item.categorySlug}/${item.slug}`}
                      onClick={onClose}
                      className="relative h-22 w-18 shrink-0 overflow-hidden rounded-md bg-dark/5"
                    >
                      <Image
                        src={item.images[0]?.url || "/images/placeholder.jpg"}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="72px"
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <Link
                          href={`/${item.categorySlug}/${item.slug}`}
                          onClick={onClose}
                          className="font-poppins text-[0.82rem] font-semibold leading-tight text-dark hover:text-primary transition-colors"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-0.5 font-poppins text-[0.7rem] text-dark/50">
                          {item.categoryMereName}
                        </p>
                      </div>

                      <div className="flex items-end justify-between">
                        {/* Price */}
                        <div className="flex items-center gap-2">
                          <span className="font-poppins text-[0.82rem] font-semibold text-dark">
                            {price.toFixed(2).replace(".", ",")} TND
                          </span>
                          {item.promoPrice && (
                            <span className="font-poppins text-[0.7rem] text-dark/40 line-through">
                              {item.price.toFixed(2).replace(".", ",")} TND
                            </span>
                          )}
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={removingId === item.id}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-dark/30 transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                          aria-label={`Supprimer ${item.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        {products.length > 0 && !loading && (
          <div className="shrink-0 border-t border-dark/10 bg-background px-4 sm:px-6 py-4 sm:py-5 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3 sm:space-y-4">
            <button
              type="button"
              onClick={onClose}
              className="flex w-full items-center justify-center rounded-full border border-dark/15 py-3 font-poppins text-[0.78rem] font-medium tracking-wide text-dark/70 transition-all duration-200 hover:border-dark/30 hover:text-dark"
            >
              Continuer mes achats
            </button>
          </div>
        )}
      </div>
    </>
  );
}
