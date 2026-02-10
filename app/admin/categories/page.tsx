"use client";

import { useState, useCallback } from "react";
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

const INITIAL_CATEGORIES: Category[] = [
  { id: "1", name: "Femme", level: "mere", parent: "", status: "active" },
  { id: "2", name: "Hauts", level: "sous", parent: "Femme", status: "active" },
  {
    id: "3",
    name: "T-shirt",
    level: "finale",
    parent: "Hauts",
    status: "active",
  },
  {
    id: "4",
    name: "Chemise",
    level: "finale",
    parent: "Hauts",
    status: "active",
  },
  { id: "5", name: "Bas", level: "sous", parent: "Femme", status: "active" },
  {
    id: "6",
    name: "Pantalon",
    level: "finale",
    parent: "Bas",
    status: "active",
  },
  { id: "7", name: "Jean", level: "finale", parent: "Bas", status: "hidden" },
  { id: "8", name: "Robes", level: "sous", parent: "Femme", status: "active" },
  {
    id: "9",
    name: "Robe courte",
    level: "finale",
    parent: "Robes",
    status: "active",
  },
  {
    id: "10",
    name: "Robe longue",
    level: "finale",
    parent: "Robes",
    status: "active",
  },
  { id: "11", name: "Homme", level: "mere", parent: "", status: "active" },
  { id: "12", name: "Hauts", level: "sous", parent: "Homme", status: "active" },
  {
    id: "13",
    name: "Polo",
    level: "finale",
    parent: "Hauts",
    status: "active",
  },
  { id: "14", name: "Enfant", level: "mere", parent: "", status: "hidden" },
];

function buildSortedCategories(cats: Category[]): Category[] {
  const meres = cats.filter((c) => c.level === "mere");
  const sorted: Category[] = [];

  meres.forEach((mere) => {
    sorted.push(mere);
    const subs = cats.filter(
      (c) => c.level === "sous" && c.parent === mere.name,
    );
    subs.forEach((sub) => {
      sorted.push(sub);
      const finales = cats.filter(
        (c) => c.level === "finale" && c.parent === sub.name,
      );
      finales.forEach((f) => sorted.push(f));
    });
  });

  return sorted;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const sortedCategories = buildSortedCategories(categories);

  const parentOptions = categories
    .filter((c) => c.level === "mere" || c.level === "sous")
    .map((c) => ({
      value: c.name,
      label: c.name,
      level: c.level as CategoryLevel,
    }));

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
    (data: CategoryFormData) => {
      if (modalMode === "create") {
        const newCat: Category = {
          id: `${Date.now()}`,
          name: data.name,
          level: data.level,
          parent: data.parent,
          status: data.status,
        };
        setCategories((prev) => [...prev, newCat]);
        addToast("success", `Catégorie "${data.name}" créée avec succès`);
      } else if (editingCategory) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingCategory.id
              ? {
                  ...c,
                  name: data.name,
                  level: data.level,
                  parent: data.parent,
                  status: data.status,
                }
              : c,
          ),
        );
        addToast("success", `Catégorie "${data.name}" modifiée avec succès`);
      }
      setModalOpen(false);
      setEditingCategory(null);
    },
    [modalMode, editingCategory, addToast],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    addToast("success", `Catégorie "${deleteTarget.name}" supprimée`);
    setDeleteTarget(null);
  }, [deleteTarget, addToast]);

  const totalCount = categories.length;
  const activeCount = categories.filter((c) => c.status === "active").length;
  const mereCount = categories.filter((c) => c.level === "mere").length;

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
            {totalCount}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Actives
          </p>
          <p className="font-poppins text-2xl font-bold text-emerald-600">
            {activeCount}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Catégories mères
          </p>
          <p className="font-poppins text-2xl font-bold text-primary">
            {mereCount}
          </p>
        </div>
      </div>

      {/* Table */}
      <CategoryTable
        categories={sortedCategories}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Category Modal */}
      <CategoryModal
        isOpen={modalOpen}
        mode={modalMode}
        initialData={
          editingCategory
            ? {
                name: editingCategory.name,
                level: editingCategory.level,
                parent: editingCategory.parent,
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
