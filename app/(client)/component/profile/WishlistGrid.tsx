"use client";

import { X, Loader2, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  promoPrice: number | null;
  images: string[];
  categoryMereName: string;
}

export default function WishlistGrid() {
  const [items, setItems] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWishlist() {
      try {
        const res = await fetch("/api/auth/me/wishlist");
        if (res.ok) {
          const data = await res.json();
          setItems(data.products ?? []);
        }
      } catch {
        /* silently fail */
      } finally {
        setLoading(false);
      }
    }
    fetchWishlist();
  }, []);

  const removeItem = async (productId: string) => {
    setRemovingId(productId);
    try {
      const res = await fetch(`/api/auth/me/wishlist/${productId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== productId));
      }
    } catch {
      /* silently fail */
    } finally {
      setRemovingId(null);
    }
  };

  const slugify = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const formatPrice = (price: number) =>
    price.toFixed(2).replace(".", ",") + " TND";

  return (
    <section>
      <h3 className="font-erotique text-base sm:text-lg text-dark mb-4 sm:mb-6">
        Liste de Souhaits
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2
            className="h-6 w-6 animate-spin text-dark/30"
            strokeWidth={1.5}
          />
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-lg sm:rounded-xl bg-white border border-[#EEECE7] shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-shadow duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
            >
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                disabled={removingId === item.id}
                className="absolute right-2 top-2 sm:right-3 sm:top-3 z-10 flex h-6 w-6 sm:h-7 sm:w-7 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[#999] opacity-100 sm:opacity-0 shadow-sm transition-all duration-200 hover:bg-primary hover:text-white group-hover:opacity-100 active:scale-90 disabled:opacity-50"
                aria-label={`Retirer ${item.name} de la liste`}
              >
                <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2} />
              </button>

              {/* Image + Info — both clickable */}
              <Link
                href={`/${slugify(item.categoryMereName)}/${item.slug}`}
                className="block"
              >
                <div className="relative aspect-4/5 w-full overflow-hidden bg-[#F5F4F1]">
                  <Image
                    src={item.images[0] || "/images/placeholder.jpg"}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  />
                </div>
              </Link>

              {/* Info */}
              <Link
                href={`/${slugify(item.categoryMereName)}/${item.slug}`}
                className="block p-3 sm:p-4"
              >
                <p className="font-poppins text-[9.5px] sm:text-[10.5px] uppercase tracking-wide text-[#999] mb-0.5 sm:mb-1">
                  {item.categoryMereName}
                </p>
                <h4 className="font-poppins text-[12px] sm:text-[13px] font-medium text-dark leading-snug mb-1.5 sm:mb-2 truncate">
                  {item.name}
                </h4>
                <div className="flex items-center gap-2">
                  {item.promoPrice ? (
                    <>
                      <p className="font-poppins text-[12.5px] sm:text-[13.5px] font-semibold text-primary">
                        {formatPrice(item.promoPrice)}
                      </p>
                      <p className="font-poppins text-[11px] sm:text-[12px] text-[#999] line-through">
                        {formatPrice(item.price)}
                      </p>
                    </>
                  ) : (
                    <p className="font-poppins text-[12.5px] sm:text-[13.5px] font-semibold text-dark">
                      {formatPrice(item.price)}
                    </p>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
          <Heart className="h-10 w-10 text-dark/20 mb-3" strokeWidth={1.2} />
          <p className="font-poppins text-[13px] sm:text-[14px] text-[#999]">
            Votre liste de souhaits est vide.
          </p>
        </div>
      )}
    </section>
  );
}
