/* eslint-disable react-hooks/preserve-manual-memoization */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  X,
  ShoppingBag,
  Eye,
  Minus,
  Plus,
  Heart,
  Truck,
  RotateCcw,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useCart } from "@/lib/cart";

interface ProductImage {
  url: string;
  color: string;
  colorHex: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  promoPrice: number | null;
  image: string;
  images: ProductImage[];
  sizes: string[];
  colors: string[];
  categoryMereSlug: string;
  categoryFinaleSlug: string;
  href: string;
}

/* Format a numeric price → "89.000 DT" */
function formatPrice(n: number): string {
  return (
    n.toLocaleString("fr-TN", {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }) + " DT"
  );
}

/* ═══════════════════════════════════════════════
   Quick-view modal — full product details
   ═══════════════════════════════════════════════ */
function QuickViewModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");
  const backdropRef = useRef<HTMLDivElement>(null);

  /* Image gallery */
  const [selectedImage, setSelectedImage] = useState(0);
  const images =
    product.images.length > 0
      ? product.images.map((img) => img.url)
      : [product.image];

  /* Selectors */
  const [selectedColor, setSelectedColor] = useState(product.colors[0] ?? "");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCart();

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

  /* Escape key */
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
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);

    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.image,
      price: product.price,
      promoPrice: product.promoPrice,
      color: selectedColor,
      size: selectedSize,
      categorySlug: product.categoryMereSlug,
      quantity: quantity,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2200);
  }, [selectedSize, selectedColor, quantity, product, addItem]);

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
            <div className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden group">
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
              {product.promoPrice && (
                <div
                  className={`absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-primary text-background font-poppins text-[0.55rem] sm:text-[0.6rem] font-semibold uppercase tracking-[0.12em] transition-all duration-500 ${
                    isVisible
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 -translate-x-4"
                  }`}
                  style={stagger(500)}
                >
                  Promo
                </div>
              )}

              {/* Prev / Next arrows — always visible on mobile, hover on desktop */}
              <button
                type="button"
                onClick={() =>
                  setSelectedImage((p) => (p === 0 ? images.length - 1 : p - 1))
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
                  setSelectedImage((p) => (p === images.length - 1 ? 0 : p + 1))
                }
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-background/80 sm:bg-background/70 backdrop-blur-sm text-dark/60 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background hover:text-dark active:scale-90"
              >
                <ChevronRight
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                  strokeWidth={2}
                />
              </button>

              {/* Counter pill */}
              <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-dark/50 backdrop-blur-sm px-2 py-0.5 sm:px-2.5 sm:py-1 font-poppins text-[0.52rem] sm:text-[0.58rem] text-background/90">
                {selectedImage + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnails — horizontally scrollable on mobile */}
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
              <span className="font-poppins text-[0.56rem] font-medium uppercase tracking-[0.22em] text-dark/35">
                {[product.categoryMereSlug, product.categoryFinaleSlug]
                  .filter(Boolean)
                  .join(" — ") || "Collection"}
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
                {formatPrice(product.promoPrice ?? product.price)}
              </span>
              {product.promoPrice && (
                <span className="font-poppins text-sm text-dark/30 line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            {/* Description — hidden on very small to save space, shown from sm up */}
            <p
              className={`font-poppins text-[0.68rem] sm:text-[0.72rem] lg:text-[0.76rem] leading-[1.6] sm:leading-[1.7] lg:leading-[1.8] text-dark/45 mb-3 sm:mb-4 lg:mb-6 line-clamp-2 sm:line-clamp-3 lg:line-clamp-4 transition-all duration-500 ease-out ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={stagger(380)}
            >
              Pièce incontournable de notre collection, ce vêtement allie
              confort et élégance. Son tissu doux et résistant est conçu pour
              accompagner chaque moment de votre quotidien avec style.
            </p>

            <div className="h-px bg-dark/[0.06] mb-4 sm:mb-5" />

            {/* ── Color Selector ── */}
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
              {product.colors.length > 0 ? (
                <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-2.5 flex-wrap">
                  {product.colors.map((color) => {
                    const matchImg = product.images.find(
                      (img) => img.color === color,
                    );
                    const hex = matchImg?.colorHex ?? "#cccccc";
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 rounded-full border-2 transition-all duration-200 ${
                          selectedColor === color
                            ? "border-primary ring-2 ring-primary/20 scale-110"
                            : "border-dark/12 hover:border-dark/25"
                        }`}
                        style={{ backgroundColor: hex }}
                        aria-label={color}
                        title={color}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="font-poppins text-[0.64rem] text-dark/40">
                  Couleur unique
                </p>
              )}
            </div>

            {/* ── Size Selector ── */}
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
                href={product.href}
                className="group flex items-center justify-center gap-1.5 sm:gap-2 lg:gap-2.5 w-full border border-dark/12 py-2 sm:py-2.5 lg:py-3 rounded-lg font-poppins text-[0.58rem] sm:text-[0.64rem] lg:text-[0.68rem] font-medium uppercase tracking-[0.08em] sm:tracking-[0.1em] text-dark/50 transition-all duration-300 hover:border-dark/30 hover:text-dark active:scale-[0.97]"
              >
                <Eye
                  className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-300 group-hover:scale-110"
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

/* ═══════════════════════════════════════════════
   Product grid — responsive luxury layout
   ═══════════════════════════════════════════════ */
const INITIAL_COUNT = 8;

export default function ProductSlider() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  /* ── Fetch femme products ── */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/products?mere=femme&limit=12&sort=newest")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: Product[] = (data.products ?? []).map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          promoPrice: p.promoPrice ?? null,
          image: p.image ?? "",
          images: p.images ?? [],
          sizes: p.sizes ?? [],
          colors: p.colors ?? [],
          categoryMereSlug: p.categoryMereSlug ?? "",
          categoryFinaleSlug: p.categoryFinaleSlug ?? "",
          href: `/${p.categoryMereSlug ?? "femme"}/${p.slug}`,
        }));
        setProducts(items);
      })
      .catch(() => {
        /* silently fail — grid stays empty */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const displayed = showAll ? products : products.slice(0, INITIAL_COUNT);

  /* ── Scroll-reveal ── */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-background py-14 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-10"
    >
      <div className="mx-auto max-w-[1440px]">
        {/* ── Header ── */}
        <div
          className={`mb-10 sm:mb-14 lg:mb-16 text-center transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <p className="font-poppins text-[0.65rem] sm:text-[0.72rem] font-semibold uppercase tracking-[0.25em] text-primary">
            Sélection
          </p>
          <h2 className="mt-2 sm:mt-3 font-erotique text-3xl sm:text-4xl lg:text-5xl text-dark">
            Nos Incontournables
          </h2>
          <div className="mx-auto mt-4 h-px w-16 bg-primary/30" />
        </div>

        {/* ── Product Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:gap-x-6 lg:gap-y-12">
          {loading
            ? Array.from({ length: INITIAL_COUNT }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] rounded-t-full bg-dark/[0.07]" />
                  <div className="pt-4 space-y-2">
                    <div className="mx-auto h-3 w-2/3 rounded bg-dark/[0.06]" />
                    <div className="mx-auto h-2.5 w-1/3 rounded bg-dark/[0.05]" />
                    <div className="h-9 w-full rounded bg-dark/[0.05]" />
                  </div>
                </div>
              ))
            : displayed.map((product, i) => (
                <div
                  key={product.id}
                  className={`transition-all duration-700 ease-out ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-10"
                  }`}
                  style={{ transitionDelay: isVisible ? `${i * 80}ms` : "0ms" }}
                >
                  <div className="group">
                    {/* Arch-shaped Image */}
                    <div className="relative aspect-[3/4] overflow-hidden rounded-t-full bg-dark/[0.03]">
                      {product.image && (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                      )}

                      {/* Hover overlay with quick-view */}
                      <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-dark/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => setSelectedProduct(product)}
                          className="mb-6 sm:mb-8 flex items-center gap-1.5 bg-background/95 backdrop-blur-sm px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-poppins text-[0.65rem] sm:text-[0.7rem] font-medium tracking-[0.06em] text-dark shadow-lg transition-all duration-300 hover:bg-background hover:shadow-xl active:scale-95"
                        >
                          <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
                          Aperçu
                        </button>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="pt-3 sm:pt-4 pb-1 space-y-2 sm:space-y-3">
                      <div className="text-center">
                        <h3 className="font-erotique text-[0.8rem] sm:text-[0.95rem] lg:text-[1rem] text-dark leading-snug tracking-wide">
                          {product.name}
                        </h3>
                        <div className="mt-1 flex items-center justify-center gap-2">
                          <p className="font-poppins text-[0.75rem] sm:text-[0.85rem] font-medium text-dark/80">
                            {formatPrice(product.promoPrice ?? product.price)}
                          </p>
                          {product.promoPrice && (
                            <p className="font-poppins text-[0.65rem] sm:text-[0.72rem] text-dark/35 line-through">
                              {formatPrice(product.price)}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(product)}
                        className="w-full border border-dark/15 py-2 sm:py-2.5 font-poppins text-[0.68rem] sm:text-[0.75rem] tracking-[0.06em] text-dark/70 transition-all duration-300 hover:border-primary hover:bg-primary hover:text-background active:scale-[0.97]"
                      >
                        Ajouter au panier
                      </button>
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {/* ── Voir plus button ── */}
        {!showAll && products.length > INITIAL_COUNT && (
          <div
            className={`mt-10 sm:mt-14 lg:mt-16 text-center transition-all duration-700 ease-out ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`}
            style={{ transitionDelay: isVisible ? "700ms" : "0ms" }}
          >
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="group inline-flex items-center gap-2 border border-primary/40 px-8 py-3 sm:px-10 sm:py-3.5 rounded-full font-poppins text-[0.72rem] sm:text-[0.78rem] font-medium uppercase tracking-[0.12em] text-primary transition-all duration-300 hover:bg-primary hover:text-background hover:border-primary hover:shadow-lg active:scale-[0.97]"
            >
              Voir plus
              <ArrowRight
                className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-300 group-hover:translate-x-1"
                strokeWidth={2}
              />
            </button>
          </div>
        )}

        {/* ── Browse all link ── */}
        <div
          className={`mt-8 sm:mt-10 text-center transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: isVisible ? "800ms" : "0ms" }}
        >
          <Link
            href="/femme"
            className="inline-flex items-center gap-1.5 font-poppins text-[0.68rem] sm:text-[0.74rem] font-medium tracking-[0.06em] text-dark/50 transition-colors duration-300 hover:text-primary"
          >
            Parcourir toute la collection
            <ArrowRight
              className="h-3 w-3 sm:h-3.5 sm:w-3.5"
              strokeWidth={1.8}
            />
          </Link>
        </div>
      </div>

      {/* Quick-view modal */}
      {selectedProduct && (
        <QuickViewModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </section>
  );
}
