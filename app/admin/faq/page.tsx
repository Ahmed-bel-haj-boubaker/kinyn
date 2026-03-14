/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useCallback, useEffect } from "react";
import FAQModal from "../component/faq/FAQModal";
import DeleteConfirmModal from "../component/shared/DeleteConfirmModal";
import Toast from "../component/shared/Toast";
import { useToast } from "../hooks/useToast";
import { useAdminAuth } from "../context/AdminAuthContext";
import type { FAQFormData } from "../component/faq/FAQModal";
import type { FAQStatus } from "@/models/FAQ";

/* ──────────────── Types ──────────────── */

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  status: FAQStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/* ──────────────── API helper ──────────────── */

const API_BASE = "/api/admin/faq";

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

interface APIListResponse {
  faqs: FAQ[];
  total: number;
  categories: string[];
}

export default function FAQPage() {
  const { canWrite } = useAdminAuth();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* Filters */
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  /* Modals */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FAQ | null>(null);

  const { toasts, addToast, removeToast } = useToast();

  /* ── Fetch ── */

  const fetchFAQs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (filterCategory) params.set("category", filterCategory);
    if (filterStatus) params.set("status", filterStatus);

    const result = await apiFetch<APIListResponse>(
      `${API_BASE}?${params.toString()}`,
    );

    if (result.ok && result.data) {
      setFaqs(result.data.faqs);
      setTotal(result.data.total);
      setCategories(result.data.categories ?? []);
    } else {
      addToast("error", result.error ?? "Impossible de charger les FAQs.");
    }
    setLoading(false);
  }, [search, filterCategory, filterStatus, addToast]);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  /* ── Handlers ── */

  const handleCreate = useCallback(() => {
    setEditingFAQ(null);
    setModalMode("create");
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((faq: FAQ) => {
    setEditingFAQ(faq);
    setModalMode("edit");
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback((faq: FAQ) => {
    setDeleteTarget(faq);
  }, []);

  const handleModalSave = useCallback(
    async (data: FAQFormData) => {
      setSaving(true);

      if (modalMode === "create") {
        const result = await apiFetch<{ faq: FAQ }>(API_BASE, {
          method: "POST",
          body: JSON.stringify(data),
        });

        if (result.ok) {
          addToast("success", "FAQ créée avec succès.");
          await fetchFAQs();
        } else {
          addToast("error", result.error ?? "Erreur lors de la création.");
        }
      } else if (editingFAQ) {
        const result = await apiFetch<{ faq: FAQ }>(
          `${API_BASE}/${editingFAQ.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(data),
          },
        );

        if (result.ok) {
          addToast("success", "FAQ mise à jour avec succès.");
          await fetchFAQs();
        } else {
          addToast("error", result.error ?? "Erreur lors de la modification.");
        }
      }

      setSaving(false);
      setModalOpen(false);
      setEditingFAQ(null);
    },
    [modalMode, editingFAQ, addToast, fetchFAQs],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const result = await apiFetch(`${API_BASE}/${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (result.ok) {
      addToast("success", "FAQ supprimée.");
      await fetchFAQs();
    } else {
      addToast("error", result.error ?? "Erreur lors de la suppression.");
    }
    setDeleteTarget(null);
  }, [deleteTarget, addToast, fetchFAQs]);

  const handleToggleStatus = useCallback(
    async (faq: FAQ) => {
      const newStatus: FAQStatus =
        faq.status === "published" ? "draft" : "published";
      const result = await apiFetch<{ faq: FAQ }>(`${API_BASE}/${faq.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      if (result.ok) {
        addToast(
          "success",
          newStatus === "published" ? "FAQ publiée." : "FAQ mise en brouillon.",
        );
        await fetchFAQs();
      } else {
        addToast("error", result.error ?? "Erreur.");
      }
    },
    [addToast, fetchFAQs],
  );

  /* ── Stats ── */
  const publishedCount = faqs.filter((f) => f.status === "published").length;
  const draftCount = faqs.filter((f) => f.status === "draft").length;

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-erotique text-3xl sm:text-4xl text-dark">FAQ</h1>
          <p className="font-poppins text-sm text-dark/50 mt-1">
            Gérez les questions fréquentes du site
          </p>
        </div>
        {canWrite && (
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
            Nouvelle FAQ
          </button>
        )}
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Total
          </p>
          <p className="font-poppins text-2xl font-bold text-dark">{total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Publiées
          </p>
          <p className="font-poppins text-2xl font-bold text-emerald-600">
            {publishedCount}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Brouillons
          </p>
          <p className="font-poppins text-2xl font-bold text-gray-400">
            {draftCount}
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
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
            placeholder="Rechercher une FAQ…"
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200"
          />
        </div>

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200"
        >
          <option value="">Tous les statuts</option>
          <option value="published">Publiées</option>
          <option value="draft">Brouillons</option>
        </select>

        {/* Count badge */}
        <span className="ml-auto font-poppins text-xs text-dark/40">
          {total} FAQ{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Table / List ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
        ) : faqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-dark/40">
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
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="font-poppins text-sm">Aucune FAQ trouvée.</p>
            {canWrite && (
              <button
                onClick={handleCreate}
                className="mt-3 font-poppins text-sm text-primary hover:underline"
              >
                Créer la première FAQ
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-3 text-left font-poppins text-xs font-semibold text-dark/50 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-5 py-3 text-left font-poppins text-xs font-semibold text-dark/50 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-5 py-3 text-left font-poppins text-xs font-semibold text-dark/50 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-5 py-3 text-left font-poppins text-xs font-semibold text-dark/50 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-5 py-3 text-right font-poppins text-xs font-semibold text-dark/50 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {faqs.map((faq, index) => (
                    <tr
                      key={faq.id}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-4 font-poppins text-sm text-dark/40 w-12">
                        {faq.order > 0 ? faq.order : index + 1}
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <p className="font-poppins text-sm font-medium text-dark truncate">
                          {faq.question}
                        </p>
                        <p className="font-poppins text-xs text-dark/40 truncate mt-0.5">
                          {faq.answer.slice(0, 80)}
                          {faq.answer.length > 80 ? "…" : ""}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 font-poppins text-xs text-dark/60">
                          {faq.category}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {canWrite ? (
                          <button
                            onClick={() => handleToggleStatus(faq)}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-poppins text-xs font-medium transition-colors cursor-pointer ${
                              faq.status === "published"
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                            title="Cliquer pour changer le statut"
                          >
                            {faq.status === "published"
                              ? "Publié"
                              : "Brouillon"}
                          </button>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-poppins text-xs font-medium ${
                              faq.status === "published"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {faq.status === "published"
                              ? "Publié"
                              : "Brouillon"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {canWrite && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(faq)}
                              className="p-1.5 rounded-lg text-dark/40 hover:text-dark hover:bg-gray-100 transition-colors"
                              title="Modifier"
                            >
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(faq)}
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {faqs.map((faq) => (
                <div key={faq.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-poppins text-sm font-medium text-dark">
                        {faq.question}
                      </p>
                      <p className="font-poppins text-xs text-dark/40 mt-1">
                        {faq.answer.slice(0, 100)}
                        {faq.answer.length > 100 ? "…" : ""}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 font-poppins text-xs text-dark/60">
                          {faq.category}
                        </span>
                        <button
                          onClick={() =>
                            canWrite ? handleToggleStatus(faq) : undefined
                          }
                          disabled={!canWrite}
                          className={`inline-flex items-center rounded-full px-2 py-0.5 font-poppins text-xs font-medium ${
                            faq.status === "published"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          } ${canWrite ? "cursor-pointer" : "cursor-default"}`}
                        >
                          {faq.status === "published" ? "Publié" : "Brouillon"}
                        </button>
                      </div>
                    </div>
                    {canWrite && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleEdit(faq)}
                          className="p-2 rounded-lg text-dark/40 hover:text-dark hover:bg-gray-100"
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(faq)}
                          className="p-2 rounded-lg text-dark/40 hover:text-red-600 hover:bg-red-50"
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
              ))}
            </div>

            {/* Footer count */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/30">
              <p className="font-poppins text-xs text-dark/40">
                {total} FAQ{total !== 1 ? "s" : ""} au total
              </p>
            </div>
          </>
        )}
      </div>

      {/* FAQ Modal */}
      <FAQModal
        isOpen={modalOpen}
        mode={modalMode}
        saving={saving}
        initialData={
          editingFAQ
            ? {
                question: editingFAQ.question,
                answer: editingFAQ.answer,
                category: editingFAQ.category,
                status: editingFAQ.status,
                order: editingFAQ.order,
              }
            : undefined
        }
        categoryOptions={categories}
        onCancel={() => {
          setModalOpen(false);
          setEditingFAQ(null);
        }}
        onSave={handleModalSave}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        categoryName={deleteTarget?.question ?? ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
