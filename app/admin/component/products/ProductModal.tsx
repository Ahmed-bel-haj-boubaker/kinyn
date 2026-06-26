"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import type {
  Product,
  ProductImage,
  ProductStatus,
  ProductSizeStock,
} from "./ProductTable";

type ModalMode = "create" | "edit";

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductModalProps {
  isOpen: boolean;
  mode: ModalMode;
  initialData?: Product | null;
  onClose: () => void;
  onSave: (product: Omit<Product, "id"> & { id?: string }) => void;
  saving?: boolean;
  categories: CategoryOption[];
  getCategoryChildren: (parentId: string) => CategoryOption[];
}

/* ------------------------------------------------------------------ */
/*  Inner form — re-mounted via key to avoid React 19 setState issues */
/* ------------------------------------------------------------------ */

interface FormInnerProps {
  mode: ModalMode;
  initialData?: Product | null;
  onClose: () => void;
  onSave: (product: Omit<Product, "id"> & { id?: string }) => void;
  saving?: boolean;
  categories: CategoryOption[];
  getCategoryChildren: (parentId: string) => CategoryOption[];
}

type Section = "general" | "category" | "pricing" | "images" | "variants";

const SECTIONS: { key: Section; label: string; icon: ReactNode }[] = [
  {
    key: "general",
    label: "Général",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    key: "category",
    label: "Catégories",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
  },
  {
    key: "pricing",
    label: "Prix",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    key: "images",
    label: "Images",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    key: "variants",
    label: "Variantes",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
        />
      </svg>
    ),
  },
];

const ALL_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
];
function ProductFormInner({
  mode,
  initialData,
  onClose,
  onSave,
  saving,
  categories,
  getCategoryChildren,
}: FormInnerProps) {
  const [section, setSection] = useState<Section>("general");

  /* Form state */
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(
    initialData?.description ?? "",
  );
  const [sku, setSku] = useState(initialData?.sku ?? "");
  const isNewProduct = !initialData?.id;

  /* Auto-generate SKU from name for new products */
  const generateSku = (productName: string) => {
    const base = productName
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z0-9\s]/g, "")
      .trim()
      .split(/\s+/)
      .slice(0, 3)
      .map((w) => w.slice(0, 4))
      .join("-");
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return base ? `${base}-${rand}` : "";
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (isNewProduct) setSku(generateSku(value));
  };
  const [categoryMere, setCategoryMere] = useState(
    initialData?.categoryMere ?? "",
  );
  const [categorySous, setCategorySous] = useState(
    initialData?.categorySous ?? "",
  );
  const [categoryFinale, setCategoryFinale] = useState(
    initialData?.categoryFinale ?? "",
  );
  const [price, setPrice] = useState(initialData?.price?.toString() ?? "");
  const [promoPrice, setPromoPrice] = useState(
    initialData?.promoPrice?.toString() ?? "",
  );
  const [sizeStock, setSizeStock] = useState<ProductSizeStock[]>(
    initialData?.sizeStock ?? [],
  );
  const [status, setStatus] = useState<ProductStatus>(
    initialData?.status ?? "draft",
  );
  const [images, setImages] = useState<ProductImage[]>(
    initialData?.images ?? [],
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Drag-and-drop reorder ── */
  const dragIndex = useRef<number | null>(null);

  const handleDragStart = (i: number) => {
    dragIndex.current = i;
  };

  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === i) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex.current!, 1);
      next.splice(i, 0, moved);
      dragIndex.current = i;
      return next;
    });
  };

  const handleDragEnd = () => {
    dragIndex.current = null;
  };

  const setAsPrincipal = (i: number) => {
    if (i === 0) return;
    setImages((prev) => {
      const next = [...prev];
      const [img] = next.splice(i, 1);
      next.unshift(img);
      return next;
    });
  };

  /* Validation */
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sousOptions = categoryMere ? getCategoryChildren(categoryMere) : [];
  const finaleOptions = categorySous ? getCategoryChildren(categorySous) : [];

  /* Resolve category names for display */
  const mereName = categories.find((c) => c.id === categoryMere)?.name ?? "";
  const sousName = sousOptions.find((c) => c.id === categorySous)?.name ?? "";
  const finaleName =
    finaleOptions.find((c) => c.id === categoryFinale)?.name ?? "";

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Le nom est requis";
    if (!sku.trim()) e.sku = "Le SKU est requis";
    if (!categoryMere) e.categoryMere = "La catégorie mère est requise";
    if (!price || isNaN(Number(price)) || Number(price) <= 0)
      e.price = "Prix invalide";
    if (promoPrice && (isNaN(Number(promoPrice)) || Number(promoPrice) <= 0))
      e.promoPrice = "Prix promo invalide";
    if (sizeStock.length === 0)
      e.sizeStock = "Au moins une taille avec stock est requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    /* Derive colors from image color assignments */
    const derivedColors = Array.from(
      new Set(images.map((img) => img.color).filter(Boolean)),
    );
    onSave({
      ...(initialData?.id ? { id: initialData.id } : {}),
      name: name.trim(),
      slug: "",
      description: description.trim(),
      sku: sku.trim(),
      categoryMere,
      categoryMereName: mereName,
      categorySous: categorySous || null,
      categorySousName: sousName || null,
      categoryFinale: categoryFinale || null,
      categoryFinaleName: finaleName || null,
      price: Number(price),
      promoPrice: promoPrice ? Number(promoPrice) : undefined,
      sizeStock,
      stock: sizeStock.reduce((sum, s) => sum + s.stock, 0),
      sizes: sizeStock.map((s) => s.size),
      status,
      images,
      colors: derivedColors,
    });
  };

  const toggleSize = (s: string) => {
    setSizeStock((prev) => {
      const exists = prev.find((ss) => ss.size === s);
      if (exists) return prev.filter((ss) => ss.size !== s);
      return [...prev, { size: s, stock: 0 }];
    });
  };

  const updateSizeStockValue = (size: string, stock: number) => {
    setSizeStock((prev) =>
      prev.map((ss) =>
        ss.size === size ? { ...ss, stock: Math.max(0, stock) } : ss,
      ),
    );
  };

  const removeImage = (i: number) =>
    setImages((prev) => prev.filter((_, idx) => idx !== i));

  /* The picked hex is the single source of truth for an image's color:
     it identifies the color (img.color) AND renders it (img.colorHex). */
  const setImageColorHex = (i: number, hex: string) =>
    setImages((prev) =>
      prev.map((img, idx) =>
        idx === i ? { ...img, color: hex, colorHex: hex } : img,
      ),
    );

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("images", f));
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (res.ok && json.urls) {
        setImages((prev) => [
          ...prev,
          ...json.urls.map((url: string) => ({ url, color: "", colorHex: "" })),
        ]);
      }
    } catch {
      /* silently fail upload */
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const fieldClass = (field: string) =>
    `w-full px-4 py-2.5 rounded-xl border ${
      errors[field]
        ? "border-primary/60 ring-2 ring-primary/10"
        : "border-gray-200"
    } bg-white font-poppins text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200`;

  const selectClass = (field: string) =>
    `${fieldClass(field)} appearance-none bg-no-repeat bg-position-[right_0.75rem_center] bg-size-[1rem] bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2317171a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")] pr-10`;

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
        <h2 className="font-erotique text-xl text-dark">
          {mode === "create" ? "Nouveau Produit" : "Modifier le Produit"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-dark/40 hover:text-dark hover:bg-dark/5 transition-colors duration-150 focus:outline-none"
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

      {/* Section Tabs */}
      <div className="flex border-b border-gray-100 px-6 gap-1 overflow-x-auto shrink-0">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSection(s.key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 font-poppins text-xs font-medium whitespace-nowrap border-b-2 transition-colors duration-150 -mb-px ${
              section === s.key
                ? "border-primary text-primary"
                : "border-transparent text-dark/40 hover:text-dark/60"
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* ========== GENERAL ========== */}
        {section === "general" && (
          <>
            <div>
              <label className="block font-poppins text-xs font-medium text-dark/60 mb-1.5">
                Nom du produit <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="ex: Robe Élégante Noire"
                className={fieldClass("name")}
              />
              {errors.name && (
                <p className="font-poppins text-xs text-primary mt-1">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block font-poppins text-xs font-medium text-dark/60 mb-1.5">
                Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description détaillée du produit…"
                className={`${fieldClass("description")} resize-none`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-poppins text-xs font-medium text-dark/60 mb-1.5">
                  SKU{" "}
                  <span className="text-dark/30 font-normal text-[10px]">
                    (auto-g&#233;n&#233;r&#233;, modifiable)
                  </span>
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="Ex : ROBE-ELEG-4F2A"
                  className={fieldClass("sku")}
                />
                {errors.sku && (
                  <p className="font-poppins text-xs text-primary mt-1">
                    {errors.sku}
                  </p>
                )}
              </div>
              <div>
                <label className="block font-poppins text-xs font-medium text-dark/60 mb-1.5">
                  Statut
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProductStatus)}
                  className={selectClass("status")}
                >
                  <option value="draft">Brouillon</option>
                  <option value="active">Actif</option>
                  <option value="outofstock">Rupture de stock</option>
                </select>
              </div>
            </div>
          </>
        )}

        {/* ========== CATEGORIES ========== */}
        {section === "category" && (
          <>
            <div>
              <label className="block font-poppins text-xs font-medium text-dark/60 mb-1.5">
                Catégorie mère <span className="text-primary">*</span>
              </label>
              <select
                value={categoryMere}
                onChange={(e) => {
                  setCategoryMere(e.target.value);
                  setCategorySous("");
                  setCategoryFinale("");
                }}
                className={selectClass("categoryMere")}
              >
                <option value="">Sélectionner…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryMere && (
                <p className="font-poppins text-xs text-primary mt-1">
                  {errors.categoryMere}
                </p>
              )}
            </div>

            {sousOptions.length > 0 && (
              <div>
                <label className="block font-poppins text-xs font-medium text-dark/60 mb-1.5">
                  Sous-catégorie
                </label>
                <select
                  value={categorySous}
                  onChange={(e) => {
                    setCategorySous(e.target.value);
                    setCategoryFinale("");
                  }}
                  className={selectClass("categorySous")}
                >
                  <option value="">Sélectionner…</option>
                  {sousOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {finaleOptions.length > 0 && (
              <div>
                <label className="block font-poppins text-xs font-medium text-dark/60 mb-1.5">
                  Catégorie finale
                </label>
                <select
                  value={categoryFinale}
                  onChange={(e) => setCategoryFinale(e.target.value)}
                  className={selectClass("categoryFinale")}
                >
                  <option value="">Sélectionner…</option>
                  {finaleOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Preview breadcrumb */}
            {categoryMere && (
              <div className="bg-background rounded-xl p-3">
                <p className="font-poppins text-xs text-dark/40 mb-1">
                  Chemin de catégorie
                </p>
                <p className="font-poppins text-sm text-dark font-medium">
                  {mereName}
                  {sousName && (
                    <span className="text-dark/40"> › {sousName}</span>
                  )}
                  {finaleName && (
                    <span className="text-dark/40"> › {finaleName}</span>
                  )}
                </p>
              </div>
            )}
          </>
        )}

        {/* ========== PRICING & STOCK ========== */}
        {section === "pricing" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-poppins text-xs font-medium text-dark/60 mb-1.5">
                  Prix ( TND) <span className="text-primary">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className={fieldClass("price")}
                />
                {errors.price && (
                  <p className="font-poppins text-xs text-primary mt-1">
                    {errors.price}
                  </p>
                )}
              </div>
              <div>
                <label className="block font-poppins text-xs font-medium text-dark/60 mb-1.5">
                  Prix promo ( TND)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={promoPrice}
                  onChange={(e) => setPromoPrice(e.target.value)}
                  placeholder="0.00"
                  className={fieldClass("promoPrice")}
                />
                {errors.promoPrice && (
                  <p className="font-poppins text-xs text-primary mt-1">
                    {errors.promoPrice}
                  </p>
                )}
              </div>
            </div>

            {promoPrice && price && Number(promoPrice) < Number(price) && (
              <div className="bg-emerald-50 rounded-xl p-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-emerald-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                <p className="font-poppins text-xs text-emerald-700">
                  Réduction de{" "}
                  {Math.round((1 - Number(promoPrice) / Number(price)) * 100)}%
                </p>
              </div>
            )}
          </>
        )}

        {/* ========== IMAGES ========== */}
        {section === "images" && (
          <>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map((img, i) => (
                <div
                  key={img.url + i}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDragEnd={handleDragEnd}
                  className="relative rounded-xl border-2 border-dashed border-gray-200 bg-dark/2 group overflow-hidden cursor-grab active:cursor-grabbing"
                >
                  <div className="aspect-square flex items-center justify-center">
                    {img.url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={img.url}
                        alt={`Image ${i + 1}`}
                        className="w-full h-full object-cover rounded-t-xl"
                      />
                    ) : (
                      <svg
                        className="w-8 h-8 text-dark/15"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </div>
                  {/* Color picker for this image */}
                  <div className="px-1.5 py-1.5 border-t border-gray-100 bg-white rounded-b-xl">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="color"
                        value={img.colorHex || "#cccccc"}
                        onChange={(e) => setImageColorHex(i, e.target.value)}
                        className="w-6 h-6 rounded-md border border-gray-200 cursor-pointer p-0 bg-transparent shrink-0"
                        title="Choisir la couleur"
                      />
                      <span className="font-poppins text-[11px] text-dark/60">
                        {img.colorHex ? "Couleur choisie" : "Choisir la couleur"}
                      </span>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 focus:outline-none"
                    aria-label="Supprimer l'image"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                  {/* Drag handle */}
                  <div className="absolute top-1 left-1 flex items-center gap-1">
                    {i === 0 ? (
                      <span className="bg-primary text-white font-poppins text-[10px] px-1.5 py-0.5 rounded-md leading-none">
                        Principal
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAsPrincipal(i)}
                        title="Définir comme image principale"
                        className="bg-dark/60 hover:bg-primary text-white font-poppins text-[10px] px-1.5 py-0.5 rounded-md leading-none transition-colors duration-150 opacity-0 group-hover:opacity-100 focus:outline-none focus:opacity-100"
                      >
                        ★ Principal
                      </button>
                    )}
                  </div>
                  {img.colorHex && (
                    <span
                      className="absolute top-1 right-8 w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: img.colorHex }}
                    />
                  )}
                </div>
              ))}

              {/* Upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-primary/40 bg-dark/2 hover:bg-primary/2 flex flex-col items-center justify-center gap-1.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              >
                {uploading ? (
                  <svg
                    className="w-6 h-6 text-dark/30 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6 text-dark/20"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                )}
                <span className="font-poppins text-xs text-dark/30">
                  {uploading ? "Envoi…" : "Ajouter"}
                </span>
              </button>
            </div>
            <p className="font-poppins text-xs text-dark/30">
              La première image sera utilisée comme image principale. Vous
              pouvez associer une couleur à chaque image (optionnel). Max 5 Mo
              par image. Formats : JPEG, PNG, WebP, AVIF, GIF.
            </p>
          </>
        )}

        {/* ========== VARIANTS ========== */}
        {section === "variants" && (
          <>
            {/* Sizes */}
            <div>
              <label className="block font-poppins text-xs font-medium text-dark/60 mb-2">
                Tailles
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_SIZES.map((s) => {
                  const selected = sizeStock.some((ss) => ss.size === s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSize(s)}
                      className={`px-3 py-1.5 rounded-lg font-poppins text-xs font-medium border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        selected
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-dark/50 border-gray-200 hover:border-primary/30 hover:text-dark/70"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              {sizeStock.length > 0 && (
                <p className="font-poppins text-xs text-dark/40 mt-2">
                  {sizeStock.length} taille{sizeStock.length > 1 ? "s" : ""}{" "}
                  sélectionnée{sizeStock.length > 1 ? "s" : ""}
                </p>
              )}
              {errors.sizeStock && (
                <p className="font-poppins text-xs text-primary mt-1">
                  {errors.sizeStock}
                </p>
              )}
            </div>

            {/* Per-size stock */}
            {sizeStock.length > 0 && (
              <div>
                <label className="block font-poppins text-xs font-medium text-dark/60 mb-2">
                  Stock par taille
                </label>
                <div className="space-y-2">
                  {sizeStock.map((ss) => (
                    <div
                      key={ss.size}
                      className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2"
                    >
                      <span className="font-poppins text-xs font-semibold text-dark/70 w-12">
                        {ss.size}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={ss.stock}
                        onChange={(e) =>
                          updateSizeStockValue(
                            ss.size,
                            Math.max(0, parseInt(e.target.value) || 0),
                          )
                        }
                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white font-poppins text-xs text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                        placeholder="0"
                      />
                      {ss.stock <= 5 && ss.stock >= 0 && (
                        <span className="font-poppins text-[10px] text-amber-500">
                          {ss.stock === 0 ? "Rupture" : "Faible"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="font-poppins text-xs text-dark/40 mt-2">
                  Stock total :{" "}
                  {sizeStock.reduce((sum, ss) => sum + ss.stock, 0)}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-background/40 shrink-0">
        {/* Section navigation */}
        <div className="flex items-center gap-1">
          {SECTIONS.map((s) => (
            <span
              key={s.key}
              className={`w-2 h-2 rounded-full transition-colors duration-150 ${
                section === s.key ? "bg-primary" : "bg-dark/10"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 font-poppins text-sm font-medium text-dark/60 hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-dark/10"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-primary text-white font-poppins text-sm font-medium hover:bg-primary/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          >
            {saving
              ? "Enregistrement…"
              : mode === "create"
                ? "Créer le produit"
                : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Outer Shell — manages overlay, visibility, escape                  */
/* ------------------------------------------------------------------ */

export default function ProductModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSave,
  saving,
  categories,
  getCategoryChildren,
}: ProductModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-100 flex items-center justify-center px-4 transition-all duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={mode === "create" ? "Nouveau produit" : "Modifier le produit"}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {isOpen && (
          <ProductFormInner
            key={`${isOpen}-${mode}-${initialData?.id ?? ""}`}
            mode={mode}
            initialData={initialData}
            onClose={onClose}
            onSave={onSave}
            saving={saving}
            categories={categories}
            getCategoryChildren={getCategoryChildren}
          />
        )}
      </div>
    </div>
  );
}
