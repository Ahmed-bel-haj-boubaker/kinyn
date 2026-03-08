"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Truck,
  X,
} from "lucide-react";

import { COLORS, SIZES, SORT_OPTIONS, slugify } from "@/lib/categories";
import { useCart } from "@/lib/cart";

/* ──────────────────────────── Types ──────────────────────────── */

/** Product shape returned by the public /api/products endpoint */
export interface ClientProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  promoPrice: number | null;
  stock: number;
  image: string;
  images: string[];
  sizes: string[];
  colors: string[];
  categoryMere: string;
  categoryMereSlug: string;
  categorySous: string;
  categorySousSlug: string;
  categoryFinale: string;
  categoryFinaleSlug: string;
  createdAt: string;
}

/** Subcategory shape from the category API */
export interface ClientSubCategory {
  id: string;
  name: string;
  slug: string;
  items: { id: string; name: string; slug: string }[];
}

interface Breadcrumb {
  label: string;
  href?: string;
}

interface ProductsListingProps {
  /** Parent category slug — used for building product detail links. */
  categorySlug: string;
  /** Page title shown in the hero. */
  title: string;
  /** Subtitle below the title. */
  subtitle: string;
  /** Breadcrumb trail (last entry is plain text). */
  breadcrumbs: Breadcrumb[];
  /**
   * Subcategories shown in the sidebar filter.
   * Omit or pass [] to hide the subcategory filter (e.g. on subcategory pages).
   */
  subcategories?: ClientSubCategory[];
  /** Products to display (already scoped to the right category / subcategory). */
  products: ClientProduct[];
}

const ITEMS_PER_PAGE = 12;

/* ──────────────────────── Color hex lookup ──────────────────────── */

const COLOR_HEX_MAP: Record<string, string> = {
  Noir: "#1a1a1a",
  Blanc: "#f5f5f5",
  Beige: "#d4b896",
  Bleu: "#3b5998",
  Rouge: "#b31b21",
  Vert: "#4a7c59",
  Rose: "#d4a0a0",
  Gris: "#8e8e8e",
  Marron: "#6b4226",
  Orange: "#e67e22",
  Jaune: "#f1c40f",
  Violet: "#8e44ad",
};

function colorHex(name: string): string {
  return COLOR_HEX_MAP[name] ?? "#cccccc";
}

/* ═══════════════════════════════════════════════════════════════════
   Quick-view modal — mirrors the ProductSlider QuickViewModal
   but works with real ClientProduct data from the database
   ═══════════════════════════════════════════════════════════════════ */
function QuickViewModal({
  product,
  categorySlug,
  onClose,
}: {
  product: ClientProduct;
  categorySlug: string;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");
  const backdropRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();

  /* Image gallery */
  const [selectedImage, setSelectedImage] = useState(0);
  const images =
    product.images.length > 0
      ? product.images
      : [product.image || "/images/placeholder.png"];

  /* Selectors */
  const [selectedColor, setSelectedColor] = useState(
    product.colors.length > 0 ? product.colors[0] : "",
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  /* Computed */
  const effectivePrice = product.promoPrice ?? product.price;
  const hasDiscount =
    product.promoPrice !== null && product.promoPrice !== undefined;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.promoPrice!) / product.price) * 100)
    : 0;

  /* Touch swipe */
  const touchStartX = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0)
          setSelectedImage((p) => (p === images.length - 1 ? 0 : p + 1));
        else setSelectedImage((p) => (p === 0 ? images.length - 1 : p - 1));
      }
    },
    [images.length],
  );

  /* Enter animation */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => setPhase("visible"));
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = "";
    };
  }, []);

  /* Close with exit animation */
  const handleClose = useCallback(() => {
    setPhase("exit");
    setTimeout(onClose, 400);
  }, [onClose]);

  /* Escape + arrow keys */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft")
        setSelectedImage((p) => (p === 0 ? images.length - 1 : p - 1));
      if (e.key === "ArrowRight")
        setSelectedImage((p) => (p === images.length - 1 ? 0 : p + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose, images.length]);

  /* Backdrop click */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) handleClose();
  };

  /* Add to cart */
  const handleAddToCart = useCallback(() => {
    if (product.sizes.length > 0 && !selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image:
        product.image ||
        (product.images.length > 0
          ? product.images[0]
          : "/images/placeholder.png"),
      price: product.price,
      promoPrice: product.promoPrice,
      color: selectedColor,
      size: selectedSize || "",
      quantity,
      categorySlug,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2200);
  }, [selectedSize, product, selectedColor, quantity, categorySlug, addItem]);

  const isVisible = phase === "visible";
  const isExiting = phase === "exit";

  /* Stagger helper */
  const stagger = (ms: number) => ({
    transitionDelay: isVisible ? `${ms}ms` : "0ms",
  });

  return createPortal(
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-3 md:p-5 lg:p-6 transition-all duration-500 ${
        isVisible
          ? "bg-dark/50 backdrop-blur-sm"
          : isExiting
            ? "bg-dark/0 backdrop-blur-0"
            : "bg-dark/0"
      }`}
    >
      <div
        className={`relative w-full sm:max-w-[540px] md:max-w-[760px] lg:max-w-[940px] xl:max-w-[1060px] h-[92dvh] sm:h-auto sm:max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-t-2xl sm:rounded-2xl bg-background shadow-2xl transition-all duration-500 ease-out ${
          isVisible
            ? "opacity-100 scale-100 translate-y-0"
            : isExiting
              ? "opacity-0 sm:scale-95 translate-y-6"
              : "opacity-0 sm:scale-95 translate-y-10"
        }`}
      >
        {/* ── Close button ── */}
        <button
          onClick={handleClose}
          className={`absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-dark/5 text-dark/60 transition-all duration-300 hover:bg-dark/10 hover:text-dark sm:hover:rotate-90 ${
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"
          }`}
          style={stagger(300)}
        >
          <X className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.5} />
        </button>

        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-dark/10" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* ════════════ LEFT: Image Gallery ════════════ */}
          <div
            className={`relative bg-dark/[0.02] transition-all duration-600 ease-out ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
            style={stagger(100)}
          >
            {/* Main image */}
            <div
              className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden group"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Image
                key={selectedImage}
                src={images[selectedImage]}
                alt={product.name}
                fill
                className={`object-cover transition-all duration-700 ease-out ${
                  isVisible ? "opacity-100 scale-100" : "opacity-0 scale-105"
                }`}
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, 510px"
                priority
              />

              {/* Discount badge */}
              {hasDiscount && (
                <div
                  className={`absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-primary text-background font-poppins text-[0.55rem] sm:text-[0.6rem] font-semibold transition-all duration-500 ${
                    isVisible
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 -translate-x-4"
                  }`}
                  style={stagger(500)}
                >
                  -{discountPercent}%
                </div>
              )}

              {/* Prev / Next arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImage((p) =>
                        p === 0 ? images.length - 1 : p - 1,
                      )
                    }
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-background/80 sm:bg-background/70 backdrop-blur-sm text-dark/60 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background hover:text-dark active:scale-90"
                  >
                    <ChevronLeft
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                      strokeWidth={2}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedImage((p) =>
                        p === images.length - 1 ? 0 : p + 1,
                      )
                    }
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-background/80 sm:bg-background/70 backdrop-blur-sm text-dark/60 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background hover:text-dark active:scale-90"
                  >
                    <ChevronRight
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                      strokeWidth={2}
                    />
                  </button>
                </>
              )}

              {/* Counter pill */}
              {images.length > 1 && (
                <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-dark/50 backdrop-blur-sm px-2 py-0.5 sm:px-2.5 sm:py-1 font-poppins text-[0.52rem] sm:text-[0.58rem] text-background/90">
                  {selectedImage + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-1.5 sm:gap-2 p-2.5 sm:p-3 overflow-x-auto scrollbar-hide">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(idx)}
                    className={`relative shrink-0 h-14 w-12 sm:h-16 sm:w-14 md:h-[72px] md:w-16 overflow-hidden rounded-md sm:rounded-lg transition-all duration-200 ${
                      selectedImage === idx
                        ? "ring-2 ring-primary ring-offset-1 sm:ring-offset-2 ring-offset-background"
                        : "opacity-50 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`Vue ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ════════════ RIGHT: Product Details ════════════ */}
          <div className="flex flex-col px-4 py-4 sm:px-5 sm:py-5 md:px-7 md:py-7 lg:px-8 lg:py-8 xl:px-9 xl:py-9 overflow-y-auto md:max-h-[90vh]">
            {/* Category breadcrumb */}
            <div
              className={`flex items-center gap-2 mb-3 sm:mb-4 lg:mb-5 transition-all duration-500 ease-out ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-3"
              }`}
              style={stagger(200)}
            >
              <div className="h-[3px] w-[3px] rounded-full bg-primary" />
              <span className="font-poppins text-[0.52rem] sm:text-[0.56rem] font-medium uppercase tracking-[0.22em] text-dark/35">
                {product.categoryMere}
                {product.categorySous ? ` — ${product.categorySous}` : ""}
              </span>
            </div>

            {/* Product name */}
            <h3
              className={`font-erotique text-lg sm:text-xl md:text-2xl lg:text-[1.75rem] xl:text-3xl text-dark leading-[1.08] mb-1.5 sm:mb-2 lg:mb-3 transition-all duration-600 ease-out ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
              style={stagger(260)}
            >
              {product.name}
            </h3>

            {/* Accent line */}
            <div
              className={`h-[1.5px] rounded-full bg-primary/50 mb-3 sm:mb-4 lg:mb-5 transition-all duration-700 ease-out origin-left ${
                isVisible ? "w-8 sm:w-10" : "w-0"
              }`}
              style={stagger(320)}
            />

            {/* Price */}
            <div
              className={`flex items-baseline flex-wrap gap-1.5 sm:gap-2 lg:gap-3 mb-3 sm:mb-4 lg:mb-5 transition-all duration-500 ease-out ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={stagger(340)}
            >
              <span className="font-poppins text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-dark">
                {effectivePrice.toFixed(2)} TND
              </span>
              {hasDiscount && (
                <span className="font-poppins text-sm text-dark/30 line-through">
                  {product.price.toFixed(2)} TND
                </span>
              )}
              {hasDiscount && (
                <span className="rounded-md bg-primary/10 px-2 py-0.5 font-poppins text-[0.6rem] sm:text-[0.65rem] font-semibold text-primary">
                  -{discountPercent}%
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p
                className={`font-poppins text-[0.68rem] sm:text-[0.72rem] lg:text-[0.76rem] leading-[1.6] sm:leading-[1.7] lg:leading-[1.8] text-dark/45 mb-3 sm:mb-4 lg:mb-6 line-clamp-2 sm:line-clamp-3 lg:line-clamp-4 transition-all duration-500 ease-out ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
                style={stagger(380)}
              >
                {product.description}
              </p>
            )}

            <div className="h-px bg-dark/[0.06] mb-4 sm:mb-5" />

            {/* ── Color Selector ── */}
            {product.colors.length > 0 && (
              <div
                className={`mb-3 sm:mb-4 lg:mb-5 transition-all duration-500 ease-out ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
                style={stagger(420)}
              >
                <p className="font-poppins text-[0.65rem] sm:text-[0.7rem] lg:text-[0.74rem] font-medium text-dark mb-1.5 sm:mb-2">
                  Couleur :{" "}
                  <span className="font-normal text-dark/50">
                    {selectedColor}
                  </span>
                </p>
                <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 flex-wrap">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 rounded-full border-2 transition-all duration-200 ${
                        selectedColor === color
                          ? "border-primary ring-2 ring-primary/20 scale-110"
                          : "border-dark/12 hover:border-dark/25"
                      }`}
                      style={{ backgroundColor: colorHex(color) }}
                      aria-label={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Size Selector ── */}
            {product.sizes.length > 0 && (
              <div
                className={`mb-3 sm:mb-4 lg:mb-5 transition-all duration-500 ease-out ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4"
                }`}
                style={stagger(460)}
              >
                <p className="font-poppins text-[0.65rem] sm:text-[0.7rem] lg:text-[0.74rem] font-medium text-dark mb-1.5 sm:mb-2">
                  Taille{" "}
                  {selectedSize && (
                    <span className="font-normal text-dark/50">
                      : {selectedSize}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setSelectedSize(size);
                        setSizeError(false);
                      }}
                      className={`min-w-[2.2rem] sm:min-w-[2.6rem] lg:min-w-[2.8rem] rounded-lg border px-2 sm:px-3 lg:px-3.5 py-1 sm:py-1.5 lg:py-2 font-poppins text-[0.62rem] sm:text-[0.68rem] lg:text-[0.72rem] font-medium transition-all duration-200 active:scale-95 ${
                        selectedSize === size
                          ? "border-primary bg-primary text-background"
                          : "border-dark/12 text-dark/60 hover:border-dark/25"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {sizeError && (
                  <p className="mt-1.5 sm:mt-2 font-poppins text-[0.64rem] sm:text-[0.68rem] text-primary">
                    Veuillez sélectionner une taille
                  </p>
                )}
              </div>
            )}

            <div className="h-px bg-dark/[0.06] mb-4 sm:mb-5" />

            {/* ── Quantity + Add to Cart + Wishlist ── */}
            <div
              className={`flex flex-col gap-2 sm:gap-2.5 lg:gap-3 mb-3 sm:mb-4 lg:mb-5 transition-all duration-500 ease-out ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
              style={stagger(500)}
            >
              {/* Row: Quantity + Cart + Wishlist */}
              <div className="flex gap-1.5 sm:gap-2 lg:gap-2.5">
                {/* Quantity */}
                <div className="flex items-center border border-dark/12 rounded-lg shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-9 w-8 sm:h-10 sm:w-9 lg:h-11 lg:w-10 items-center justify-center text-dark/40 transition-colors duration-200 hover:text-dark active:text-dark"
                    aria-label="Diminuer la quantité"
                  >
                    <Minus
                      className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                      strokeWidth={2}
                    />
                  </button>
                  <span className="flex h-9 w-6 sm:h-10 sm:w-7 lg:h-11 lg:w-8 items-center justify-center font-poppins text-[0.68rem] sm:text-[0.74rem] lg:text-[0.78rem] font-medium text-dark tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    className="flex h-9 w-8 sm:h-10 sm:w-9 lg:h-11 lg:w-10 items-center justify-center text-dark/40 transition-colors duration-200 hover:text-dark active:text-dark"
                    aria-label="Augmenter la quantité"
                  >
                    <Plus
                      className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                      strokeWidth={2}
                    />
                  </button>
                </div>

                {/* Add to cart */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 lg:gap-2.5 rounded-lg py-2 sm:py-2.5 lg:py-3 font-poppins text-[0.6rem] sm:text-[0.68rem] lg:text-[0.74rem] font-semibold uppercase tracking-[0.04em] sm:tracking-[0.06em] lg:tracking-[0.08em] transition-all duration-300 ${
                    addedToCart
                      ? "bg-green-600 text-background"
                      : "bg-primary text-background hover:bg-dark active:scale-[0.97]"
                  }`}
                >
                  <ShoppingBag
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                    strokeWidth={1.6}
                  />
                  <span className="hidden sm:inline">
                    {addedToCart ? "Ajouté !" : "Ajouter au panier"}
                  </span>
                  <span className="sm:hidden">
                    {addedToCart ? "Ajouté !" : "Ajouter"}
                  </span>
                </button>

                {/* Wishlist */}
                <button
                  type="button"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`flex h-9 w-9 sm:h-10 sm:w-10 lg:h-11 lg:w-11 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 active:scale-90 ${
                    isWishlisted
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-dark/12 text-dark/35 hover:border-primary hover:text-primary"
                  }`}
                  aria-label={
                    isWishlisted ? "Retirer des favoris" : "Ajouter aux favoris"
                  }
                >
                  <Heart
                    className={`h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-4.5 lg:w-4.5 transition-all duration-200 ${
                      isWishlisted ? "fill-primary" : ""
                    }`}
                    strokeWidth={1.8}
                  />
                </button>
              </div>

              {/* View full product page */}
              <Link
                href={`/${categorySlug}/${product.slug}`}
                onClick={handleClose}
                className="group/link flex items-center justify-center gap-1.5 sm:gap-2 lg:gap-2.5 w-full border border-dark/12 py-2 sm:py-2.5 lg:py-3 rounded-lg font-poppins text-[0.58rem] sm:text-[0.64rem] lg:text-[0.68rem] font-medium uppercase tracking-[0.08em] sm:tracking-[0.1em] text-dark/50 transition-all duration-300 hover:border-dark/30 hover:text-dark active:scale-[0.97]"
              >
                <Eye
                  className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-300 group-hover/link:scale-110"
                  strokeWidth={1.5}
                />
                Voir tous les détails
              </Link>
            </div>

            {/* ── Trust badges ── */}
            <div
              className={`grid grid-cols-3 gap-1 sm:gap-1.5 lg:gap-2 pt-2.5 sm:pt-3 lg:pt-4 border-t border-dark/6 transition-all duration-500 ease-out ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}
              style={stagger(580)}
            >
              <div className="flex flex-col items-center text-center gap-0.5 sm:gap-1 lg:gap-1.5 py-1 sm:py-1.5 lg:py-2">
                <Truck
                  className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-dark/30"
                  strokeWidth={1.5}
                />
                <span className="font-poppins text-[0.42rem] sm:text-[0.48rem] lg:text-[0.52rem] leading-snug text-dark/40">
                  Livraison gratuite
                  <br />
                  dès 200 TND
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-0.5 sm:gap-1 lg:gap-1.5 py-1 sm:py-1.5 lg:py-2">
                <RotateCcw
                  className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-dark/30"
                  strokeWidth={1.5}
                />
                <span className="font-poppins text-[0.42rem] sm:text-[0.48rem] lg:text-[0.52rem] leading-snug text-dark/40">
                  Retours gratuits
                  <br />
                  sous 14 jours
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-0.5 sm:gap-1 lg:gap-1.5 py-1 sm:py-1.5 lg:py-2">
                <ShieldCheck
                  className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-dark/30"
                  strokeWidth={1.5}
                />
                <span className="font-poppins text-[0.42rem] sm:text-[0.48rem] lg:text-[0.52rem] leading-snug text-dark/40">
                  Paiement
                  <br />
                  100% sécurisé
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ──────────────────────────── Component ──────────────────────────── */

export default function ProductsListing({
  categorySlug,
  title,
  subtitle,
  breadcrumbs,
  subcategories = [],
  products: initialProducts,
}: ProductsListingProps) {
  /* ── State ── */
  const [products] = useState<ClientProduct[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    [],
  );
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300]);
  const [expandedFilters, setExpandedFilters] = useState<string[]>([
    "category",
    "price",
    "size",
    "color",
  ]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [sortOpen, setSortOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] =
    useState<ClientProduct | null>(null);

  const sortRef = useRef<HTMLDivElement>(null);
  const showSubcategoryFilter = subcategories.length > 0;

  /* ── Close sort dropdown on outside click ── */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ── Lock scroll when mobile filters open ── */
  useEffect(() => {
    document.body.style.overflow = mobileFiltersOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileFiltersOpen]);

  /* ── Filter toggles ── */
  const toggleFilter = useCallback((section: string) => {
    setExpandedFilters((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  }, []);

  const toggleSubcategory = useCallback((sub: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub],
    );
  }, []);

  const toggleSize = useCallback((size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  }, []);

  const toggleColor = useCallback((color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    );
  }, []);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedSubcategories([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setPriceRange([0, 300]);
    setVisibleCount(ITEMS_PER_PAGE);
  }, []);

  const hasActiveFilters =
    selectedSubcategories.length > 0 ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 300 ||
    searchQuery.length > 0;

  /* ── Filtered & sorted products ── */
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    if (selectedSubcategories.length > 0) {
      result = result.filter((p) =>
        selectedSubcategories.includes(p.categorySous),
      );
    }

    if (selectedSizes.length > 0) {
      result = result.filter((p) =>
        p.sizes.some((s) => selectedSizes.includes(s)),
      );
    }

    if (selectedColors.length > 0) {
      result = result.filter((p) =>
        p.colors.some((c) => selectedColors.includes(c)),
      );
    }

    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1],
    );

    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        result.sort((a, b) => b.stock - a.stock);
        break;
      case "newest":
      default:
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }

    return result;
  }, [
    products,
    searchQuery,
    selectedSubcategories,
    selectedSizes,
    selectedColors,
    priceRange,
    sortBy,
  ]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  /* ──────────────────── Filter Sidebar Content ──────────────────── */
  const filterContent = (
    <div className="space-y-6">
      {/* Subcategory filter (only shown on parent-category pages) */}
      {showSubcategoryFilter && (
        <div>
          <button
            type="button"
            onClick={() => toggleFilter("category")}
            className="flex w-full items-center justify-between py-2 font-poppins text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-dark"
          >
            <span>Catégorie</span>
            <ChevronDown
              className={`h-4 w-4 text-dark/40 transition-transform duration-300 ${expandedFilters.includes("category") ? "rotate-180" : ""}`}
              strokeWidth={2}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${expandedFilters.includes("category") ? "max-h-[600px] opacity-100 mt-2" : "max-h-0 opacity-0"}`}
          >
            <div className="space-y-1">
              {subcategories.map((sub) => (
                <button
                  key={sub.name}
                  type="button"
                  onClick={() => toggleSubcategory(sub.name)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left font-poppins text-[0.78rem] transition-all duration-200 ${
                    selectedSubcategories.includes(sub.name)
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-dark/70 hover:bg-dark/[0.03] hover:text-dark"
                  }`}
                >
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all duration-200 ${
                      selectedSubcategories.includes(sub.name)
                        ? "border-primary bg-primary"
                        : "border-dark/25"
                    }`}
                  >
                    {selectedSubcategories.includes(sub.name) && (
                      <svg
                        className="h-2.5 w-2.5 text-background"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span>{sub.name}</span>
                  <span className="ml-auto font-poppins text-[0.65rem] text-dark/35">
                    {sub.items.length}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 h-px bg-dark/8" />
        </div>
      )}

      {/* Price filter */}
      <div>
        <button
          type="button"
          onClick={() => toggleFilter("price")}
          className="flex w-full items-center justify-between py-2 font-poppins text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-dark"
        >
          <span>Prix</span>
          <ChevronDown
            className={`h-4 w-4 text-dark/40 transition-transform duration-300 ${expandedFilters.includes("price") ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${expandedFilters.includes("price") ? "max-h-40 opacity-100 mt-3" : "max-h-0 opacity-0"}`}
        >
          <div className="px-1">
            <input
              type="range"
              min={0}
              max={300}
              value={priceRange[1]}
              onChange={(e) =>
                setPriceRange([priceRange[0], Number(e.target.value)])
              }
              className="w-full accent-primary cursor-pointer"
              aria-label="Prix maximum"
            />
            <div className="mt-2 flex items-center justify-between font-poppins text-[0.72rem] text-dark/60">
              <span>{priceRange[0]} TND</span>
              <span>{priceRange[1]} TND</span>
            </div>
          </div>
        </div>
        <div className="mt-3 h-px bg-dark/8" />
      </div>

      {/* Size filter */}
      <div>
        <button
          type="button"
          onClick={() => toggleFilter("size")}
          className="flex w-full items-center justify-between py-2 font-poppins text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-dark"
        >
          <span>Taille</span>
          <ChevronDown
            className={`h-4 w-4 text-dark/40 transition-transform duration-300 ${expandedFilters.includes("size") ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${expandedFilters.includes("size") ? "max-h-40 opacity-100 mt-2" : "max-h-0 opacity-0"}`}
        >
          <div className="flex flex-wrap gap-2">
            {SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={`rounded-lg border px-3.5 py-1.5 font-poppins text-[0.72rem] font-medium transition-all duration-200 ${
                  selectedSizes.includes(size)
                    ? "border-primary bg-primary text-background"
                    : "border-dark/15 text-dark/70 hover:border-dark/30"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 h-px bg-dark/8" />
      </div>

      {/* Color filter */}
      <div>
        <button
          type="button"
          onClick={() => toggleFilter("color")}
          className="flex w-full items-center justify-between py-2 font-poppins text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-dark"
        >
          <span>Couleur</span>
          <ChevronDown
            className={`h-4 w-4 text-dark/40 transition-transform duration-300 ${expandedFilters.includes("color") ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </button>
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${expandedFilters.includes("color") ? "max-h-60 opacity-100 mt-2" : "max-h-0 opacity-0"}`}
        >
          <div className="space-y-1">
            {COLORS.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => toggleColor(color.name)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left font-poppins text-[0.78rem] transition-all duration-200 ${
                  selectedColors.includes(color.name)
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-dark/70 hover:bg-dark/[0.03] hover:text-dark"
                }`}
              >
                <span
                  className={`h-4 w-4 shrink-0 rounded-full border-2 transition-all duration-200 ${
                    selectedColors.includes(color.name)
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-dark/15"
                  }`}
                  style={{ backgroundColor: color.hex }}
                />
                <span>{color.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={resetFilters}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dark/15 py-2.5 font-poppins text-[0.75rem] font-medium text-dark/70 transition-all duration-200 hover:border-primary hover:text-primary"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );

  /* ──────────────────── Render ──────────────────── */
  return (
    <div className="bg-background min-h-screen">
      {/* Hero header */}
      <div className="border-b border-dark/8">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-10 lg:py-14">
          <nav className="mb-4 font-poppins text-[0.7rem] text-dark/45 flex items-center flex-wrap gap-y-1">
            {breadcrumbs.map((bc, i) => (
              <span key={i} className="flex items-center">
                {i > 0 && <span className="mx-2">/</span>}
                {bc.href ? (
                  <Link
                    href={bc.href}
                    className="transition-colors duration-200 hover:text-primary"
                  >
                    {bc.label}
                  </Link>
                ) : (
                  <span className="text-dark/70">{bc.label}</span>
                )}
              </span>
            ))}
          </nav>
          <h1 className="font-erotique text-3xl sm:text-4xl lg:text-5xl text-dark">
            {title}
          </h1>
          <p className="mt-3 max-w-lg font-poppins text-[0.85rem] leading-relaxed text-dark/55">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-8 lg:py-10">
        {/* Top controls */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile filter button */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="flex lg:hidden items-center gap-2 rounded-lg border border-dark/15 px-4 py-2.5 font-poppins text-[0.78rem] font-medium text-dark transition-all duration-200 hover:border-primary hover:text-primary"
            >
              <SlidersHorizontal className="h-4 w-4" strokeWidth={2} />
              Filtres
              {hasActiveFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[0.6rem] font-semibold text-background">
                  {selectedSubcategories.length +
                    selectedSizes.length +
                    selectedColors.length}
                </span>
              )}
            </button>

            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dark/35"
                strokeWidth={2}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(ITEMS_PER_PAGE);
                }}
                placeholder="Rechercher..."
                className="w-full sm:w-64 rounded-lg border border-dark/15 bg-background py-2.5 pl-10 pr-4 font-poppins text-[0.78rem] text-dark placeholder:text-dark/35 outline-none transition-all duration-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/35 hover:text-dark"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Count */}
            <span className="font-poppins text-[0.75rem] text-dark/45">
              {filteredProducts.length} produit
              {filteredProducts.length !== 1 ? "s" : ""}
            </span>

            {/* Sort */}
            <div ref={sortRef} className="relative">
              <button
                type="button"
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-2 rounded-lg border border-dark/15 px-4 py-2.5 font-poppins text-[0.78rem] font-medium text-dark transition-all duration-200 hover:border-dark/30"
              >
                <Filter className="h-3.5 w-3.5 text-dark/45" strokeWidth={2} />
                <span>
                  {SORT_OPTIONS.find((s) => s.value === sortBy)?.label}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-dark/45 transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`}
                  strokeWidth={2}
                />
              </button>
              {sortOpen && (
                <div className="absolute right-0 top-full z-30 mt-1 w-48 rounded-lg border border-dark/10 bg-background py-1 shadow-lg">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.value);
                        setSortOpen(false);
                      }}
                      className={`flex w-full px-4 py-2.5 text-left font-poppins text-[0.78rem] transition-colors duration-150 ${
                        sortBy === opt.value
                          ? "text-primary font-medium bg-primary/5"
                          : "text-dark/70 hover:bg-dark/[0.03]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active filters pills */}
        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {selectedSubcategories.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => toggleSubcategory(sub)}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 font-poppins text-[0.7rem] font-medium text-primary transition-all duration-200 hover:bg-primary/20"
              >
                {sub}
                <X className="h-3 w-3" strokeWidth={2.5} />
              </button>
            ))}
            {selectedSizes.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 font-poppins text-[0.7rem] font-medium text-primary transition-all duration-200 hover:bg-primary/20"
              >
                {size}
                <X className="h-3 w-3" strokeWidth={2.5} />
              </button>
            ))}
            {selectedColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => toggleColor(color)}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 font-poppins text-[0.7rem] font-medium text-primary transition-all duration-200 hover:bg-primary/20"
              >
                {color}
                <X className="h-3 w-3" strokeWidth={2.5} />
              </button>
            ))}
            <button
              type="button"
              onClick={resetFilters}
              className="font-poppins text-[0.7rem] text-dark/45 underline-offset-2 hover:text-primary hover:underline transition-colors duration-200"
            >
              Tout effacer
            </button>
          </div>
        )}

        {/* Main layout */}
        <div className="flex gap-8 lg:gap-10">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-32">{filterContent}</div>
          </aside>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {filteredProducts.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-20">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-dark/[0.04] mb-6">
                  <Search className="h-8 w-8 text-dark/25" strokeWidth={1.5} />
                </div>
                <h3 className="font-erotique text-xl text-dark mb-2">
                  Aucun produit trouvé
                </h3>
                <p className="font-poppins text-[0.82rem] text-dark/50 text-center max-w-sm mb-6">
                  Essayez de modifier vos filtres ou votre recherche pour
                  trouver ce que vous cherchez.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-full bg-primary px-6 py-2.5 font-poppins text-[0.78rem] font-semibold text-background transition-all duration-200 hover:bg-primary/90 hover:scale-105"
                >
                  Réinitialiser
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2.5 xs:gap-3 sm:gap-4 md:gap-5 md:grid-cols-3 xl:grid-cols-4">
                  {visibleProducts.map((product, idx) => {
                    const hasPromo =
                      product.promoPrice !== null &&
                      product.promoPrice !== undefined;
                    const displayPrice = hasPromo
                      ? product.promoPrice!
                      : product.price;
                    const discount = hasPromo
                      ? Math.round(
                          ((product.price - product.promoPrice!) /
                            product.price) *
                            100,
                        )
                      : 0;

                    return (
                      <div
                        key={product.id}
                        className="group relative flex flex-col overflow-hidden rounded-xl sm:rounded-2xl bg-background border border-dark/6 transition-all duration-500 hover:shadow-[0_8px_40px_rgba(0,0,0,0.10)] hover:border-dark/12"
                        style={{
                          animationDelay: `${(idx % ITEMS_PER_PAGE) * 40}ms`,
                        }}
                      >
                        {/* ── Image container ── */}
                        <div className="relative aspect-3/4 overflow-hidden bg-dark/2">
                          <Image
                            src={product.image || "/images/placeholder.png"}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            sizes="(max-width: 480px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          />

                          {/* Gradient overlay on hover */}
                          <div className="absolute inset-0 bg-linear-to-t from-dark/50 via-dark/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                          {/* Promo badge */}
                          {hasPromo && (
                            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10">
                              <span className="inline-flex items-center rounded-full bg-primary px-1.5 py-px sm:px-2.5 sm:py-0.5 font-poppins text-[0.5rem] sm:text-[0.62rem] font-bold text-background shadow-lg shadow-primary/25">
                                -{discount}%
                              </span>
                            </div>
                          )}

                          {/* Wishlist heart */}
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm text-dark/40 shadow-sm lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 hover:bg-background hover:text-primary hover:scale-110 active:scale-95"
                            aria-label="Ajouter aux favoris"
                          >
                            <Heart
                              className="h-3 w-3 sm:h-4 sm:w-4"
                              strokeWidth={2}
                            />
                          </button>

                          {/* Mobile/tablet: view details icon */}
                          <Link
                            href={`/${categorySlug}/${product.slug}`}
                            className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 z-10 flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm text-dark/50 shadow-sm transition-all duration-200 active:scale-90 lg:hidden"
                            aria-label="Voir détails"
                          >
                            <Eye
                              className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                              strokeWidth={2}
                            />
                          </Link>

                          {/* Out of stock overlay */}
                          {product.stock <= 0 && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
                              <span className="rounded-full bg-dark/80 px-3 py-1 sm:px-4 sm:py-1.5 font-poppins text-[0.58rem] sm:text-[0.68rem] font-semibold text-background">
                                Rupture de stock
                              </span>
                            </div>
                          )}

                          {/* Desktop hover action buttons */}
                          <div className="hidden lg:flex absolute bottom-0 left-0 right-0 z-10 flex-col items-center gap-2 px-4 pb-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setQuickViewProduct(product);
                              }}
                              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-poppins text-[0.72rem] font-semibold text-background shadow-lg shadow-primary/20 transition-all duration-200 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.97]"
                            >
                              <ShoppingBag
                                className="h-3.5 w-3.5"
                                strokeWidth={2.2}
                              />
                              Ajouter au panier
                            </button>
                            <Link
                              href={`/${categorySlug}/${product.slug}`}
                              className="flex w-full items-center justify-center gap-2 rounded-lg bg-background/90 backdrop-blur-sm py-2.5 font-poppins text-[0.72rem] font-semibold text-dark border border-dark/10 transition-all duration-200 hover:bg-background hover:border-dark/20 active:scale-[0.97]"
                            >
                              <Eye className="h-3.5 w-3.5" strokeWidth={2.2} />
                              Voir détails
                            </Link>
                          </div>
                        </div>

                        {/* ── Product info ── */}
                        <Link
                          href={`/${categorySlug}/${product.slug}`}
                          className="flex flex-1 flex-col p-2.5 sm:p-4"
                        >
                          {/* Category tag */}
                          {product.categorySous && (
                            <span className="mb-0.5 sm:mb-1 font-poppins text-[0.48rem] sm:text-[0.6rem] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.15em] text-primary/70 truncate">
                              {product.categorySous}
                            </span>
                          )}

                          {/* Name */}
                          <h3 className="font-poppins text-[0.68rem] sm:text-[0.82rem] font-medium text-dark leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-300">
                            {product.name}
                          </h3>

                          {/* Price */}
                          <div className="mt-auto pt-1.5 sm:pt-3 flex items-baseline gap-1.5 sm:gap-2">
                            <span className="font-poppins text-[0.72rem] sm:text-[0.92rem] font-bold text-dark">
                              {displayPrice.toFixed(2)}
                              <span className="text-[0.55rem] sm:text-[0.7rem] font-semibold ml-0.5">
                                TND
                              </span>
                            </span>
                            {hasPromo && (
                              <span className="font-poppins text-[0.52rem] sm:text-[0.68rem] text-dark/35 line-through">
                                {product.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </Link>

                        {/* Mobile/tablet: add to cart button */}
                        <div className="px-2.5 pb-2.5 sm:px-4 sm:pb-4 lg:hidden">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setQuickViewProduct(product);
                            }}
                            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2 sm:py-2.5 font-poppins text-[0.6rem] sm:text-[0.72rem] font-semibold text-background shadow-sm transition-all duration-200 active:scale-[0.97]"
                          >
                            <ShoppingBag
                              className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                              strokeWidth={2.2}
                            />
                            Ajouter au panier
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="mt-12 flex justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCount((prev) => prev + ITEMS_PER_PAGE)
                      }
                      className="rounded-full border-2 border-primary px-8 py-3 font-poppins text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-primary transition-all duration-200 hover:bg-primary hover:text-background hover:scale-105 active:scale-[0.98]"
                    >
                      Voir plus de produits
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter panel ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-dark/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileFiltersOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileFiltersOpen(false)}
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-background shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          mobileFiltersOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-dark/10 px-6 py-5">
            <h2 className="font-poppins text-[0.9rem] font-semibold uppercase tracking-[0.1em] text-dark">
              Filtres
            </h2>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-dark/60 transition-colors duration-200 hover:text-dark"
            >
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {filterContent}
          </div>

          {/* Footer */}
          <div className="border-t border-dark/10 px-6 py-5">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full rounded-full bg-primary py-3 font-poppins text-[0.82rem] font-semibold text-background transition-all duration-200 hover:bg-primary/90"
            >
              Voir {filteredProducts.length} produit
              {filteredProducts.length !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      </div>

      {/* Quick-view modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          categorySlug={categorySlug}
          onClose={() => setQuickViewProduct(null)}
        />
      )}
    </div>
  );
}
