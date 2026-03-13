"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/lib/cart";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const emptySubscribe = () => () => {};

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const cart = useCart();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  /* Use safe defaults during SSR to prevent hydration mismatch */
  const items = mounted ? cart.items : [];
  const totalItems = mounted ? cart.totalItems : 0;
  const subtotal = mounted ? cart.subtotal : 0;
  const { updateQuantity, removeItem } = cart;

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

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed font-poppins   inset-0 z-60 bg-dark/40 backdrop-blur-[2px] transition-opacity duration-300 ease-out ${
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
        aria-label="Panier"
        className={`fixed font-poppins top-0 right-0 z-70 flex h-dvh w-full flex-col bg-background shadow-[-8px_0_30px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out md:w-100 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between border-b border-dark/10 px-6 py-5">
          <div className="flex items-baseline gap-2.5">
            <h2 className="text-[1.3rem] font-bold uppercase tracking-[0.08em] text-dark">
              Panier
            </h2>
            <span className="text-[0.75rem] font-medium text-dark/40">
              {totalItems} {totalItems > 1 ? "articles" : "article"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-dark/60 transition-colors duration-200 hover:bg-dark/5 hover:text-dark"
            aria-label="Fermer le panier"
          >
            <X className="h-4.5 w-4.5" strokeWidth={2} />
          </button>
        </div>

        {/* ─── Items ─── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-dark/40">
              <ShoppingBag className="h-12 w-12" strokeWidth={1.2} />
              <p className="font-poppins text-[0.85rem]">
                Votre panier est vide
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
              {items.map((item) => {
                const unitPrice = item.promoPrice ?? item.price;
                const lineTotal = unitPrice * item.quantity;
                const variant = [item.color, item.size]
                  .filter(Boolean)
                  .join(" — Taille ");

                return (
                  <div
                    key={`${item.productId}__${item.color}__${item.size}`}
                    className="group flex gap-4 rounded-lg border border-dark/4 bg-dark/1.5 p-3 transition-colors duration-200 hover:border-dark/10"
                  >
                    {/* Thumbnail */}
                    <Link
                      href={`/${item.categorySlug}/${item.slug}`}
                      onClick={onClose}
                      className="relative h-22 w-18 shrink-0 overflow-hidden rounded-md bg-dark/5"
                    >
                      <Image
                        src={item.image}
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
                        {variant && (
                          <p className="mt-0.5 font-poppins text-[0.7rem] text-dark/50">
                            {variant}
                          </p>
                        )}
                      </div>

                      <div className="flex items-end justify-between">
                        {/* Qty controls */}
                        <div className="flex items-center gap-0.5 rounded-full border border-dark/10 bg-background">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.color,
                                item.size,
                                item.quantity - 1,
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full text-dark/50 transition-colors hover:text-dark"
                            aria-label="Diminuer la quantité"
                          >
                            <Minus className="h-3 w-3" strokeWidth={2} />
                          </button>
                          <span className="w-5 text-center font-poppins text-[0.72rem] font-semibold text-dark">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.color,
                                item.size,
                                item.quantity + 1,
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full text-dark/50 transition-colors hover:text-dark"
                            aria-label="Augmenter la quantité"
                          >
                            <Plus className="h-3 w-3" strokeWidth={2} />
                          </button>
                        </div>

                        {/* Price + remove */}
                        <div className="flex items-center gap-2.5">
                          <span className="font-poppins text-[0.82rem] font-semibold text-dark">
                            {lineTotal.toFixed(2).replace(".", ",")} TND
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              removeItem(item.productId, item.color, item.size)
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full text-dark/30 transition-colors hover:bg-primary/10 hover:text-primary"
                            aria-label={`Supprimer ${item.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-dark/10 bg-background px-4 sm:px-6 py-4 sm:py-5 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-3 sm:space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between font-poppins text-[0.8rem] text-dark/60">
                <span>Sous-total</span>
                <span>{subtotal.toFixed(2).replace(".", ",")} TND</span>
              </div>
              <div className="flex items-center justify-between font-poppins text-[0.8rem] text-dark/60">
                <span>Livraison</span>
                <span className="text-[0.72rem] italic">
                  Calculée à l&apos;étape suivante
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-dark/10 pt-3.5">
              <span className="font-poppins text-[0.9rem] font-semibold text-dark">
                Total
              </span>
              <span className="font-poppins text-[0.9rem] font-bold text-dark">
                {subtotal.toFixed(2).replace(".", ",")} TND
              </span>
            </div>

            <Link
              href="/checkout"
              onClick={onClose}
              className="flex w-full items-center justify-center rounded-full bg-primary py-3.5 font-poppins text-[0.82rem] font-semibold tracking-wide text-background transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]"
            >
              Commander
            </Link>

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
