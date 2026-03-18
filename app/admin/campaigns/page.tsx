/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useCallback, useEffect, FormEvent } from "react";
import DeleteConfirmModal from "../component/shared/DeleteConfirmModal";
import Toast from "../component/shared/Toast";
import { useToast } from "../hooks/useToast";
import { useAdminAuth } from "../context/AdminAuthContext";

/* ──────────────── Types ──────────────── */

interface CampaignProduct {
  name: string;
  slug: string;
  image: string;
  price: number;
  promoPrice?: number;
}

interface CampaignCollection {
  name: string;
  slug: string;
  image: string;
}

interface Campaign {
  id: string;
  subject: string;
  type: string;
  heading: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  products: CampaignProduct[];
  collections: CampaignCollection[];
  status: "draft" | "sent";
  sentAt: string | null;
  sentCount: number;
  createdAt: string;
}

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  images: { url: string }[];
  price: number;
  promoPrice?: number;
}

interface SearchCollection {
  id: string;
  name: string;
  slug: string;
  image: string;
}

const TYPES = [
  { value: "promotion", label: "Promotion" },
  { value: "new_arrival", label: "Nouveautés" },
  { value: "collection", label: "Nouvelle Collection" },
  { value: "announcement", label: "Annonce" },
  { value: "custom", label: "Personnalisé" },
];

const API = "/api/admin/campaigns";

/* ──────────────── API helper ──────────────── */

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

/* ──────────────── Page ──────────────── */

export default function CampaignsPage() {
  const { canWrite } = useAdminAuth();
  const { toasts, addToast, removeToast } = useToast();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  /* Form modal */
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSubject, setFormSubject] = useState("");
  const [formType, setFormType] = useState("custom");
  const [formHeading, setFormHeading] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formCtaText, setFormCtaText] = useState("Découvrir");
  const [formCtaUrl, setFormCtaUrl] = useState("");
  const [formProducts, setFormProducts] = useState<CampaignProduct[]>([]);
  const [formCollections, setFormCollections] = useState<CampaignCollection[]>(
    [],
  );
  const [saving, setSaving] = useState(false);

  /* Product search */
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<SearchProduct[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  /* Collection search */
  const [collectionSearch, setCollectionSearch] = useState("");
  const [collectionResults, setCollectionResults] = useState<
    SearchCollection[]
  >([]);
  const [searchingCollections, setSearchingCollections] = useState(false);

  /* Modals */
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const [sendTarget, setSendTarget] = useState<Campaign | null>(null);
  const [sending, setSending] = useState(false);

  /* ── Fetch campaigns ── */

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    params.set("page", String(page));
    params.set("limit", String(limit));

    const result = await apiFetch<{ campaigns: Campaign[]; total: number }>(
      `${API}?${params.toString()}`,
    );
    if (result.ok && result.data) {
      setCampaigns(result.data.campaigns);
      setTotal(result.data.total);
    } else {
      addToast("error", result.error ?? "Erreur de chargement.");
    }
    setLoading(false);
  }, [filterStatus, page, addToast]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    setPage(1);
  }, [filterStatus]);

  /* ── Product search ── */

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) {
      setProductResults([]);
      return;
    }
    setSearchingProducts(true);
    const result = await apiFetch<{ products: SearchProduct[] }>(
      `/api/admin/products?search=${encodeURIComponent(q.trim())}&limit=8&status=active`,
    );
    if (result.ok && result.data) {
      setProductResults(result.data.products);
    }
    setSearchingProducts(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchProducts(productSearch), 300);
    return () => clearTimeout(t);
  }, [productSearch, searchProducts]);

  /* ── Collection search ── */

  const searchCollections = useCallback(async (q: string) => {
    if (!q.trim()) {
      setCollectionResults([]);
      return;
    }
    setSearchingCollections(true);
    const result = await apiFetch<{ collections: SearchCollection[] }>(
      `/api/admin/collections?search=${encodeURIComponent(q.trim())}&status=active`,
    );
    if (result.ok && result.data) {
      setCollectionResults(result.data.collections);
    }
    setSearchingCollections(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchCollections(collectionSearch), 300);
    return () => clearTimeout(t);
  }, [collectionSearch, searchCollections]);

  /* ── Form helpers ── */

  const resetForm = useCallback(() => {
    setEditingId(null);
    setFormSubject("");
    setFormType("custom");
    setFormHeading("");
    setFormBody("");
    setFormCtaText("Découvrir");
    setFormCtaUrl("");
    setFormProducts([]);
    setFormCollections([]);
    setProductSearch("");
    setProductResults([]);
    setCollectionSearch("");
    setCollectionResults([]);
  }, []);

  const openCreate = useCallback(() => {
    resetForm();
    setShowForm(true);
  }, [resetForm]);

  const openEdit = useCallback((c: Campaign) => {
    setEditingId(c.id);
    setFormSubject(c.subject);
    setFormType(c.type);
    setFormHeading(c.heading);
    setFormBody(c.body);
    setFormCtaText(c.ctaText);
    setFormCtaUrl(c.ctaUrl);
    setFormProducts(c.products);
    setFormCollections(c.collections ?? []);
    setProductSearch("");
    setProductResults([]);
    setCollectionSearch("");
    setCollectionResults([]);
    setShowForm(true);
  }, []);

  const addProduct = useCallback(
    (p: SearchProduct) => {
      if (formProducts.length >= 6) return;
      if (formProducts.some((fp) => fp.slug === p.slug)) return;
      setFormProducts((prev) => [
        ...prev,
        {
          name: p.name,
          slug: p.slug,
          image: p.images?.[0]?.url || "",
          price: p.price,
          promoPrice: p.promoPrice,
        },
      ]);
      setProductSearch("");
      setProductResults([]);
    },
    [formProducts],
  );

  const removeProduct = useCallback((slug: string) => {
    setFormProducts((prev) => prev.filter((p) => p.slug !== slug));
  }, []);

  const addCollection = useCallback(
    (c: SearchCollection) => {
      if (formCollections.length >= 6) return;
      if (formCollections.some((fc) => fc.slug === c.slug)) return;
      setFormCollections((prev) => [
        ...prev,
        { name: c.name, slug: c.slug, image: c.image || "" },
      ]);
      setCollectionSearch("");
      setCollectionResults([]);
    },
    [formCollections],
  );

  const removeCollection = useCallback((slug: string) => {
    setFormCollections((prev) => prev.filter((c) => c.slug !== slug));
  }, []);

  /* ── Save campaign ── */

  const handleSave = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!formSubject.trim()) {
        addToast("error", "Le sujet est requis.");
        return;
      }
      setSaving(true);

      const payload = {
        subject: formSubject,
        type: formType,
        heading: formHeading,
        body: formBody,
        ctaText: formCtaText,
        ctaUrl: formCtaUrl,
        products: formProducts,
        collections: formCollections,
      };

      const result = editingId
        ? await apiFetch<{ campaign: Campaign }>(`${API}/${editingId}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await apiFetch<{ campaign: Campaign }>(API, {
            method: "POST",
            body: JSON.stringify(payload),
          });

      if (result.ok) {
        addToast(
          "success",
          editingId ? "Campagne mise à jour." : "Campagne créée.",
        );
        setShowForm(false);
        resetForm();
        await fetchCampaigns();
      } else {
        addToast("error", result.error ?? "Erreur.");
      }
      setSaving(false);
    },
    [
      formSubject,
      formType,
      formHeading,
      formBody,
      formCtaText,
      formCtaUrl,
      formProducts,
      formCollections,
      editingId,
      addToast,
      resetForm,
      fetchCampaigns,
    ],
  );

  /* ── Delete ── */

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const result = await apiFetch(`${API}/${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (result.ok) {
      addToast("success", "Campagne supprimée.");
      await fetchCampaigns();
    } else {
      addToast("error", result.error ?? "Erreur.");
    }
    setDeleteTarget(null);
  }, [deleteTarget, addToast, fetchCampaigns]);

  /* ── Send ── */

  const handleConfirmSend = useCallback(async () => {
    if (!sendTarget) return;
    setSending(true);
    const result = await apiFetch<{ sentCount: number }>(
      `${API}/${sendTarget.id}/send`,
      { method: "POST" },
    );
    if (result.ok && result.data) {
      addToast(
        "success",
        `Campagne envoyée à ${result.data.sentCount} abonné(s).`,
      );
      await fetchCampaigns();
    } else {
      addToast("error", result.error ?? "Erreur lors de l'envoi.");
    }
    setSending(false);
    setSendTarget(null);
  }, [sendTarget, addToast, fetchCampaigns]);

  /* ── Helpers ── */

  const totalPages = Math.ceil(total / limit);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const typeLabel = (t: string) => TYPES.find((x) => x.value === t)?.label ?? t;

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-erotique text-3xl sm:text-4xl text-dark">
            Campagnes
          </h1>
          <p className="font-poppins text-sm text-dark/50 mt-1">
            Créez et envoyez des newsletters à vos abonnés
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-poppins text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 shrink-0 self-start sm:self-auto"
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Nouvelle campagne
          </button>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 mb-6">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
        >
          <option value="">Tous</option>
          <option value="draft">Brouillons</option>
          <option value="sent">Envoyées</option>
        </select>
        <span className="ml-auto font-poppins text-xs text-dark/40">
          {total} campagne{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Campaign list ── */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg
              className="w-8 h-8 animate-spin text-primary"
              viewBox="0 0 24 24"
              fill="none"
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
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-20 text-dark/40">
            <svg
              className="w-12 h-12 mb-4 opacity-30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
            <p className="font-poppins text-sm">Aucune campagne trouvée.</p>
          </div>
        ) : (
          campaigns.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                {/* Left */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-poppins text-xs font-medium ${
                        c.status === "draft"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {c.status === "draft" ? "Brouillon" : "Envoyée"}
                    </span>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 bg-gray-100 text-dark/60 font-poppins text-xs font-medium">
                      {typeLabel(c.type)}
                    </span>
                  </div>
                  <h3 className="font-poppins text-base font-semibold text-dark truncate">
                    {c.subject}
                  </h3>
                  {c.heading && (
                    <p className="font-poppins text-sm text-dark/50 mt-0.5 truncate">
                      {c.heading}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 font-poppins text-xs text-dark/40">
                    <span>Créée le {formatDate(c.createdAt)}</span>
                    {c.sentAt && <span>Envoyée le {formatDate(c.sentAt)}</span>}
                    {c.sentCount > 0 && (
                      <span className="text-primary font-medium">
                        {c.sentCount} envoi{c.sentCount > 1 ? "s" : ""}
                      </span>
                    )}
                    {c.products.length > 0 && (
                      <span>
                        {c.products.length} produit
                        {c.products.length > 1 ? "s" : ""}
                      </span>
                    )}
                    {c.collections?.length > 0 && (
                      <span>
                        {c.collections.length} collection
                        {c.collections.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {canWrite && (
                  <div className="flex items-center gap-2 shrink-0">
                    {c.status === "draft" && (
                      <>
                        <button
                          onClick={() => openEdit(c)}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 font-poppins text-xs text-dark hover:bg-gray-50 transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => setSendTarget(c)}
                          className="px-3 py-1.5 rounded-lg bg-primary text-white font-poppins text-xs font-medium hover:bg-primary/90 transition-colors"
                        >
                          Envoyer
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setDeleteTarget(c)}
                      className="p-1.5 rounded-lg text-dark/40 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Supprimer"
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded-lg border border-gray-200 font-poppins text-sm text-dark hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <span className="font-poppins text-sm text-dark/50">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-200 font-poppins text-sm text-dark hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          Create / Edit Modal
          ════════════════════════════════════════════════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 bg-black/40 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-poppins text-lg font-semibold text-dark">
                {editingId ? "Modifier la campagne" : "Nouvelle campagne"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="p-1.5 rounded-lg text-dark/40 hover:text-dark hover:bg-gray-100 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Subject */}
              <div>
                <label className="block font-poppins text-xs font-semibold text-dark/50 uppercase tracking-wider mb-1.5">
                  Sujet de l&apos;email *
                </label>
                <input
                  type="text"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  placeholder="ex: Nouvelle collection printemps 2026"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block font-poppins text-xs font-semibold text-dark/50 uppercase tracking-wider mb-1.5">
                  Type
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                >
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Heading */}
              <div>
                <label className="block font-poppins text-xs font-semibold text-dark/50 uppercase tracking-wider mb-1.5">
                  Titre dans l&apos;email
                </label>
                <input
                  type="text"
                  value={formHeading}
                  onChange={(e) => setFormHeading(e.target.value)}
                  placeholder="ex: Découvrez nos dernières pièces"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block font-poppins text-xs font-semibold text-dark/50 uppercase tracking-wider mb-1.5">
                  Contenu
                </label>
                <textarea
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  rows={4}
                  placeholder="Le message de votre newsletter…"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-y"
                />
              </div>

              {/* CTA */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-poppins text-xs font-semibold text-dark/50 uppercase tracking-wider mb-1.5">
                    Texte du bouton
                  </label>
                  <input
                    type="text"
                    value={formCtaText}
                    onChange={(e) => setFormCtaText(e.target.value)}
                    placeholder="Découvrir"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block font-poppins text-xs font-semibold text-dark/50 uppercase tracking-wider mb-1.5">
                    Lien du bouton
                  </label>
                  <input
                    type="text"
                    value={formCtaUrl}
                    onChange={(e) => setFormCtaUrl(e.target.value)}
                    placeholder="/collections/printemps"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>

              {/* Products */}
              <div>
                <label className="block font-poppins text-xs font-semibold text-dark/50 uppercase tracking-wider mb-1.5">
                  Produits ({formProducts.length}/6)
                </label>

                {/* Selected products */}
                {formProducts.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formProducts.map((p) => (
                      <div
                        key={p.slug}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        {p.image && (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <span className="font-poppins text-xs text-dark max-w-32 truncate">
                          {p.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeProduct(p.slug)}
                          className="text-dark/30 hover:text-red-500 transition-colors"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search */}
                {formProducts.length < 6 && (
                  <div className="relative">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Rechercher un produit…"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                    {searchingProducts && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg
                          className="w-4 h-4 animate-spin text-primary"
                          viewBox="0 0 24 24"
                          fill="none"
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
                            d="M4 12a8 8 0 018-8v8H4z"
                          />
                        </svg>
                      </div>
                    )}
                    {productResults.length > 0 && (
                      <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                        {productResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => addProduct(p)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                          >
                            {p.images?.[0]?.url && (
                              <img
                                src={p.images[0].url}
                                alt={p.name}
                                className="w-10 h-10 rounded object-cover shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-poppins text-sm text-dark truncate">
                                {p.name}
                              </p>
                              <p className="font-poppins text-xs text-dark/40">
                                {p.price.toFixed(3)} TND
                                {p.promoPrice
                                  ? ` → ${p.promoPrice.toFixed(3)} TND`
                                  : ""}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Collections */}
              <div>
                <label className="block font-poppins text-xs font-semibold text-dark/50 uppercase tracking-wider mb-1.5">
                  Collections ({formCollections.length}/6)
                </label>

                {/* Selected collections */}
                {formCollections.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formCollections.map((c) => (
                      <div
                        key={c.slug}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg"
                      >
                        {c.image && (
                          <img
                            src={c.image}
                            alt={c.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <span className="font-poppins text-xs text-dark max-w-32 truncate">
                          {c.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeCollection(c.slug)}
                          className="text-dark/30 hover:text-red-500 transition-colors"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search */}
                {formCollections.length < 6 && (
                  <div className="relative">
                    <input
                      type="text"
                      value={collectionSearch}
                      onChange={(e) => setCollectionSearch(e.target.value)}
                      placeholder="Rechercher une collection…"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                    {searchingCollections && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg
                          className="w-4 h-4 animate-spin text-primary"
                          viewBox="0 0 24 24"
                          fill="none"
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
                            d="M4 12a8 8 0 018-8v8H4z"
                          />
                        </svg>
                      </div>
                    )}
                    {collectionResults.length > 0 && (
                      <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                        {collectionResults.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => addCollection(c)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                          >
                            {c.image && (
                              <img
                                src={c.image}
                                alt={c.name}
                                className="w-10 h-10 rounded object-cover shrink-0"
                              />
                            )}
                            <p className="font-poppins text-sm text-dark truncate flex-1 min-w-0">
                              {c.name}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 rounded-lg border border-gray-200 font-poppins text-sm text-dark hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg bg-primary text-white font-poppins text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving
                    ? "Enregistrement…"
                    : editingId
                      ? "Mettre à jour"
                      : "Créer la campagne"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          Send Confirmation Modal
          ════════════════════════════════════════════════ */}
      {sendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg
                className="w-6 h-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </div>
            <h3 className="font-poppins text-lg font-semibold text-dark mb-2">
              Envoyer la campagne ?
            </h3>
            <p className="font-poppins text-sm text-dark/50 mb-6">
              <strong>&ldquo;{sendTarget.subject}&rdquo;</strong> sera envoyée à
              tous les clients (inscrits et non inscrits à la newsletter). Cette
              action est irréversible.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setSendTarget(null)}
                disabled={sending}
                className="px-5 py-2.5 rounded-lg border border-gray-200 font-poppins text-sm text-dark hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmSend}
                disabled={sending}
                className="px-5 py-2.5 rounded-lg bg-primary text-white font-poppins text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {sending ? "Envoi en cours…" : "Confirmer l'envoi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        categoryName={deleteTarget?.subject ?? ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
