/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type CollectionStatus = "active" | "hidden";

export interface CollectionFormData {
  name: string;
  description: string;
  image: string;
  products: string[];
  status: CollectionStatus;
  order: number;
}

interface ProductOption {
  id: string;
  name: string;
  image: string;
  price: number;
  sku: string;
}

interface CollectionModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData?: CollectionFormData;
  onCancel: () => void;
  onSave: (data: CollectionFormData) => void;
  saving?: boolean;
}

const emptyForm: CollectionFormData = {
  name: "",
  description: "",
  image: "",
  products: [],
  status: "active",
  order: 0,
};

export default function CollectionModal({
  isOpen,
  mode,
  initialData,
  onCancel,
  onSave,
  saving,
}: CollectionModalProps) {
  const formKey = `${isOpen}-${mode}-${initialData?.name ?? ""}`;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onCancel]);

  return (
    <div
      className={`fixed inset-0 z-90 flex items-center justify-center px-4 transition-all duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={
        mode === "create" ? "Créer une collection" : "Modifier la collection"
      }
    >
      <div
        className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div
        className={`relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto transition-all duration-300 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {isOpen && (
          <CollectionFormInner
            key={formKey}
            mode={mode}
            initialData={initialData}
            onCancel={onCancel}
            onSave={onSave}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}

function CollectionFormInner({
  mode,
  initialData,
  onCancel,
  onSave,
  saving,
}: Omit<CollectionModalProps, "isOpen">) {
  const [form, setForm] = useState<CollectionFormData>(
    initialData ?? emptyForm,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  /* ── Product picker state ── */
  const [allProducts, setAllProducts] = useState<ProductOption[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => nameRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  /* ── Fetch products for picker ── */
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await fetch("/api/admin/products?limit=200");
      if (res.ok) {
        const json = await res.json();
        setAllProducts(
          (json.products ?? []).map(
            (p: {
              id: string;
              name: string;
              images: { url: string }[];
              price: number;
              sku: string;
            }) => ({
              id: p.id,
              name: p.name,
              image: p.images?.[0]?.url ?? "",
              price: p.price,
              sku: p.sku,
            }),
          ),
        );
      }
    } catch {
      /* silent */
    }
    setProductsLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("images", files[0]);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (res.ok && json.urls?.[0]) {
        setForm((prev) => ({ ...prev, image: json.urls[0] }));
      }
    } catch {
      /* silent */
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const filteredProducts = allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()),
  );

  const toggleProduct = (productId: string) => {
    setForm((prev) => ({
      ...prev,
      products: prev.products.includes(productId)
        ? prev.products.filter((id) => id !== productId)
        : [...prev.products, productId],
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Le nom est requis";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSave(form);
  };

  const selectedProducts = allProducts.filter((p) =>
    form.products.includes(p.id),
  );

  return (
    <>
      <div className="flex items-center justify-between px-6 pt-6 sm:px-8 sm:pt-8">
        <h2 className="font-erotique text-2xl text-dark">
          {mode === "create"
            ? "Créer une collection"
            : "Modifier la collection"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-lg hover:bg-dark/5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-dark/10"
          aria-label="Fermer"
        >
          <svg
            className="w-5 h-5 text-dark/50"
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

      <form
        onSubmit={handleSubmit}
        className="p-6 sm:p-8 pt-5 sm:pt-6 space-y-5"
      >
        {/* Name */}
        <div>
          <label
            htmlFor="col-name"
            className="block font-poppins text-sm font-medium text-dark mb-1.5"
          >
            Nom de la collection *
          </label>
          <input
            ref={nameRef}
            id="col-name"
            type="text"
            value={form.name}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, name: e.target.value }));
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            aria-required="true"
            aria-invalid={!!errors.name}
            className={`w-full font-poppins px-4 py-2.5 rounded-lg border text-sm text-dark placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 ${
              errors.name
                ? "border-red-400 focus:ring-red-200"
                : "border-gray-300 focus:border-primary focus:ring-primary/20"
            }`}
            placeholder="ex: Collection Été 2026"
          />
          {errors.name && (
            <p className="font-poppins text-xs text-red-500 mt-1">
              {errors.name}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="col-desc"
            className="block font-poppins text-sm font-medium text-dark mb-1.5"
          >
            Description
          </label>
          <textarea
            id="col-desc"
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
            rows={3}
            className="w-full font-poppins px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-dark placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 resize-none"
            placeholder="Description de la collection..."
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block font-poppins text-sm font-medium text-dark mb-1.5">
            Image
          </label>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            className="hidden"
            onChange={(e) => handleImageUpload(e.target.files)}
          />
          <div className="flex items-center gap-3">
            {form.image && (
              <div className="relative shrink-0">
                <img
                  src={form.image}
                  alt="Aperçu"
                  className="w-20 h-20 rounded-lg object-cover bg-dark/5"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, image: "" }))}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm"
                  aria-label="Supprimer l'image"
                >
                  <svg
                    className="w-3 h-3 text-dark/50"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-gray-300 hover:border-primary/50 hover:bg-primary/2 font-poppins text-sm text-dark/60 hover:text-primary transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            >
              {uploading ? (
                <svg
                  className="w-4 h-4 animate-spin"
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
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              )}
              {uploading
                ? "Envoi en cours..."
                : form.image
                  ? "Changer l'image"
                  : "Téléverser une image"}
            </button>
          </div>
        </div>

        {/* Order */}
        <div>
          <label
            htmlFor="col-order"
            className="block font-poppins text-sm font-medium text-dark mb-1.5"
          >
            Ordre d&apos;affichage
          </label>
          <input
            id="col-order"
            type="number"
            min={0}
            value={form.order}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                order: parseInt(e.target.value, 10) || 0,
              }))
            }
            className="w-full font-poppins px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-dark placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block font-poppins text-sm font-medium text-dark mb-2">
            Statut
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.status === "active"}
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  status: prev.status === "active" ? "hidden" : "active",
                }))
              }
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                form.status === "active" ? "bg-primary" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  form.status === "active" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="font-poppins text-sm text-dark/70">
              {form.status === "active" ? "Active" : "Masquée"}
            </span>
          </div>
        </div>

        {/* Product Picker */}
        <div>
          <label className="block font-poppins text-sm font-medium text-dark mb-1.5">
            Produits ({form.products.length} sélectionné
            {form.products.length !== 1 ? "s" : ""})
          </label>

          {/* Selected products */}
          {selectedProducts.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedProducts.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 bg-primary/10 text-primary font-poppins text-xs font-medium px-2.5 py-1 rounded-full"
                >
                  {p.name}
                  <button
                    type="button"
                    onClick={() => toggleProduct(p.id)}
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                    aria-label={`Retirer ${p.name}`}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search */}
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="w-full font-poppins px-4 py-2 rounded-lg border border-gray-300 text-sm text-dark placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 mb-2"
            placeholder="Rechercher un produit..."
          />

          {/* Product list */}
          <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
            {productsLoading ? (
              <div className="p-4 text-center">
                <div className="inline-block w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <p className="p-4 text-center font-poppins text-xs text-dark/40">
                Aucun produit trouvé.
              </p>
            ) : (
              filteredProducts.map((product) => {
                const isSelected = form.products.includes(product.id);
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => toggleProduct(product.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors duration-150 border-b border-gray-100 last:border-0 ${
                      isSelected ? "bg-primary/5" : "hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors duration-150 ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3 text-white"
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
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-8 h-8 rounded object-cover bg-dark/5"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-dark/5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-poppins text-sm text-dark truncate">
                        {product.name}
                      </p>
                      <p className="font-poppins text-xs text-dark/40">
                        {product.sku} — {product.price.toFixed(3)} DT
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 font-poppins text-sm font-medium text-dark hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-dark/10"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white font-poppins text-sm font-medium hover:bg-primary/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving
              ? "Enregistrement..."
              : mode === "create"
                ? "Créer"
                : "Enregistrer"}
          </button>
        </div>
      </form>
    </>
  );
}
