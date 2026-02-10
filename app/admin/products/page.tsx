'use client';

import { useState, useCallback, useMemo } from 'react';
import ProductTable from '../component/products/ProductTable';
import ProductCard from '../component/products/ProductCard';
import ProductModal from '../component/products/ProductModal';
import DeleteProductModal from '../component/products/DeleteProductModal';
import Toast from '../component/shared/Toast';
import { useToast } from '../hooks/useToast';
import type { Product, ProductStatus } from '../component/products/ProductTable';

/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Robe Élégante Noire',
    description: 'Robe de soirée en soie noire, coupe ajustée.',
    sku: 'ROBE-ELG-001',
    categoryMere: 'Femme',
    categorySous: 'Vêtements',
    categoryFinale: 'Robes',
    price: 289,
    promoPrice: 229,
    stock: 24,
    status: 'active',
    images: ['/images/robe-1.jpg'],
    sizes: ['S', 'M', 'L'],
    colors: ['Noir'],
  },
  {
    id: '2',
    name: 'Chemise Lin Premium',
    description: 'Chemise en lin naturel, coupe décontractée.',
    sku: 'CHM-LIN-002',
    categoryMere: 'Homme',
    categorySous: 'Vêtements',
    categoryFinale: 'Chemises',
    price: 145,
    stock: 38,
    status: 'active',
    images: ['/images/chemise-1.jpg'],
    sizes: ['M', 'L', 'XL'],
    colors: ['Blanc', 'Beige'],
  },
  {
    id: '3',
    name: 'Sac Cuir Bordeaux',
    description: 'Sac à main en cuir véritable, finitions dorées.',
    sku: 'SAC-CUR-003',
    categoryMere: 'Femme',
    categorySous: 'Accessoires',
    categoryFinale: 'Sacs',
    price: 395,
    stock: 12,
    status: 'active',
    images: ['/images/sac-1.jpg'],
    sizes: [],
    colors: ['Rouge', 'Noir'],
  },
  {
    id: '4',
    name: 'Mocassins Daim Camel',
    description: 'Mocassins en daim souple, semelle cuir.',
    sku: 'MOC-DAI-004',
    categoryMere: 'Homme',
    categorySous: 'Chaussures',
    categoryFinale: 'Mocassins',
    price: 220,
    promoPrice: 175,
    stock: 8,
    status: 'active',
    images: ['/images/mocassin-1.jpg'],
    sizes: ['41', '42', '43', '44'],
    colors: ['Marron'],
  },
  {
    id: '5',
    name: 'Jupe Plussée Satinée',
    description: 'Jupe midi en satin, coupe plissée fluide.',
    sku: 'JUP-SAT-005',
    categoryMere: 'Femme',
    categorySous: 'Vêtements',
    categoryFinale: 'Jupes',
    price: 189,
    stock: 0,
    status: 'outofstock',
    images: [],
    sizes: ['XS', 'S', 'M'],
    colors: ['Beige', 'Noir'],
  },
  {
    id: '6',
    name: 'Pull Cachemire Col V',
    description: 'Pull en cachemire 100%, col V classique.',
    sku: 'PUL-CAS-006',
    categoryMere: 'Homme',
    categorySous: 'Vêtements',
    categoryFinale: 'Vestes',
    price: 310,
    stock: 15,
    status: 'draft',
    images: ['/images/pull-1.jpg'],
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Gris', 'Bleu'],
  },
  {
    id: '7',
    name: 'Bottines Cuir Chelsea',
    description: 'Bottines chelsea en cuir lisse, élastique latéral.',
    sku: 'BOT-CHL-007',
    categoryMere: 'Femme',
    categorySous: 'Chaussures',
    categoryFinale: 'Bottines',
    price: 265,
    stock: 3,
    status: 'active',
    images: ['/images/bottine-1.jpg'],
    sizes: ['37', '38', '39', '40'],
    colors: ['Noir'],
  },
  {
    id: '8',
    name: 'Montre Classique Or',
    description: 'Montre à quartz, bracelet cuir, cadran doré.',
    sku: 'MON-CLQ-008',
    categoryMere: 'Homme',
    categorySous: 'Accessoires',
    categoryFinale: 'Montres',
    price: 450,
    stock: 6,
    status: 'active',
    images: [],
    sizes: [],
    colors: [],
  },
  {
    id: '9',
    name: 'Combinaison Enfant Coton',
    description: 'Combinaison confortable en coton bio.',
    sku: 'CMB-ENF-009',
    categoryMere: 'Enfant',
    categorySous: 'Vêtements',
    categoryFinale: 'Combinaisons',
    price: 65,
    stock: 42,
    status: 'draft',
    images: ['/images/combi-1.jpg'],
    sizes: ['2A', '3A', '4A'],
    colors: ['Rose', 'Bleu'],
  },
  {
    id: '10',
    name: 'Bijou Collier Perles',
    description: 'Collier de perles d eau douce, fermoir argent.',
    sku: 'BIJ-COL-010',
    categoryMere: 'Femme',
    categorySous: 'Accessoires',
    categoryFinale: 'Bijoux',
    price: 180,
    promoPrice: 145,
    stock: 19,
    status: 'active',
    images: ['/images/collier-1.jpg'],
    sizes: [],
    colors: ['Blanc'],
  },
];

/* ------------------------------------------------------------------ */
/*  Filter State                                                       */
/* ------------------------------------------------------------------ */

type FilterStatus = 'all' | ProductStatus;

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  /* Filters */
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  /* Unique category parents for filter */
  const categoryOptions = useMemo(
    () => Array.from(new Set(products.map((p) => p.categoryMere))).sort(),
    [products],
  );

  /* Filtered products */
  const filtered = useMemo(() => {
    let result = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.categoryMere.toLowerCase().includes(q),
      );
    }
    if (filterCategory) {
      result = result.filter((p) => p.categoryMere === filterCategory);
    }
    if (filterStatus !== 'all') {
      result = result.filter((p) => p.status === filterStatus);
    }
    return result;
  }, [products, search, filterCategory, filterStatus]);

  /* Stats */
  const totalCount = products.length;
  const activeCount = products.filter((p) => p.status === 'active').length;
  const draftCount = products.filter((p) => p.status === 'draft').length;
  const oosCount = products.filter((p) => p.status === 'outofstock').length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;

  /* Handlers */
  const handleCreate = useCallback(() => {
    setEditingProduct(null);
    setModalMode('create');
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((product: Product) => {
    setEditingProduct(product);
    setModalMode('edit');
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback((product: Product) => {
    setDeleteTarget(product);
  }, []);

  const handleModalSave = useCallback(
    (data: Omit<Product, 'id'> & { id?: string }) => {
      if (modalMode === 'create') {
        const newProduct: Product = {
          ...data,
          id: `${Date.now()}`,
        } as Product;
        setProducts((prev) => [...prev, newProduct]);
        addToast('success', `Produit "${data.name}" créé avec succès`);
      } else if (editingProduct) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id ? { ...p, ...data, id: editingProduct.id } : p,
          ),
        );
        addToast('success', `Produit "${data.name}" modifié avec succès`);
      }
      setModalOpen(false);
      setEditingProduct(null);
    },
    [modalMode, editingProduct, addToast],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    addToast('success', `Produit "${deleteTarget.name}" supprimé`);
    setDeleteTarget(null);
  }, [deleteTarget, addToast]);

  const resetFilters = () => {
    setSearch('');
    setFilterCategory('');
    setFilterStatus('all');
  };

  const hasActiveFilters = search || filterCategory || filterStatus !== 'all';

  const selectClass =
    "px-3 py-2 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200 appearance-none bg-no-repeat bg-position-[right_0.75rem_center] bg-size-[1rem] bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2317171a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")] pr-9";

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-erotique text-3xl sm:text-4xl text-dark">Produits</h1>
          <p className="font-poppins text-sm text-dark/50 mt-1">
            Gérez votre catalogue de produits et leurs variantes.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-poppins text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 shrink-0 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
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
          <p className="font-poppins text-2xl font-bold text-dark">{totalCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Actifs
          </p>
          <p className="font-poppins text-2xl font-bold text-emerald-600">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Brouillons
          </p>
          <p className="font-poppins text-2xl font-bold text-amber-500">{draftCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1">
              Rupture
            </p>
            {lowStockCount > 0 && (
              <span className="font-poppins text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                {lowStockCount} faible{lowStockCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="font-poppins text-2xl font-bold text-red-500">{oosCount}</p>
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
          {categoryOptions.map((c) => (
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
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Réinitialiser
          </button>
        )}

        {/* Count badge */}
        <span className="ml-auto font-poppins text-xs text-dark/40">
          {filtered.length} produit{filtered.length !== 1 ? 's' : ''}
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                ? 'border-primary/30 bg-primary/5 text-primary'
                : 'border-gray-200 bg-white text-dark/40'
            }`}
            aria-label="Filtres"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>

        {/* Collapsible filters */}
        {mobileFiltersOpen && (
          <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-50">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={selectClass + ' w-full'}
            >
              <option value="">Toutes les catégories</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className={selectClass + ' w-full'}
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
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}

        {/* Count badge mobile */}
        <p className="font-poppins text-xs text-dark/40">
          {filtered.length} produit{filtered.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Product List — Desktop Table */}
      <ProductTable products={filtered} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Product List — Mobile Cards */}
      <ProductCard products={filtered} onEdit={handleEdit} onDelete={handleDelete} />

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
      />

      {/* Delete Confirm Modal */}
      <DeleteProductModal
        isOpen={!!deleteTarget}
        productName={deleteTarget?.name ?? ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
