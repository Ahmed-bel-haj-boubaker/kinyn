"use client";

import { useState } from "react";
import type { Product, ProductStatus } from "./ProductTable";

const STATUS_CONFIG: Record<
  ProductStatus,
  { label: string; dot: string; badge: string }
> = {
  active: {
    label: "Actif",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-600",
  },
  draft: {
    label: "Brouillon",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-600",
  },
  outofstock: {
    label: "Rupture",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-600",
  },
};

const COLOR_HEX: Record<string, string> = {
  Noir: "#000000",
  Blanc: "#FFFFFF",
  Rouge: "#b31b21",
  Bleu: "#1e40af",
  Vert: "#16a34a",
  Beige: "#d4c5a9",
  Gris: "#6b7280",
  Rose: "#ec4899",
  Marron: "#92400e",
};

interface ProductDetailModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onEdit: (product: Product) => void;
}

export default function ProductDetailModal({
  isOpen,
  product,
  onClose,
  onEdit,
}: ProductDetailModalProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  if (!isOpen || !product) return null;

  const p = product;
  const st = STATUS_CONFIG[p.status];
  const effectivePrice = p.promoPrice ?? p.price;
  const discountPercent = p.promoPrice
    ? Math.round(((p.price - p.promoPrice) / p.price) * 100)
    : null;

  const images =
    p.images.length > 0
      ? p.images
      : [{ url: "/images/placeholder.png", color: "", colorHex: "" }];

  const resolveHex = (name: string) => {
    const img = p.images.find((im) => im.color === name && im.colorHex);
    return img?.colorHex || COLOR_HEX[name] || "#ccc";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full sm:max-w-3xl h-[92dvh] sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-gray-100 rounded-t-2xl">
          <h2 className="font-poppins text-base sm:text-lg font-semibold text-dark">
            Détails du produit
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(p)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-white font-poppins text-xs font-medium hover:bg-primary/90 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Modifier
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-dark/40 hover:text-dark/70 hover:bg-dark/5 transition-colors duration-150 focus:outline-none"
              aria-label="Fermer"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Images */}
            <div className="space-y-3">
              <div className="relative aspect-square rounded-xl bg-dark/[0.03] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[selectedImage].url}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
                {images[selectedImage].color && (
                  <span
                    className="absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-white shadow"
                    style={{
                      backgroundColor: resolveHex(images[selectedImage].color),
                    }}
                  />
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(idx)}
                      className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-150 ${
                        selectedImage === idx
                          ? "ring-2 ring-primary ring-offset-1"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={`Vue ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {img.color && (
                        <span
                          className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border border-white"
                          style={{
                            backgroundColor: resolveHex(img.color),
                          }}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div className="space-y-4">
              {/* Name + Status */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-poppins text-xl font-semibold text-dark leading-tight">
                    {p.name}
                  </h3>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 font-poppins text-xs font-medium px-2.5 py-1 rounded-full ${st.badge}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                </div>
                <p className="font-poppins text-xs text-dark/40 mt-1">
                  SKU: {p.sku}
                </p>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="font-poppins text-2xl font-bold text-dark">
                  {effectivePrice.toFixed(2)} TND
                </span>
                {p.promoPrice && (
                  <>
                    <span className="font-poppins text-sm text-dark/30 line-through">
                      {p.price.toFixed(2)} TND
                    </span>
                    <span className="font-poppins text-xs font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                      -{discountPercent}%
                    </span>
                  </>
                )}
              </div>

              <div className="h-px bg-dark/8" />

              {/* Category */}
              <div>
                <p className="font-poppins text-xs font-medium text-dark/40 mb-1">
                  Catégorie
                </p>
                <p className="font-poppins text-sm text-dark">
                  {p.categoryMereName}
                  {p.categorySousName && (
                    <span className="text-dark/40">
                      {" / "}
                      {p.categorySousName}
                    </span>
                  )}
                  {p.categoryFinaleName && (
                    <span className="text-dark/30">
                      {" / "}
                      {p.categoryFinaleName}
                    </span>
                  )}
                </p>
              </div>

              {/* Stock */}
              <div>
                <p className="font-poppins text-xs font-medium text-dark/40 mb-1">
                  Stock
                </p>
                {p.sizeStock && p.sizeStock.length > 0 ? (
                  <div className="space-y-1.5">
                    {p.sizeStock.map((ss) => (
                      <div
                        key={ss.size}
                        className="flex items-center justify-between font-poppins text-sm"
                      >
                        <span className="text-dark/60">{ss.size}</span>
                        <span
                          className={`font-medium ${ss.stock === 0 ? "text-red-500" : ss.stock < 5 ? "text-amber-500" : "text-dark"}`}
                        >
                          {ss.stock} unité{ss.stock !== 1 ? "s" : ""}
                          {ss.stock === 0 && (
                            <span className="ml-1.5 text-xs font-medium text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md">
                              Hors stock
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                    <div className="mt-2 pt-2 border-t border-dark/8 flex items-center justify-between font-poppins text-sm font-semibold">
                      <span className="text-dark/50">Total</span>
                      <span className="text-dark">
                        {p.stock} unité{p.stock !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="font-poppins text-sm text-dark/40">
                    Aucune taille configurée
                  </p>
                )}
              </div>

              <div className="h-px bg-dark/8" />

              {/* Colors */}
              {p.colors.length > 0 && (
                <div>
                  <p className="font-poppins text-xs font-medium text-dark/40 mb-2">
                    Couleurs
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {p.colors.map((c) => (
                      <div key={c} className="flex items-center gap-1.5">
                        <span
                          className="w-5 h-5 rounded-full border border-gray-200"
                          style={{
                            backgroundColor: resolveHex(c),
                          }}
                        />
                        <span className="font-poppins text-xs text-dark/60">
                          {c}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {p.description && (
                <div>
                  <p className="font-poppins text-xs font-medium text-dark/40 mb-1">
                    Description
                  </p>
                  <p className="font-poppins text-sm text-dark/70 leading-relaxed whitespace-pre-line">
                    {p.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
