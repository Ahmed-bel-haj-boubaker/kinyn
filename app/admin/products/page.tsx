/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import ProductTable from "../component/products/ProductTable";
import ProductCard from "../component/products/ProductCard";
import ProductModal from "../component/products/ProductModal";
import DeleteProductModal from "../component/products/DeleteProductModal";
import Toast from "../component/shared/Toast";
import { useToast } from "../hooks/useToast";
import type {
  Product,
  ProductStatus,
} from "../component/products/ProductTable";

/* ──────────── API helpers ──────────── */

const PRODUCTS_API = "/api/admin/products";
const CATEGORIES_API = "/api/admin/categories";

async function apiFetch<T>(
  url: string,
  opts?: RequestInit,
): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...opts,
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error ?? "Erreur serveur." };
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, error: "Erreur réseau." };
  }
}

/* ──────────── Category types ──────────── */

interface RawCategory {
  id: string;
  name: string;
  level: string;
  parent: string | null;
  status: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

/* ──────────── API Response types ──────────── */

interface APIProductListResponse {
  products: Product[];
  total: number;
  stats: {
    total: number;
    active: number;
    draft: number;
    outofstock: number;
    lowStock: number;
  } | null;
}

interface APICategoryListResponse {
  categories: RawCategory[];
  total: number;
}

/* ──────────── Filter State ──────────── */

type FilterStatus = "all" | ProductStatus;

/* ──────────── Page Component ──────────── */

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
    outofstock: 0,
    lowStock: 0,
  });
  const [allCategories, setAllCategories] = useState<RawCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  /* Filters */
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  /* ── Derived: mere categories for modal & filters ── */

  const mereCategories = useMemo<CategoryOption[]>(
    () =>
      allCategories
        .filter((c) => c.level === "mere" && c.status === "active")
        .map((c) => ({ id: c.id, name: c.name })),
    [allCategories],
  );

  const getCategoryChildren = useCallback(
    (parentId: string): CategoryOption[] =>
      allCategories
        .filter((c) => c.parent === parentId && c.status === "active")
        .map((c) => ({ id: c.id, name: c.name })),
    [allCategories],
  );

  /* Filter category options from products (resolved names) */
  const categoryFilterOptions = useMemo(
    () => Array.from(new Set(products.map((p) => p.categoryMereName))).sort(),
    [products],
  );

  /* ── Fetch products from API ── */

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const result = await apiFetch<APIProductListResponse>(PRODUCTS_API);
    if (result.ok && result.data) {
      setProducts(result.data.products);
      if (result.data.stats) {
        setStats(result.data.stats);
      }
    } else {
      addToast(
        "error",
        result.error ?? "Erreur lors du chargement des produits.",
      );
    }
    setLoading(false);
  }, [addToast]);

  /* ── Fetch categories from API ── */

  const fetchCategories = useCallback(async () => {
    const result = await apiFetch<APICategoryListResponse>(CATEGORIES_API);
    if (result.ok && result.data) {
      setAllCategories(result.data.categories);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  /* Filtered products */
  const filtered = useMemo(() => {
    let result = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.categoryMereName.toLowerCase().includes(q),
      );
    }
    if (filterCategory) {
      result = result.filter((p) => p.categoryMereName === filterCategory);
    }
    if (filterStatus !== "all") {
      result = result.filter((p) => p.status === filterStatus);
    }
    return result;
  }, [products, search, filterCategory, filterStatus]);

  /* Handlers */
  const handleCreate = useCallback(() => {
    setEditingProduct(null);
    setModalMode("create");
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product);
    setModalMode("edit");
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback((product: Product) => {
    setDeleteTarget(product);
  }, []);

  const handleModalSave = useCallback(
    async (data: Omit<Product, "id"> & { id?: string }) => {
      setSaving(true);
      try {
        if (modalMode === "create") {
          const result = await apiFetch<{ product: Product }>(PRODUCTS_API, {
            method: "POST",
            body: JSON.stringify({
              name: data.name,
              description: data.description,
              sku: data.sku,
              categoryMere: data.categoryMere,
              categorySous: data.categorySous,
              categoryFinale: data.categoryFinale,
              price: data.price,
              promoPrice: data.promoPrice,
              stock: data.stock,
              status: data.status,
              images: data.images,
              sizes: data.sizes,
              colors: data.colors,
            }),
          });
          if (result.ok) {
            addToast("success", `Produit "${data.name}" créé avec succès`);
            await fetchProducts();
          } else {
            addToast("error", result.error ?? "Erreur lors de la création.");
          }
        } else if (editingProduct) {
          const result = await apiFetch<{ product: Product }>(
            `${PRODUCTS_API}/${editingProduct.id}`,
            {
              method: "PUT",
              body: JSON.stringify({
                name: data.name,
                description: data.description,
                sku: data.sku,
                categoryMere: data.categoryMere,
                categorySous: data.categorySous,
                categoryFinale: data.categoryFinale,
                price: data.price,
                promoPrice: data.promoPrice,
                stock: data.stock,
                status: data.status,
                images: data.images,
                sizes: data.sizes,
                colors: data.colors,
              }),
            },
          );
          if (result.ok) {
            addToast("success", `Produit "${data.name}" modifié avec succès`);
            await fetchProducts();
          } else {
            addToast(
              "error",
              result.error ?? "Erreur lors de la modification.",
            );
          }
        }
      } finally {
        setSaving(false);
        setModalOpen(false);
        setEditingProduct(null);
      }
    },
    [modalMode, editingProduct, addToast, fetchProducts],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const result = await apiFetch<{ deletedId: string }>(
        `${PRODUCTS_API}/${deleteTarget.id}`,
        { method: "DELETE" },
      );
      if (result.ok) {
        addToast("success", `Produit "${deleteTarget.name}" supprimé`);
        await fetchProducts();
      } else {
        addToast("error", result.error ?? "Erreur lors de la suppression.");
      }
    } finally {
      setSaving(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, addToast, fetchProducts]);

  const resetFilters = () => {
    setSearch("");
    setFilterCategory("");
    setFilterStatus("all");
  };

  const hasActiveFilters = search || filterCategory || filterStatus !== "all";

  const selectClass =
    "px-3 py-2 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200 appearance-none bg-no-repeat bg-position-[right_0.75rem_center] bg-size-[1rem] bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2317171a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")] pr-9";

  /* Loading state */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="w-8 h-8 text-primary animate-spin"
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
          <p className="font-poppins text-sm text-dark/40">
            Chargement des produits…
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-erotique text-3xl sm:text-4xl text-dark">
            Produits
          </h1>
          <p className="font-poppins text-sm text-dark/50 mt-1">
            Gérez votre catalogue de produits et leurs variantes.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-poppins text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 shrink-0 self-start sm:self-auto"
        >
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Ajouter un produit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Total
          </p>
          <p className="font-poppins text-2xl font-bold text-dark">
            {stats.total}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Actifs
          </p>
          <p className="font-poppins text-2xl font-bold text-emerald-600">
            {stats.active}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Brouillons
          </p>
          <p className="font-poppins text-2xl font-bold text-amber-500">
            {stats.draft}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1">
              Rupture
            </p>
            {stats.lowStock > 0 && (
              <span className="font-poppins text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                {stats.lowStock} faible{stats.lowStock > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="font-poppins text-2xl font-bold text-red-500">
            {stats.outofstock}
          </p>
        </div>
      </div>

      {/* Filters — Desktop */}
      <div className="hidden md:flex items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit…"
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200"
          />
        </div>

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className={selectClass}
        >
          <option value="">Toutes les catégories</option>
          {categoryFilterOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className={selectClass}
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="draft">Brouillon</option>
          <option value="outofstock">Rupture</option>
        </select>

        {/* Reset */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-dark/40 hover:text-dark/60 hover:bg-dark/5 font-poppins text-sm transition-colors duration-150 focus:outline-none"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Réinitialiser
          </button>
        )}

        {/* Count badge */}
        <span className="ml-auto font-poppins text-xs text-dark/40">
          {filtered.length} produit{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Filters — Mobile */}
      <div className="md:hidden mb-6 space-y-3">
        {/* Search + toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200"
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className={`p-2 rounded-xl border transition-colors duration-150 focus:outline-none ${
              mobileFiltersOpen || hasActiveFilters
                ? "border-primary/30 bg-primary/5 text-primary"
                : "border-gray-200 bg-white text-dark/40"
            }`}
            aria-label="Filtres"
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
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </button>
        </div>

        {/* Collapsible filters */}
        {mobileFiltersOpen && (
          <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-50">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={selectClass + " w-full"}
            >
              <option value="">Toutes les catégories</option>
              {categoryFilterOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className={selectClass + " w-full"}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="draft">Brouillon</option>
              <option value="outofstock">Rupture</option>
            </select>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-dark/40 hover:text-dark/60 bg-dark/5 font-poppins text-sm transition-colors duration-150 focus:outline-none"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}

        {/* Count badge mobile */}
        <p className="font-poppins text-xs text-dark/40">
          {filtered.length} produit{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Product List — Desktop Table */}
      <ProductTable
        products={filtered}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Product List — Mobile Cards */}
      <ProductCard
        products={filtered}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Product Modal */}
      <ProductModal
        isOpen={modalOpen}
        mode={modalMode}
        initialData={editingProduct}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleModalSave}
        saving={saving}
        categories={mereCategories}
        getCategoryChildren={getCategoryChildren}
      />

      {/* Delete Confirm Modal */}
      <DeleteProductModal
        isOpen={!!deleteTarget}
        productName={deleteTarget?.name ?? ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
