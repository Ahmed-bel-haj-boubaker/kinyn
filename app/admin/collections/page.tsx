/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useCallback, useEffect } from "react";
import CollectionTable from "../component/collections/CollectionTable";
import CollectionModal from "../component/collections/CollectionModal";
import DeleteConfirmModal from "../component/shared/DeleteConfirmModal";
import Toast from "../component/shared/Toast";
import { useToast } from "../hooks/useToast";
import { useAdminAuth } from "../context/AdminAuthContext";
import type { Collection } from "../component/collections/CollectionTable";
import type { CollectionFormData } from "../component/collections/CollectionModal";

const API_BASE = "/api/admin/collections";

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

interface APIListResponse {
  collections: Collection[];
  total: number;
  stats: {
    total: number;
    active: number;
    hidden: number;
  } | null;
}

export default function CollectionsPage() {
  const { canWrite } = useAdminAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    hidden: number;
  }>({ total: 0, active: 0, hidden: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    const result = await apiFetch<APIListResponse>(API_BASE);
    if (result.ok && result.data) {
      setCollections(result.data.collections);
      if (result.data.stats) {
        setStats(result.data.stats);
      }
    } else {
      addToast(
        "error",
        result.error ?? "Impossible de charger les collections.",
      );
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleCreate = useCallback(() => {
    setEditingCollection(null);
    setModalMode("create");
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((col: Collection) => {
    setEditingCollection(col);
    setModalMode("edit");
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback((col: Collection) => {
    setDeleteTarget(col);
  }, []);

  const handleModalSave = useCallback(
    async (data: CollectionFormData) => {
      setSaving(true);

      if (modalMode === "create") {
        const result = await apiFetch<{ collection: Collection }>(API_BASE, {
          method: "POST",
          body: JSON.stringify({
            name: data.name,
            description: data.description,
            image: data.image,
            products: data.products,
            status: data.status,
            order: data.order,
          }),
        });

        if (result.ok) {
          addToast("success", `Collection "${data.name}" créée avec succès`);
          await fetchCollections();
        } else {
          addToast("error", result.error ?? "Erreur lors de la création.");
        }
      } else if (editingCollection) {
        const result = await apiFetch<{ collection: Collection }>(
          `${API_BASE}/${editingCollection.id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              name: data.name,
              description: data.description,
              image: data.image,
              products: data.products,
              status: data.status,
              order: data.order,
            }),
          },
        );

        if (result.ok) {
          addToast("success", `Collection "${data.name}" modifiée avec succès`);
          await fetchCollections();
        } else {
          addToast("error", result.error ?? "Erreur lors de la modification.");
        }
      }

      setSaving(false);
      setModalOpen(false);
      setEditingCollection(null);
    },
    [modalMode, editingCollection, addToast, fetchCollections],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    const result = await apiFetch<{ deletedId: string }>(
      `${API_BASE}/${deleteTarget.id}`,
      { method: "DELETE" },
    );

    if (result.ok) {
      addToast("success", `Collection "${deleteTarget.name}" supprimée`);
      await fetchCollections();
    } else {
      addToast("error", result.error ?? "Erreur lors de la suppression.");
    }

    setDeleteTarget(null);
  }, [deleteTarget, addToast, fetchCollections]);

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-erotique text-3xl sm:text-4xl text-dark">
            Collections
          </h1>
          <p className="font-poppins text-sm text-dark/50 mt-1">
            Créez et gérez vos collections de produits.
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
            Créer une collection
          </button>
        )}
      </div>

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
            Masquées
          </p>
          <p className="font-poppins text-2xl font-bold text-primary">
            {stats.hidden}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
          <p className="font-poppins text-sm text-dark/50">
            Chargement des collections...
          </p>
        </div>
      ) : (
        <CollectionTable
          collections={collections}
          onEdit={canWrite ? handleEdit : undefined}
          onDelete={canWrite ? handleDelete : undefined}
        />
      )}

      <CollectionModal
        isOpen={modalOpen}
        mode={modalMode}
        saving={saving}
        initialData={
          editingCollection
            ? {
                name: editingCollection.name,
                description: editingCollection.description,
                image: editingCollection.image,
                products: editingCollection.products,
                status: editingCollection.status,
                order: editingCollection.order,
              }
            : undefined
        }
        onCancel={() => {
          setModalOpen(false);
          setEditingCollection(null);
        }}
        onSave={handleModalSave}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        categoryName={deleteTarget?.name ?? ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
