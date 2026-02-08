"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  Ruler,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Truck,
  RotateCcw,
  ChevronDown,
  Star,
} from "lucide-react";

import {
  getCategoryBySlug,
  getSubcategoryBySlug,
  getItemBySlug,
  generateProducts,
} from "@/lib/categories";
import type { SubCategory, ItemMatch } from "@/lib/categories";
import ProductsListing from "../../component/shared/ProductsListing";

/* ════════════════════════════════════════════════════════════════
   Route: /[slug]/[subslug]
   Smart page: renders a SUBCATEGORY LISTING when subslug matches a
   known subcategory, otherwise renders the PRODUCT DETAIL page.
   ════════════════════════════════════════════════════════════════ */

export default function SubSlugPage() {
  const params = useParams();
  const slug = params.slug as string;
  const subslug = params.subslug as string;

  const category = getCategoryBySlug(slug);
  const subcategory = getSubcategoryBySlug(slug, subslug);

  /* 1️⃣ Subcategory match (e.g. /femme/robes) → listing page */
  if (subcategory && category) {
    return (
      <SubcategoryListingPage
        categorySlug={slug}
        category={category}
        subcategory={subcategory}
      />
    );
  }

  /* 2️⃣ Item match (e.g. /femme/jean) → item listing page */
  const itemMatch = getItemBySlug(slug, subslug);
  if (itemMatch && category) {
    return (
      <ItemListingPage
        categorySlug={slug}
        category={category}
        itemMatch={itemMatch}
      />
    );
  }

  /* 3️⃣ Fallback → product detail */
  return <ProductDetailPage slug={slug} subslug={subslug} />;
}

/* ════════════════════════════════════════════════════════════════
   Subcategory Listing  (e.g. /femme/robes)
   Re-uses the shared ProductsListing — zero duplicated logic.
   ════════════════════════════════════════════════════════════════ */

function SubcategoryListingPage({
  categorySlug,
  category,
  subcategory,
}: {
  categorySlug: string;
  category: { label: string; description: string };
  subcategory: SubCategory;
}) {
  /* Generate products scoped to this subcategory only. */
  const [products] = useState(() =>
    generateProducts(categorySlug, subcategory.slug),
  );

  return (
    <ProductsListing
      categorySlug={categorySlug}
      title={subcategory.title}
      subtitle={category.description}
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: category.label, href: `/${categorySlug}` },
        { label: subcategory.title },
      ]}
      /* No subcategory checkboxes — we're already inside one. */
      products={products}
    />
  );
}

/* ════════════════════════════════════════════════════════════════
   Item Listing  (e.g. /femme/jean)
   Shows all product variants for a specific item type.
   ════════════════════════════════════════════════════════════════ */

function ItemListingPage({
  categorySlug,
  category,
  itemMatch,
}: {
  categorySlug: string;
  category: { label: string; description: string };
  itemMatch: ItemMatch;
}) {
  const [products] = useState(() =>
    generateProducts(
      categorySlug,
      itemMatch.subcategory.slug,
      itemMatch.itemName,
    ),
  );

  return (
    <ProductsListing
      categorySlug={categorySlug}
      title={itemMatch.itemName}
      subtitle={category.description}
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: category.label, href: `/${categorySlug}` },
        {
          label: itemMatch.subcategory.title,
          href: `/${categorySlug}/${itemMatch.subcategory.slug}`,
        },
        { label: itemMatch.itemName },
      ]}
      products={products}
    />
  );
}

/* ════════════════════════════════════════════════════════════════
   Product Detail  (e.g. /femme/robe-courte-femme)
   ════════════════════════════════════════════════════════════════ */

/* ── Product-detail types ── */

interface ProductColor {
  name: string;
  hex: string;
}

interface ProductImage {
  src: string;
  alt: string;
}

interface ProductInfo {
  name: string;
  category: string;
  categorySlug: string;
  subcategory: string;
  price: number;
  oldPrice?: number;
  description: string;
  details: string[];
  composition: string;
  care: string[];
  images: ProductImage[];
  colors: ProductColor[];
  sizes: string[];
  rating: number;
  reviewCount: number;
}

interface RelatedProduct {
  id: number;
  name: string;
  price: number;
  image: string;
  slug: string;
}

/* ── Sample data for product detail ── */

const PRODUCT_IMAGES: ProductImage[] = [
  {
    src: "https://images.unsplash.com/photo-1434389677669-e08b4cda3a98?w=900&q=85",
    alt: "Vue principale",
  },
  {
    src: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&q=85",
    alt: "Vue de dos",
  },
  {
    src: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=900&q=85",
    alt: "Vue détail",
  },
  {
    src: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900&q=85",
    alt: "Portée",
  },
  {
    src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&q=85",
    alt: "Vue côté",
  },
];

const PRODUCT_COLORS: ProductColor[] = [
  { name: "Noir", hex: "#1a1a1a" },
  { name: "Blanc", hex: "#f5f5f5" },
  { name: "Beige", hex: "#d4b896" },
  { name: "Rouge", hex: "#b31b21" },
];

const DETAIL_SIZES = ["XS", "S", "M", "L", "XL"];

const RELATED_PRODUCTS: RelatedProduct[] = [
  {
    id: 1,
    name: "Chemise Classique",
    price: 89.0,
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80",
    slug: "chemise-classique",
  },
  {
    id: 2,
    name: "Pull / Sweater Élégant",
    price: 129.0,
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&q=80",
    slug: "pull-sweater-elegant",
  },
  {
    id: 3,
    name: "Blouse Raffinée",
    price: 99.0,
    image:
      "https://images.unsplash.com/photo-1495385794356-15371f348c31?w=600&q=80",
    slug: "blouse-raffinee",
  },
  {
    id: 4,
    name: "Gilet Oversize",
    price: 149.0,
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cda3a98?w=600&q=80",
    slug: "gilet-oversize",
  },
];

/* ── Component ── */

function ProductDetailPage({
  slug,
  subslug,
}: {
  slug: string;
  subslug: string;
}) {
  const category = getCategoryBySlug(slug);
  const categoryLabel = category?.label ?? slug;

  const productName = subslug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  /* Build product info */
  const product: ProductInfo = {
    name: productName,
    category: categoryLabel,
    categorySlug: slug,
    subcategory: "Hauts",
    price: 119.0,
    oldPrice: 159.0,
    description:
      "Pièce incontournable de notre collection, ce vêtement allie confort et élégance. Son tissu doux et résistant est conçu pour accompagner chaque moment de votre quotidien avec style. La coupe soignée offre un tombé impeccable qui sublime naturellement la silhouette.",
    details: [
      "Coupe ajustée",
      "Col rond classique",
      "Manches longues",
      "Finitions soignées",
      "Logo brodé discret",
    ],
    composition: "95% Coton biologique, 5% Élasthanne",
    care: [
      "Lavage à 30° maximum",
      "Ne pas utiliser de javel",
      "Séchage à plat recommandé",
      "Repassage à basse température",
    ],
    images: PRODUCT_IMAGES,
    colors: PRODUCT_COLORS,
    sizes: DETAIL_SIZES,
    rating: 4.7,
    reviewCount: 38,
  };

  /* ── State ── */
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0].name);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "description",
  );
  const [sizeError, setSizeError] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const mainImageRef = useRef<HTMLDivElement>(null);

  /* ── Handlers ── */
  const toggleSection = useCallback((section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }, [selectedSize]);

  const handlePrevImage = useCallback(() => {
    setSelectedImage((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1,
    );
  }, [product.images.length]);

  const handleNextImage = useCallback(() => {
    setSelectedImage((prev) =>
      prev === product.images.length - 1 ? 0 : prev + 1,
    );
  }, [product.images.length]);

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

  /* Keyboard navigation for gallery */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "ArrowRight") handleNextImage();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handlePrevImage, handleNextImage]);

  /* ── Computed ── */
  const discountPercent = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : null;

  return (
    <div className="bg-background min-h-screen">
      {/* ── Breadcrumb ── */}
      <div className="border-b border-dark/8">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-4">
          <nav className="font-poppins text-[0.7rem] text-dark/45 flex items-center flex-wrap gap-y-1">
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
            <span className="text-dark/70 line-clamp-1">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
          {/* ════════════ LEFT: Image Gallery ════════════ */}
          <div className="space-y-4">
            {/* Main image */}
            <div
              ref={mainImageRef}
              className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-dark/[0.03] cursor-crosshair group"
              onMouseEnter={() => setImageZoomed(true)}
              onMouseLeave={() => setImageZoomed(false)}
              onMouseMove={handleImageMouseMove}
            >
              <Image
                src={product.images[selectedImage].src}
                alt={product.images[selectedImage].alt}
                fill
                className="object-cover transition-transform duration-300"
                style={{
                  transform: imageZoomed ? "scale(2)" : "scale(1)",
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                }}
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />

              {/* Discount badge */}
              {discountPercent && (
                <div className="absolute top-4 left-4 rounded-full bg-primary px-3 py-1 font-poppins text-[0.68rem] font-semibold text-background">
                  -{discountPercent}%
                </div>
              )}

              {/* Navigation arrows */}
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm text-dark/70 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background hover:text-dark"
                aria-label="Image précédente"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm text-dark/70 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-background hover:text-dark"
                aria-label="Image suivante"
              >
                <ChevronRight className="h-5 w-5" strokeWidth={2} />
              </button>

              {/* Image counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-dark/60 backdrop-blur-sm px-3 py-1 font-poppins text-[0.65rem] text-background/90">
                {selectedImage + 1} / {product.images.length}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(idx)}
                  className={`relative shrink-0 h-20 w-16 sm:h-24 sm:w-20 overflow-hidden rounded-lg transition-all duration-200 ${
                    selectedImage === idx
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
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
          <div className="lg:sticky lg:top-32 lg:self-start">
            <div className="space-y-6">
              {/* Category + Name */}
              <div>
                <p className="font-poppins text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary mb-2">
                  {product.category} — {product.subcategory}
                </p>
                <h1 className="font-erotique text-3xl sm:text-4xl text-dark leading-tight">
                  {product.name}
                </h1>

                {/* Rating */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3.5 w-3.5 ${
                          star <= Math.round(product.rating)
                            ? "fill-primary text-primary"
                            : "fill-dark/10 text-dark/10"
                        }`}
                        strokeWidth={0}
                      />
                    ))}
                  </div>
                  <span className="font-poppins text-[0.72rem] text-dark/50">
                    {product.rating} ({product.reviewCount} avis)
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="font-poppins text-2xl font-semibold text-dark">
                  {product.price.toFixed(2)} TND
                </span>
                {product.oldPrice && (
                  <span className="font-poppins text-[0.9rem] text-dark/40 line-through">
                    {product.oldPrice.toFixed(2)} TND
                  </span>
                )}
                {discountPercent && (
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 font-poppins text-[0.7rem] font-semibold text-primary">
                    -{discountPercent}%
                  </span>
                )}
              </div>

              <div className="h-px bg-dark/8" />

              {/* Color selector */}
              <div>
                <p className="font-poppins text-[0.75rem] font-medium text-dark mb-3">
                  Couleur :{" "}
                  <span className="font-normal text-dark/60">
                    {selectedColor}
                  </span>
                </p>
                <div className="flex items-center gap-2.5">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setSelectedColor(color.name)}
                      className={`h-8 w-8 rounded-full border-2 transition-all duration-200 ${
                        selectedColor === color.name
                          ? "border-primary ring-2 ring-primary/25 scale-110"
                          : "border-dark/15 hover:border-dark/30"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      aria-label={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Size selector */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-poppins text-[0.75rem] font-medium text-dark">
                    Taille{" "}
                    {selectedSize && (
                      <span className="font-normal text-dark/60">
                        : {selectedSize}
                      </span>
                    )}
                  </p>
                  <button
                    type="button"
                    className="flex items-center gap-1 font-poppins text-[0.68rem] text-dark/50 hover:text-primary transition-colors duration-200"
                  >
                    <Ruler className="h-3.5 w-3.5" strokeWidth={2} />
                    Guide des tailles
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setSelectedSize(size);
                        setSizeError(false);
                      }}
                      className={`min-w-[3rem] rounded-lg border px-4 py-2.5 font-poppins text-[0.75rem] font-medium transition-all duration-200 ${
                        selectedSize === size
                          ? "border-primary bg-primary text-background"
                          : "border-dark/15 text-dark/70 hover:border-dark/30"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {sizeError && (
                  <p className="mt-2 font-poppins text-[0.72rem] text-primary">
                    Veuillez sélectionner une taille
                  </p>
                )}
              </div>

              {/* Quantity + Add to cart */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Quantity */}
                <div className="flex items-center border border-dark/15 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-12 w-12 items-center justify-center text-dark/50 transition-colors duration-200 hover:text-dark"
                    aria-label="Diminuer la quantité"
                  >
                    <Minus className="h-4 w-4" strokeWidth={2} />
                  </button>
                  <span className="flex h-12 w-10 items-center justify-center font-poppins text-[0.82rem] font-medium text-dark">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    className="flex h-12 w-12 items-center justify-center text-dark/50 transition-colors duration-200 hover:text-dark"
                    aria-label="Augmenter la quantité"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>

                {/* Add to cart */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex-1 flex items-center justify-center gap-2.5 rounded-lg py-3.5 font-poppins text-[0.82rem] font-semibold transition-all duration-300 ${
                    addedToCart
                      ? "bg-green-600 text-background"
                      : "bg-primary text-background hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  <ShoppingBag className="h-4.5 w-4.5" strokeWidth={2} />
                  {addedToCart ? "Ajouté au panier !" : "Ajouter au panier"}
                </button>

                {/* Wishlist */}
                <button
                  type="button"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 ${
                    isWishlisted
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-dark/15 text-dark/40 hover:border-primary hover:text-primary"
                  }`}
                  aria-label={
                    isWishlisted ? "Retirer des favoris" : "Ajouter aux favoris"
                  }
                >
                  <Heart
                    className={`h-5 w-5 transition-all duration-200 ${isWishlisted ? "fill-primary" : ""}`}
                    strokeWidth={2}
                  />
                </button>
              </div>

              {/* Share */}
              <button
                type="button"
                className="flex items-center gap-2 font-poppins text-[0.72rem] text-dark/45 hover:text-primary transition-colors duration-200"
              >
                <Share2 className="h-3.5 w-3.5" strokeWidth={2} />
                Partager ce produit
              </button>

              <div className="h-px bg-dark/8" />

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col items-center text-center gap-2 py-3">
                  <Truck className="h-5 w-5 text-dark/40" strokeWidth={1.6} />
                  <span className="font-poppins text-[0.62rem] leading-snug text-dark/50">
                    Livraison gratuite
                    <br />
                    dès 200 TND
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-2 py-3">
                  <RotateCcw
                    className="h-5 w-5 text-dark/40"
                    strokeWidth={1.6}
                  />
                  <span className="font-poppins text-[0.62rem] leading-snug text-dark/50">
                    Retours gratuits
                    <br />
                    sous 14 jours
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-2 py-3">
                  <ShieldCheck
                    className="h-5 w-5 text-dark/40"
                    strokeWidth={1.6}
                  />
                  <span className="font-poppins text-[0.62rem] leading-snug text-dark/50">
                    Paiement
                    <br />
                    100% sécurisé
                  </span>
                </div>
              </div>

              <div className="h-px bg-dark/8" />

              {/* ── Accordion sections ── */}
              {/* Description */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleSection("description")}
                  className="flex w-full items-center justify-between py-2"
                >
                  <span className="font-poppins text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-dark">
                    Description
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-dark/40 transition-transform duration-300 ${expandedSection === "description" ? "rotate-180" : ""}`}
                    strokeWidth={2}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-out ${expandedSection === "description" ? "max-h-60 opacity-100 mt-2" : "max-h-0 opacity-0"}`}
                >
                  <p className="font-poppins text-[0.8rem] leading-relaxed text-dark/65">
                    {product.description}
                  </p>
                </div>
                <div className="mt-2 h-px bg-dark/8" />
              </div>

              {/* Details */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleSection("details")}
                  className="flex w-full items-center justify-between py-2"
                >
                  <span className="font-poppins text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-dark">
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
                    {product.details.map((d, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 font-poppins text-[0.78rem] text-dark/65"
                      >
                        <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-2 h-px bg-dark/8" />
              </div>

              {/* Composition & Care */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleSection("composition")}
                  className="flex w-full items-center justify-between py-2"
                >
                  <span className="font-poppins text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-dark">
                    Composition & Entretien
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-dark/40 transition-transform duration-300 ${expandedSection === "composition" ? "rotate-180" : ""}`}
                    strokeWidth={2}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-out ${expandedSection === "composition" ? "max-h-60 opacity-100 mt-2" : "max-h-0 opacity-0"}`}
                >
                  <p className="font-poppins text-[0.78rem] font-medium text-dark/70 mb-3">
                    {product.composition}
                  </p>
                  <ul className="space-y-1.5">
                    {product.care.map((c, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 font-poppins text-[0.78rem] text-dark/60"
                      >
                        <span className="h-1 w-1 rounded-full bg-dark/25 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════ Related Products ════════════ */}
        <div className="mt-20 lg:mt-28">
          <div className="mb-10 text-center">
            <p className="font-poppins text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-primary mb-2.5">
              Vous aimerez aussi
            </p>
            <h2 className="font-erotique text-2xl sm:text-3xl text-dark">
              Nos Recommandations
            </h2>
            <div className="mt-4 mx-auto h-px w-10 bg-dark/20" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {RELATED_PRODUCTS.map((item) => (
              <Link
                key={item.id}
                href={`/${slug}/${item.slug}`}
                className="group relative block overflow-hidden rounded-xl bg-background transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-dark/[0.03]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-dark/0 group-hover:bg-dark/10 transition-colors duration-300" />
                </div>
                <div className="p-3 sm:p-3.5">
                  <h3 className="font-poppins text-[0.78rem] font-medium text-dark leading-snug line-clamp-1 group-hover:text-primary transition-colors duration-200">
                    {item.name}
                  </h3>
                  <p className="mt-1 font-poppins text-[0.75rem] font-semibold text-dark/80">
                    {item.price.toFixed(2)} TND
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
