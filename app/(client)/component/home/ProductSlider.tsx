/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
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
} from "lucide-react";
import { createPortal } from "react-dom";

interface Product {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  image: string;
  href: string;
}

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "T-shirt Oversize",
    price: "89.000 DT",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
    href: "/homme/t-shirt",
  },
  {
    id: 2,
    name: "Chemise Lin",
    price: "119.000 DT",
    originalPrice: "149.000 DT",
    image:
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80",
    href: "/homme/chemise",
  },
  {
    id: 3,
    name: "Robe Élégante",
    price: "159.000 DT",
    originalPrice: "199.000 DT",
    image:
      "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80",
    href: "/femme/robe-courte",
  },
  {
    id: 4,
    name: "Pull Cachemire",
    price: "259.000 DT",
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80",
    href: "/femme/pull-sweater",
  },
  {
    id: 5,
    name: "Pantalon Cargo",
    price: "97.000 DT",
    originalPrice: "129.000 DT",
    image:
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80",
    href: "/homme/pantalon",
  },
  {
    id: 6,
    name: "Blouse Satin",
    price: "179.000 DT",
    image:
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800&q=80",
    href: "/femme/blouse",
  },
  {
    id: 7,
    name: "Hoodie Premium",
    price: "135.000 DT",
    originalPrice: "169.000 DT",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80",
    href: "/homme/sweat-a-capuche-hoodie",
  },
  {
    id: 8,
    name: "Jupe Plissée",
    price: "139.000 DT",
    image:
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800&q=80",
    href: "/femme/jupe",
  },
];

const CARD_GAP = 20;

/* ── Modal product data ── */
const MODAL_IMAGES = [
  "https://images.unsplash.com/photo-1434389677669-e08b4cda3a98?w=900&q=85",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&q=85",
  "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=900&q=85",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900&q=85",
];

const MODAL_COLORS = [
  { name: "Noir", hex: "#1a1a1a" },
  { name: "Blanc", hex: "#f5f5f5" },
  { name: "Beige", hex: "#d4b896" },
  { name: "Rouge", hex: "#b31b21" },
];

const MODAL_SIZES = ["XS", "S", "M", "L", "XL"];

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
  const images = [product.image, ...MODAL_IMAGES.slice(1)];

  /* Selectors */
  const [selectedColor, setSelectedColor] = useState(MODAL_COLORS[0].name);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

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
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2200);
  }, [selectedSize]);

  const isVisible = phase === "visible";
  const isExiting = phase === "exit";
  const hasDiscount = !!product.originalPrice;

  /* Stagger helper */
  const stagger = (ms: number) => ({
    transitionDelay: isVisible ? `${ms}ms` : "0ms",
  });

  return createPortal(
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 transition-all duration-500 ${
        isVisible
          ? "bg-dark/50 backdrop-blur-sm"
          : isExiting
            ? "bg-dark/0 backdrop-blur-0"
            : "bg-dark/0"
      }`}
    >
      <div
        className={`relative w-full sm:max-w-[1020px] h-[95dvh] sm:h-auto sm:max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-t-2xl sm:rounded-2xl bg-background shadow-2xl transition-all duration-500 ease-out ${
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
            <div className="relative aspect-square sm:aspect-[3/4] overflow-hidden group">
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
          <div className="flex flex-col px-4 py-5 sm:px-6 sm:py-7 md:px-8 md:py-9 overflow-y-auto">
            {/* Category breadcrumb */}
            <div
              className={`flex items-center gap-2 mb-5 transition-all duration-500 ease-out ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-3"
              }`}
              style={stagger(200)}
            >
              <div className="h-[3px] w-[3px] rounded-full bg-primary" />
              <span className="font-poppins text-[0.56rem] font-medium uppercase tracking-[0.22em] text-dark/35">
                {product.href.split("/").filter(Boolean).join(" — ") ||
                  "Collection"}
              </span>
            </div>

            {/* Product name */}
            <h3
              className={`font-erotique text-xl sm:text-2xl md:text-3xl text-dark leading-[1.08] mb-2 sm:mb-3 transition-all duration-600 ease-out ${
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
              className={`h-[1.5px] rounded-full bg-primary/50 mb-5 transition-all duration-700 ease-out origin-left ${
                isVisible ? "w-10" : "w-0"
              }`}
              style={stagger(320)}
            />

            {/* Price */}
            <div
              className={`flex items-baseline gap-2 sm:gap-3 mb-4 sm:mb-5 transition-all duration-500 ease-out ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={stagger(340)}
            >
              <span className="font-poppins text-lg sm:text-xl md:text-2xl font-semibold text-dark">
                {product.price}
              </span>
              {product.originalPrice && (
                <span className="font-poppins text-sm text-dark/30 line-through">
                  {product.originalPrice}
                </span>
              )}
            </div>

            {/* Description — hidden on very small to save space, shown from sm up */}
            <p
              className={`hidden sm:block font-poppins text-[0.72rem] sm:text-[0.74rem] leading-[1.7] sm:leading-[1.8] text-dark/45 mb-4 sm:mb-6 transition-all duration-500 ease-out ${
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
              className={`mb-4 sm:mb-5 transition-all duration-500 ease-out ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={stagger(420)}
            >
              <p className="font-poppins text-[0.68rem] sm:text-[0.72rem] font-medium text-dark mb-2">
                Couleur :{" "}
                <span className="font-normal text-dark/50">
                  {selectedColor}
                </span>
              </p>
              <div className="flex items-center gap-2 sm:gap-2.5">
                {MODAL_COLORS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColor(color.name)}
                    className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 transition-all duration-200 ${
                      selectedColor === color.name
                        ? "border-primary ring-2 ring-primary/20 scale-110"
                        : "border-dark/12 hover:border-dark/25"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    aria-label={color.name}
                  />
                ))}
              </div>
            </div>

            {/* ── Size Selector ── */}
            <div
              className={`mb-4 sm:mb-5 transition-all duration-500 ease-out ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={stagger(460)}
            >
              <p className="font-poppins text-[0.68rem] sm:text-[0.72rem] font-medium text-dark mb-2">
                Taille{" "}
                {selectedSize && (
                  <span className="font-normal text-dark/50">
                    : {selectedSize}
                  </span>
                )}
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {MODAL_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setSelectedSize(size);
                      setSizeError(false);
                    }}
                    className={`min-w-[2.4rem] sm:min-w-[2.8rem] rounded-lg border px-2.5 sm:px-3.5 py-1.5 sm:py-2 font-poppins text-[0.66rem] sm:text-[0.7rem] font-medium transition-all duration-200 active:scale-95 ${
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
              className={`flex flex-col gap-2.5 sm:gap-3 mb-4 sm:mb-5 transition-all duration-500 ease-out ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
              style={stagger(500)}
            >
              {/* Row: Quantity + Cart + Wishlist */}
              <div className="flex gap-2 sm:gap-2.5">
                {/* Quantity */}
                <div className="flex items-center border border-dark/12 rounded-lg shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-10 w-9 sm:h-11 sm:w-10 items-center justify-center text-dark/40 transition-colors duration-200 hover:text-dark active:text-dark"
                    aria-label="Diminuer la quantité"
                  >
                    <Minus
                      className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                      strokeWidth={2}
                    />
                  </button>
                  <span className="flex h-10 w-7 sm:h-11 sm:w-8 items-center justify-center font-poppins text-[0.72rem] sm:text-[0.78rem] font-medium text-dark tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    className="flex h-10 w-9 sm:h-11 sm:w-10 items-center justify-center text-dark/40 transition-colors duration-200 hover:text-dark active:text-dark"
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
                  className={`flex-1 flex items-center justify-center gap-2 sm:gap-2.5 rounded-lg py-2.5 sm:py-3 font-poppins text-[0.65rem] sm:text-[0.72rem] font-semibold uppercase tracking-[0.06em] sm:tracking-[0.08em] transition-all duration-300 ${
                    addedToCart
                      ? "bg-green-600 text-background"
                      : "bg-primary text-background hover:bg-dark active:scale-[0.97]"
                  }`}
                >
                  <ShoppingBag
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                    strokeWidth={1.6}
                  />
                  <span className="hidden xs:inline">
                    {addedToCart ? "Ajouté !" : "Ajouter au panier"}
                  </span>
                  <span className="xs:hidden">
                    {addedToCart ? "Ajouté !" : "Ajouter"}
                  </span>
                </button>

                {/* Wishlist */}
                <button
                  type="button"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 active:scale-90 ${
                    isWishlisted
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-dark/12 text-dark/35 hover:border-primary hover:text-primary"
                  }`}
                  aria-label={
                    isWishlisted ? "Retirer des favoris" : "Ajouter aux favoris"
                  }
                >
                  <Heart
                    className={`h-4 w-4 sm:h-[18px] sm:w-[18px] transition-all duration-200 ${
                      isWishlisted ? "fill-primary" : ""
                    }`}
                    strokeWidth={1.8}
                  />
                </button>
              </div>

              {/* View full product page */}
              <Link
                href={product.href}
                className="group flex items-center justify-center gap-2 sm:gap-2.5 w-full border border-dark/12 py-2.5 sm:py-3 rounded-lg font-poppins text-[0.62rem] sm:text-[0.66rem] font-medium uppercase tracking-[0.1em] text-dark/50 transition-all duration-300 hover:border-dark/30 hover:text-dark active:scale-[0.97]"
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
              className={`grid grid-cols-3 gap-1 sm:gap-2 pt-3 sm:pt-4 border-t border-dark/[0.06] transition-all duration-500 ease-out ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}
              style={stagger(580)}
            >
              <div className="flex flex-col items-center text-center gap-1 sm:gap-1.5 py-1.5 sm:py-2">
                <Truck
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-dark/30"
                  strokeWidth={1.5}
                />
                <span className="font-poppins text-[0.46rem] sm:text-[0.52rem] leading-snug text-dark/40">
                  Livraison gratuite
                  <br />
                  dès 200 TND
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-1 sm:gap-1.5 py-1.5 sm:py-2">
                <RotateCcw
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-dark/30"
                  strokeWidth={1.5}
                />
                <span className="font-poppins text-[0.46rem] sm:text-[0.52rem] leading-snug text-dark/40">
                  Retours gratuits
                  <br />
                  sous 14 jours
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-1 sm:gap-1.5 py-1.5 sm:py-2">
                <ShieldCheck
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-dark/30"
                  strokeWidth={1.5}
                />
                <span className="font-poppins text-[0.46rem] sm:text-[0.52rem] leading-snug text-dark/40">
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
   Main slider component
   ═══════════════════════════════════════════════ */
export default function ProductSlider() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(0);
  const [visibleCount, setVisibleCount] = useState(4);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
    <section className="bg-background py-10 sm:py-14 lg:py-16 px-4 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1440px]">
        {/* Header */}
        <div className="mb-6 sm:mb-8 lg:mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="font-poppins text-[0.65rem] sm:text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-primary">
              Sélection
            </p>
            <h2 className="mt-1.5 sm:mt-2 font-erotique text-2xl sm:text-3xl lg:text-4xl text-dark">
              Nos Incontournables
            </h2>
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-primary text-background transition-transform duration-200 ease-out hover:scale-105 active:scale-95"
              aria-label="Produits précédents"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-primary text-background transition-transform duration-200 ease-out hover:scale-105 active:scale-95"
              aria-label="Produits suivants"
            >
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
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
                <div className="group">
                  {/* Arch-shaped Image */}
                  <div className="relative aspect-[3/4] overflow-hidden rounded-t-full bg-dark/[0.03]">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      sizes={`(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw`}
                    />
                  </div>

                  {/* Info */}
                  <div className="pt-3 sm:pt-4 pb-1 space-y-2">
                    <div>
                      <h3 className="font-erotique text-[0.82rem] sm:text-[0.95rem] text-dark leading-snug tracking-wide">
                        {product.name}
                      </h3>
                      <div className="mt-0.5 sm:mt-1 flex items-center gap-2">
                        <p className="font-poppins text-[0.78rem] sm:text-[0.85rem] text-dark/80">
                          {product.price}
                        </p>
                        {product.originalPrice && (
                          <p className="font-poppins text-[0.68rem] sm:text-[0.75rem] text-dark/35 line-through">
                            {product.originalPrice}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(product)}
                      className="w-full border border-dark/20 py-2 sm:py-2.5 font-poppins text-[0.72rem] sm:text-[0.78rem] tracking-[0.05em] text-dark transition-all duration-300 hover:border-dark hover:bg-dark hover:text-background active:scale-[0.97]"
                    >
                      Ajouter au panier
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
