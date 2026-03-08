/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useCallback, useEffect } from "react";
import CategoryTable from "../component/categories/CategoryTable";
import CategoryModal from "../component/categories/CategoryModal";
import DeleteConfirmModal from "../component/shared/DeleteConfirmModal";
import Toast from "../component/shared/Toast";
import { useToast } from "../hooks/useToast";
import type { Category } from "../component/categories/CategoryTable";
import type {
  CategoryFormData,
  CategoryLevel,
} from "../component/categories/CategoryModal";

/* ──────────── API helpers ──────────── */

const API_BASE = "/api/admin/categories";

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

/* ──────────── Sort categories into hierarchy for display ──────────── */

function buildSortedCategories(cats: Category[]): Category[] {
  const meres = cats.filter((c) => c.level === "mere");
  const sorted: Category[] = [];

  meres.forEach((mere) => {
    sorted.push(mere);
    const subs = cats.filter((c) => c.level === "sous" && c.parent === mere.id);
    subs.forEach((sub) => {
      sorted.push(sub);
      const finales = cats.filter(
        (c) => c.level === "finale" && c.parent === sub.id,
      );
      finales.forEach((f) => sorted.push(f));
    });
  });

  return sorted;
}

/* ──────────── Page ──────────── */

interface APIListResponse {
  categories: Category[];
  total: number;
  stats: {
    total: number;
    active: number;
    mereCount: number;
    sousCount: number;
    finaleCount: number;
  } | null;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    mereCount: number;
  }>({ total: 0, active: 0, mereCount: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  /* ── Fetch categories from API ── */

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const result = await apiFetch<APIListResponse>(API_BASE);
    if (result.ok && result.data) {
      setCategories(result.data.categories);
      if (result.data.stats) {
        setStats({
          total: result.data.stats.total,
          active: result.data.stats.active,
          mereCount: result.data.stats.mereCount,
        });
      }
    } else {
      addToast(
        "error",
        result.error ?? "Impossible de charger les catégories.",
      );
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const sortedCategories = buildSortedCategories(categories);

  /* ── Parent options for modal (value = ID) ── */

  const parentOptions = categories
    .filter((c) => c.level === "mere" || c.level === "sous")
    .map((c) => ({
      value: c.id,
      label: c.name,
      level: c.level as CategoryLevel,
    }));

  /* ── Handlers ── */

  const handleCreate = useCallback(() => {
    setEditingCategory(null);
    setModalMode("create");
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((cat: Category) => {
    setEditingCategory(cat);
    setModalMode("edit");
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback((cat: Category) => {
    setDeleteTarget(cat);
  }, []);

  const handleModalSave = useCallback(
    async (data: CategoryFormData) => {
      setSaving(true);

      if (modalMode === "create") {
        const body: Record<string, unknown> = {
          name: data.name,
          level: data.level,
          status: data.status,
        };
        if (data.level !== "mere" && data.parent) {
          body.parent = data.parent;
        }

        const result = await apiFetch<{ category: Category }>(API_BASE, {
          method: "POST",
          body: JSON.stringify(body),
        });

        if (result.ok) {
          addToast("success", `Catégorie "${data.name}" créée avec succès`);
          await fetchCategories();
        } else {
          addToast("error", result.error ?? "Erreur lors de la création.");
        }
      } else if (editingCategory) {
        const body: Record<string, unknown> = {
          name: data.name,
          level: data.level,
          status: data.status,
        };
        if (data.level !== "mere") {
          body.parent = data.parent || null;
        }

        const result = await apiFetch<{ category: Category }>(
          `${API_BASE}/${editingCategory.id}`,
          {
            method: "PUT",
            body: JSON.stringify(body),
          },
        );

        if (result.ok) {
          addToast("success", `Catégorie "${data.name}" modifiée avec succès`);
          await fetchCategories();
        } else {
          addToast("error", result.error ?? "Erreur lors de la modification.");
        }
      }

      setSaving(false);
      setModalOpen(false);
      setEditingCategory(null);
    },
    [modalMode, editingCategory, addToast, fetchCategories],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    const result = await apiFetch<{ deletedId: string }>(
      `${API_BASE}/${deleteTarget.id}`,
      { method: "DELETE" },
    );

    if (result.ok) {
      addToast("success", `Catégorie "${deleteTarget.name}" supprimée`);
      await fetchCategories();
    } else {
      addToast("error", result.error ?? "Erreur lors de la suppression.");
    }

    setDeleteTarget(null);
  }, [deleteTarget, addToast, fetchCategories]);

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-erotique text-3xl sm:text-4xl text-dark">
            Catégories
          </h1>
          <p className="font-poppins text-sm text-dark/50 mt-1">
            Gérez la hiérarchie de votre catalogue produits.
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
          Ajouter une catégorie
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
            Actives
          </p>
          <p className="font-poppins text-2xl font-bold text-emerald-600">
            {stats.active}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Catégories mères
          </p>
          <p className="font-poppins text-2xl font-bold text-primary">
            {stats.mereCount}
          </p>
        </div>
      </div>

      {/* Table / Loading */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
          <p className="font-poppins text-sm text-dark/50">
            Chargement des catégories...
          </p>
        </div>
      ) : (
        <CategoryTable
          categories={sortedCategories}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={modalOpen}
        mode={modalMode}
        saving={saving}
        initialData={
          editingCategory
            ? {
                name: editingCategory.name,
                level: editingCategory.level,
                parent: editingCategory.parent ?? "",
                status: editingCategory.status,
              }
            : undefined
        }
        parentOptions={parentOptions}
        onCancel={() => {
          setModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleModalSave}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        categoryName={deleteTarget?.name ?? ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
