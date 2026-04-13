"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Truck,
  RotateCcw,
  ChevronDown,
} from "lucide-react";

import ProductsListing from "../../component/shared/ProductsListing";
import type { ClientProduct } from "../../component/shared/ProductsListing";
import WishlistButton from "../../component/shared/WishlistButton";
import { useCart } from "@/lib/cart";

/* ════════════════════════════════════════════════════════════════
   Route: /[slug]/[subslug]
   Smart page (DB-backed):
   1. Check if subslug matches a "finale" category slug → listing
   2. Otherwise fetch a product by slug → product detail
   3. 404 if nothing found
   ════════════════════════════════════════════════════════════════ */

/* ── API response types ── */

interface ApiCategoryItem {
  id: string;
  name: string;
  slug: string;
}

interface ApiSubCategory {
  id: string;
  name: string;
  slug: string;
  items: ApiCategoryItem[];
}

interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  subcategories: ApiSubCategory[];
}

type PageMode =
  | { type: "loading" }
  | { type: "not-found" }
  | {
      type: "finale-listing";
      category: ApiCategory;
      finaleItem: ApiCategoryItem;
      parentSous: ApiSubCategory;
      products: ClientProduct[];
    }
  | {
      type: "product-detail";
      product: ClientProduct;
      relatedProducts: ClientProduct[];
    };

export default function SubSlugPageClient() {
  const params = useParams();
  const slug = params.slug as string;
  const subslug = params.subslug as string;

  const [mode, setMode] = useState<PageMode>({ type: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      try {
        /* 1️⃣ Fetch the category tree */
        const catRes = await fetch(`/api/categories/${slug}`);

        if (catRes.ok) {
          const catData = await catRes.json();
          const category: ApiCategory = catData.category;

          /* Check if subslug matches a finale category slug */
          for (const sous of category.subcategories) {
            for (const item of sous.items) {
              if (item.slug === subslug) {
                /* Fetch products for this finale category */
                const prodRes = await fetch(
                  `/api/products?mere=${slug}&finale=${subslug}`,
                );
                const prodData = await prodRes.json();

                if (!cancelled) {
                  setMode({
                    type: "finale-listing",
                    category,
                    finaleItem: item,
                    parentSous: sous,
                    products: prodData.products ?? [],
                  });
                }
                return;
              }
            }
          }
        }

        /* 2️⃣ Try to find a product by slug */
        const prodRes = await fetch(`/api/products/${subslug}`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();

          /* Fetch related products from same category */
          const relRes = await fetch(`/api/products?mere=${slug}&limit=4`);
          const relData = await relRes.json();
          const related = (relData.products ?? [])
            .filter((p: ClientProduct) => p.slug !== subslug)
            .slice(0, 4);

          if (!cancelled) {
            setMode({
              type: "product-detail",
              product: prodData.product,
              relatedProducts: related,
            });
          }
          return;
        }

        /* 3️⃣ Nothing found → 404 */
        if (!cancelled) setMode({ type: "not-found" });
      } catch {
        if (!cancelled) setMode({ type: "not-found" });
      }
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [slug, subslug]);

  /* ── Render based on mode ── */
  if (mode.type === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (mode.type === "not-found") {
    notFound();
  }

  if (mode.type === "finale-listing") {
    return (
      <ProductsListing
        categorySlug={slug}
        title={mode.finaleItem.name}
        subtitle=""
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: mode.category.name, href: `/${slug}` },
          { label: mode.parentSous.name },
          { label: mode.finaleItem.name },
        ]}
        products={mode.products}
      />
    );
  }

  /* mode.type === "product-detail" */
  return (
    <ProductDetailPage
      slug={slug}
      product={mode.product}
      relatedProducts={mode.relatedProducts}
    />
  );
}

/* ════════════════════════════════════════════════════════════════
   Product Detail  (DB-backed)
   ════════════════════════════════════════════════════════════════ */

/* ── Color hex lookup ── */

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

/* ── Component ── */

function ProductDetailPage({
  slug,
  product: p,
  relatedProducts,
}: {
  slug: string;
  product: ClientProduct;
  relatedProducts: ClientProduct[];
}) {
  const categoryLabel = p.categoryMere || slug;
  const { addItem } = useCart();

  /* Build image list from DB objects */
  const images = useMemo(
    () =>
      p.images.length > 0
        ? p.images.map((img, i) => ({
            src: typeof img === "string" ? img : img.url,
            color: typeof img === "string" ? "" : img.color || "",
            colorHex: typeof img === "string" ? "" : img.colorHex || "",
            alt: i === 0 ? "Vue principale" : `Vue ${i + 1}`,
          }))
        : [
            {
              src: "/images/placeholder.png",
              color: "",
              colorHex: "",
              alt: "Aucune image",
            },
          ],
    [p.images],
  );

  /* Build dynamic color hex map from images (for custom colors) */
  const dynamicColorHex = useMemo(() => {
    const map: Record<string, string> = {};
    for (const img of images) {
      if (img.color && img.colorHex) map[img.color] = img.colorHex;
    }
    return map;
  }, [images]);

  const resolveHex = (name: string) => dynamicColorHex[name] || colorHex(name);

  /* ── Computed ── */
  const effectivePrice = p.promoPrice ?? p.price;
  const discountPercent = p.promoPrice
    ? Math.round(((p.price - p.promoPrice) / p.price) * 100)
    : null;

  /* ── State ── */
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(
    p.colors.length > 0 ? p.colors[0] : "",
  );

  /* Images filtered by selected color (falls back to all if no match) */
  const filteredImages = useMemo(() => {
    if (!selectedColor) return images;
    const colorImages = images.filter((img) => img.color === selectedColor);
    return colorImages.length > 0 ? colorImages : images;
  }, [images, selectedColor]);

  /* Switch to first image of the selected color */
  const handleColorSelect = useCallback((color: string) => {
    setSelectedColor(color);
    setSelectedImage(0);
  }, []);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "description",
  );
  const [sizeError, setSizeError] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [shareCopied, setShareCopied] = useState(false);

  const mainImageRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  /* ── Handlers ── */
  const toggleSection = useCallback((section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  }, []);

  const handleAddToCart = useCallback(() => {
    if (p.sizes.length > 0 && !selectedSize) {
      setSizeError(true);
      return;
    }
    /* Check per-size stock */
    if (selectedSize && p.sizeStock) {
      const entry = p.sizeStock.find((ss) => ss.size === selectedSize);
      if (entry && entry.stock < quantity) return;
    }
    setSizeError(false);
    addItem({
      productId: p.id,
      name: p.name,
      slug: p.slug,
      image:
        p.image ||
        (p.images.length > 0
          ? typeof p.images[0] === "string"
            ? p.images[0]
            : p.images[0]?.url
          : "/images/placeholder.png"),
      price: p.price,
      promoPrice: p.promoPrice,
      color: selectedColor,
      size: selectedSize || "",
      quantity,
      categorySlug: slug,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }, [selectedSize, selectedColor, quantity, p, slug, addItem]);

  const handlePrevImage = useCallback(() => {
    setSelectedImage((prev) =>
      prev === 0 ? filteredImages.length - 1 : prev - 1,
    );
  }, [filteredImages.length]);

  const handleNextImage = useCallback(() => {
    setSelectedImage((prev) =>
      prev === filteredImages.length - 1 ? 0 : prev + 1,
    );
  }, [filteredImages.length]);

  const handleImageMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!mainImageRef.current) return;
      const rect = mainImageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomPos({ x, y });
    },
    [],
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) handleNextImage();
        else handlePrevImage();
      }
    },
    [handleNextImage, handlePrevImage],
  );

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const shareData = { title: p.name, url };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        /* user cancelled — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, [p.name]);

  /* Keyboard navigation for gallery */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "ArrowRight") handleNextImage();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handlePrevImage, handleNextImage]);

  return (
    <div className="bg-background min-h-screen">
      {/* ── Breadcrumb ── */}
      <div className="border-b border-dark/8">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-4">
          <nav className="font-poppins text-[0.6rem] sm:text-[0.65rem] md:text-[0.7rem] text-dark/45 flex items-center flex-wrap gap-y-1">
            <Link
              href="/"
              className="transition-colors duration-200 hover:text-primary"
            >
              Accueil
            </Link>
            <span className="mx-2">/</span>
            <Link
              href={`/${slug}`}
              className="transition-colors duration-200 hover:text-primary"
            >
              {categoryLabel}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-dark/70 line-clamp-1">{p.name}</span>
          </nav>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6 md:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 md:gap-8 lg:gap-12 xl:gap-16">
          {/* ════════════ LEFT: Image Gallery ════════════ */}
          <div className="space-y-4">
            {/* Main image */}
            <div
              ref={mainImageRef}
              className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden rounded-lg sm:rounded-xl md:rounded-2xl bg-dark/[0.03] lg:cursor-crosshair group touch-pan-y"
              onMouseEnter={() => setImageZoomed(true)}
              onMouseLeave={() => setImageZoomed(false)}
              onMouseMove={handleImageMouseMove}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Image
                src={
                  filteredImages[selectedImage]?.src ??
                  "/images/placeholder.png"
                }
                alt={filteredImages[selectedImage]?.alt ?? ""}
                fill
                className="object-cover transition-transform duration-300"
                style={{
                  transform: imageZoomed ? "scale(2)" : "scale(1)",
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                }}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw"
                priority
              />

              {/* Discount badge */}
              {discountPercent && (
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 rounded-full bg-primary px-2.5 py-0.5 sm:px-3 sm:py-1 font-poppins text-[0.6rem] sm:text-[0.68rem] font-semibold text-background">
                  -{discountPercent}%
                </div>
              )}

              {/* Navigation arrows */}
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm text-dark/70 shadow-sm opacity-80 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 hover:bg-background hover:text-dark active:scale-90"
                aria-label="Image précédente"
              >
                <ChevronLeft
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  strokeWidth={2}
                />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm text-dark/70 shadow-sm opacity-80 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 hover:bg-background hover:text-dark active:scale-90"
                aria-label="Image suivante"
              >
                <ChevronRight
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  strokeWidth={2}
                />
              </button>

              {/* Image counter */}
              <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-dark/60 backdrop-blur-sm px-2.5 py-0.5 sm:px-3 sm:py-1 font-poppins text-[0.58rem] sm:text-[0.65rem] text-background/90">
                {selectedImage + 1} / {filteredImages.length}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-1.5 sm:gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
              {filteredImages.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(idx)}
                  className={`relative shrink-0 h-14 w-11 sm:h-16 sm:w-13 md:h-20 md:w-16 lg:h-24 lg:w-20 overflow-hidden rounded-md sm:rounded-lg transition-all duration-200 ${
                    selectedImage === idx
                      ? "ring-2 ring-primary ring-offset-1 sm:ring-offset-2 ring-offset-background"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  aria-label={`Voir ${img.alt}`}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* ════════════ RIGHT: Product Info ════════════ */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
              {/* Category + Name */}
              <div>
                <p className="font-poppins text-[0.58rem] sm:text-[0.62rem] md:text-[0.68rem] font-semibold uppercase tracking-[0.12em] sm:tracking-[0.15em] md:tracking-[0.2em] text-primary mb-1 sm:mb-1.5 md:mb-2">
                  {p.categoryMere}
                  {p.categorySous ? ` — ${p.categorySous}` : ""}
                </p>
                <h1 className="font-erotique text-xl sm:text-2xl md:text-3xl lg:text-4xl text-dark leading-tight">
                  {p.name}
                </h1>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1.5 sm:gap-2 md:gap-3 flex-wrap">
                <span className="font-poppins text-lg sm:text-xl md:text-2xl font-semibold text-dark">
                  {effectivePrice.toFixed(2)} TND
                </span>
                {p.promoPrice && (
                  <span className="font-poppins text-[0.72rem] sm:text-[0.8rem] md:text-[0.9rem] text-dark/40 line-through">
                    {p.price.toFixed(2)} TND
                  </span>
                )}
                {discountPercent && (
                  <span className="rounded-md bg-primary/10 px-1.5 sm:px-2 py-0.5 font-poppins text-[0.6rem] sm:text-[0.65rem] md:text-[0.7rem] font-semibold text-primary">
                    -{discountPercent}%
                  </span>
                )}
              </div>

              <div className="h-px bg-dark/8" />

              {/* Color selector */}
              {p.colors.length > 0 && (
                <div>
                  <p className="font-poppins text-[0.68rem] sm:text-[0.7rem] md:text-[0.75rem] font-medium text-dark mb-2 sm:mb-2.5 md:mb-3">
                    Couleur :{" "}
                    <span className="font-normal text-dark/60">
                      {selectedColor}
                    </span>
                  </p>
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    {p.colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorSelect(color)}
                        className={`h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-full border-2 transition-all duration-200 ${
                          selectedColor === color
                            ? "border-primary ring-2 ring-primary/25 scale-110"
                            : "border-dark/15 hover:border-dark/30"
                        }`}
                        style={{ backgroundColor: resolveHex(color) }}
                        aria-label={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size selector */}
              {p.sizes.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <p className="font-poppins text-[0.68rem] sm:text-[0.7rem] md:text-[0.75rem] font-medium text-dark">
                      Taille{" "}
                      {selectedSize && (
                        <span className="font-normal text-dark/60">
                          : {selectedSize}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-2.5">
                    {p.sizes.map((size) => {
                      const sizeEntry = p.sizeStock?.find(
                        (ss) => ss.size === size,
                      );
                      const sizeAvailable = sizeEntry
                        ? sizeEntry.stock > 0
                        : true;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            if (!sizeAvailable) return;
                            setSelectedSize(size);
                            setSizeError(false);
                          }}
                          disabled={!sizeAvailable}
                          className={`min-w-[2.75rem] sm:min-w-[3rem] md:min-w-[3.25rem] rounded-lg border px-3 sm:px-3.5 md:px-4 py-2.5 md:py-3 font-poppins text-[0.68rem] sm:text-[0.72rem] md:text-[0.75rem] font-medium transition-all duration-200 active:scale-95 ${
                            !sizeAvailable
                              ? "border-dark/10 text-dark/25 line-through cursor-not-allowed"
                              : selectedSize === size
                                ? "border-primary bg-primary text-background"
                                : "border-dark/15 text-dark/70 hover:border-dark/30"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                  {sizeError && (
                    <p className="mt-2 font-poppins text-[0.72rem] text-primary">
                      Veuillez sélectionner une taille
                    </p>
                  )}
                </div>
              )}

              {/* Quantity + Add to cart */}
              <div className="flex gap-2 sm:gap-2.5 md:gap-3">
                {/* Quantity */}
                <div className="flex items-center border border-dark/15 rounded-lg shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center text-dark/50 transition-colors duration-200 hover:text-dark active:text-dark"
                    aria-label="Diminuer la quantité"
                  >
                    <Minus
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                      strokeWidth={2}
                    />
                  </button>
                  <span className="flex h-11 w-9 sm:h-12 sm:w-10 items-center justify-center font-poppins text-[0.75rem] sm:text-[0.82rem] font-medium text-dark tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center text-dark/50 transition-colors duration-200 hover:text-dark active:text-dark"
                    aria-label="Augmenter la quantité"
                  >
                    <Plus
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                      strokeWidth={2}
                    />
                  </button>
                </div>

                {/* Add to cart */}
                <button
                  type="button"
                  onClick={p.stock === 0 ? undefined : handleAddToCart}
                  disabled={p.stock === 0}
                  className={`flex-1 flex items-center justify-center gap-2 sm:gap-2.5 rounded-lg py-3 sm:py-3.5 font-poppins text-[0.72rem] sm:text-[0.78rem] md:text-[0.82rem] font-semibold transition-all duration-300 ${
                    p.stock === 0
                      ? "bg-dark/10 text-dark/35 cursor-not-allowed"
                      : addedToCart
                        ? "bg-green-600 text-background"
                        : "bg-primary text-background hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  <ShoppingBag
                    className="h-4 w-4 sm:h-4.5 sm:w-4.5"
                    strokeWidth={2}
                  />
                  {p.stock === 0
                    ? "Hors stock"
                    : addedToCart
                      ? "Ajouté !"
                      : "Ajouter au panier"}
                </button>

                {/* Wishlist */}
                <WishlistButton
                  productId={p.id}
                  className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 active:scale-90"
                  activeClassName="border-primary bg-primary/10 text-primary"
                  inactiveClassName="border-dark/15 text-dark/40 hover:border-primary hover:text-primary"
                  iconClassName="h-4.5 w-4.5 sm:h-5 sm:w-5"
                />
              </div>

              {/* Share */}
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 sm:gap-2 font-poppins text-[0.68rem] sm:text-[0.72rem] text-dark/45 hover:text-primary transition-colors duration-200"
              >
                <Share2 className="h-3.5 w-3.5" strokeWidth={2} />
                {shareCopied ? "Lien copié ✓" : "Partager ce produit"}
              </button>

              <div className="h-px bg-dark/8" />

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                <div className="flex flex-col items-center text-center gap-1 sm:gap-1.5 md:gap-2 py-2 sm:py-2.5 md:py-3">
                  <Truck
                    className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-dark/40"
                    strokeWidth={1.6}
                  />
                  <span className="font-poppins text-[0.5rem] sm:text-[0.55rem] md:text-[0.62rem] leading-snug text-dark/50">
                    Livraison gratuite
                    <br />
                    dès 200 TND
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-1 sm:gap-1.5 md:gap-2 py-2 sm:py-2.5 md:py-3">
                  <RotateCcw
                    className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-dark/40"
                    strokeWidth={1.6}
                  />
                  <span className="font-poppins text-[0.5rem] sm:text-[0.55rem] md:text-[0.62rem] leading-snug text-dark/50">
                    Retours gratuits
                    <br />
                    sous 14 jours
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-1 sm:gap-1.5 md:gap-2 py-2 sm:py-2.5 md:py-3">
                  <ShieldCheck
                    className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 text-dark/40"
                    strokeWidth={1.6}
                  />
                  <span className="font-poppins text-[0.5rem] sm:text-[0.55rem] md:text-[0.62rem] leading-snug text-dark/50">
                    Paiement
                    <br />
                    100% sécurisé
                  </span>
                </div>
              </div>

              <div className="h-px bg-dark/8" />

              {/* ── Accordion: Description ── */}
              {p.description && (
                <div>
                  <button
                    type="button"
                    onClick={() => toggleSection("description")}
                    className="flex w-full items-center justify-between py-2"
                  >
                    <span className="font-poppins text-[0.72rem] sm:text-[0.75rem] md:text-[0.78rem] font-semibold uppercase tracking-[0.08em] sm:tracking-[0.1em] text-dark">
                      Description
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-dark/40 transition-transform duration-300 ${expandedSection === "description" ? "rotate-180" : ""}`}
                      strokeWidth={2}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-out ${expandedSection === "description" ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"}`}
                  >
                    <p className="font-poppins text-[0.72rem] sm:text-[0.76rem] md:text-[0.8rem] leading-relaxed text-dark/65 whitespace-pre-line">
                      {p.description}
                    </p>
                  </div>
                  <div className="mt-2 h-px bg-dark/8" />
                </div>
              )}

              {/* ── Accordion: Details ── */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleSection("details")}
                  className="flex w-full items-center justify-between py-2"
                >
                  <span className="font-poppins text-[0.72rem] sm:text-[0.75rem] md:text-[0.78rem] font-semibold uppercase tracking-[0.08em] sm:tracking-[0.1em] text-dark">
                    Détails du produit
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-dark/40 transition-transform duration-300 ${expandedSection === "details" ? "rotate-180" : ""}`}
                    strokeWidth={2}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-out ${expandedSection === "details" ? "max-h-60 opacity-100 mt-2" : "max-h-0 opacity-0"}`}
                >
                  <ul className="space-y-1.5">
                    {p.sizes.length > 0 && (
                      <li className="flex items-center gap-2 font-poppins text-[0.72rem] sm:text-[0.75rem] md:text-[0.78rem] text-dark/65">
                        <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                        Tailles : {p.sizes.join(", ")}
                      </li>
                    )}
                    {p.colors.length > 0 && (
                      <li className="flex items-center gap-2 font-poppins text-[0.72rem] sm:text-[0.75rem] md:text-[0.78rem] text-dark/65">
                        <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                        Couleurs : {p.colors.join(", ")}
                      </li>
                    )}
                    <li className="flex items-center gap-2 font-poppins text-[0.72rem] sm:text-[0.75rem] md:text-[0.78rem] text-dark/65">
                      <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                      Stock :{" "}
                      {p.stock > 0
                        ? `${p.stock} disponible(s)`
                        : "Rupture de stock"}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════ Related Products ════════════ */}
        {relatedProducts.length > 0 && (
          <div className="mt-10 sm:mt-14 md:mt-20 lg:mt-28">
            <div className="mb-5 sm:mb-7 md:mb-10 text-center">
              <p className="font-poppins text-[0.6rem] sm:text-[0.62rem] md:text-[0.65rem] font-semibold uppercase tracking-[0.18em] sm:tracking-[0.22em] md:tracking-[0.25em] text-primary mb-2 sm:mb-2.5">
                Vous aimerez aussi
              </p>
              <h2 className="font-erotique text-xl sm:text-2xl md:text-3xl text-dark">
                Nos Recommandations
              </h2>
              <div className="mt-3 sm:mt-4 mx-auto h-px w-8 sm:w-10 bg-dark/20" />
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:gap-4 lg:grid-cols-4">
              {relatedProducts.map((item) => (
                <Link
                  key={item.id}
                  href={`/${slug}/${item.slug}`}
                  className="group relative block overflow-hidden rounded-lg sm:rounded-xl bg-background transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
                >
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg sm:rounded-xl bg-dark/[0.03]">
                    <Image
                      src={item.image || "/images/placeholder.png"}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-dark/0 group-hover:bg-dark/10 transition-colors duration-300" />
                  </div>
                  <div className="p-2 sm:p-2.5 md:p-3 lg:p-3.5">
                    <h3 className="font-poppins text-[0.68rem] sm:text-[0.72rem] md:text-[0.78rem] font-medium text-dark leading-snug line-clamp-1 group-hover:text-primary transition-colors duration-200">
                      {item.name}
                    </h3>
                    <div className="mt-0.5 sm:mt-1 flex items-center gap-1.5 sm:gap-2">
                      <p className="font-poppins text-[0.68rem] sm:text-[0.72rem] md:text-[0.75rem] font-semibold text-dark/80">
                        {(item.promoPrice ?? item.price).toFixed(2)} TND
                      </p>
                      {item.promoPrice && (
                        <p className="font-poppins text-[0.56rem] sm:text-[0.6rem] md:text-[0.65rem] text-dark/40 line-through">
                          {item.price.toFixed(2)} TND
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
