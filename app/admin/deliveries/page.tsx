"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import DeliveryTable from "../component/deliveries/DeliveryTable";
import DeliveryModal from "../component/deliveries/DeliveryModal";
import DeliveryDetailModal from "../component/deliveries/DeliveryDetailModal";
import DeleteConfirmModal from "../component/shared/DeleteConfirmModal";
import Toast from "../component/shared/Toast";
import { useToast } from "../hooks/useToast";
import { useAdminAuth } from "../context/AdminAuthContext";
import type { AdminDeliveryCompany } from "../component/deliveries/DeliveryTable";
import type { CompanyFormData } from "../component/deliveries/DeliveryModal";
import type { DeliveryCompanyStatus } from "@/models/Delivery";

/* ──────────────── API helper ──────────────── */

const API_BASE = "/api/admin/deliveries";

async function apiFetch<T>(
  url: string,
  opts?: RequestInit,
): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      credentials: "include",
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

/* ──────────────── Types ──────────────── */

interface APIListResponse {
  companies: AdminDeliveryCompany[];
  total: number;
  stats: CompanyStats | null;
}

interface CompanyStats {
  total: number;
  active: number;
  inactive: number;
}

type FilterStatus = DeliveryCompanyStatus | "all";

/* ──────────────── Page ──────────────── */

export default function AdminDeliveriesPage() {
  const { canWrite } = useAdminAuth();
  const { toasts, addToast, removeToast } = useToast();

  /* State */
  const [companies, setCompanies] = useState<AdminDeliveryCompany[]>([]);
  const [stats, setStats] = useState<CompanyStats>({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* Filters */
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  /* Modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingCompany, setEditingCompany] =
    useState<AdminDeliveryCompany | null>(null);
  const [viewingCompany, setViewingCompany] =
    useState<AdminDeliveryCompany | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminDeliveryCompany | null>(
    null,
  );

  /* ── Fetch companies ── */

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const result = await apiFetch<APIListResponse>(API_BASE);
    if (result.ok && result.data) {
      setCompanies(result.data.companies);
      if (result.data.stats) {
        setStats(result.data.stats);
      }
    } else {
      addToast(
        "error",
        result.error ?? "Erreur lors du chargement des sociétés.",
      );
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  /* ── Filtered companies ── */

  const filtered = useMemo(() => {
    let result = companies;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q),
      );
    }
    if (filterStatus !== "all") {
      result = result.filter((c) => c.status === filterStatus);
    }
    return result;
  }, [companies, search, filterStatus]);

  /* ── Handlers ── */

  const handleCreate = useCallback(() => {
    setEditingCompany(null);
    setModalMode("create");
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((c: AdminDeliveryCompany) => {
    setEditingCompany(c);
    setModalMode("edit");
    setModalOpen(true);
  }, []);

  const handleView = useCallback((c: AdminDeliveryCompany) => {
    setViewingCompany(c);
  }, []);

  const handleModalSave = useCallback(
    async (data: CompanyFormData) => {
      setSaving(true);

      if (modalMode === "create") {
        const body: Record<string, unknown> = {
          name: data.name,
          phone: data.phone,
          email: data.email,
          address: data.address,
          price: Number(data.price),
          notes: data.notes,
        };

        const result = await apiFetch<{ company: AdminDeliveryCompany }>(
          API_BASE,
          { method: "POST", body: JSON.stringify(body) },
        );

        if (result.ok) {
          addToast("success", `Société "${data.name}" créée avec succès`);
          await fetchCompanies();
        } else {
          addToast("error", result.error ?? "Erreur lors de la création.");
        }
      } else if (editingCompany) {
        const body: Record<string, unknown> = {
          name: data.name,
          phone: data.phone,
          email: data.email,
          address: data.address,
          price: Number(data.price),
          status: data.status,
          notes: data.notes,
        };

        const result = await apiFetch<{ company: AdminDeliveryCompany }>(
          `${API_BASE}/${editingCompany.id}`,
          { method: "PATCH", body: JSON.stringify(body) },
        );

        if (result.ok) {
          addToast("success", `Société "${data.name}" modifiée avec succès`);
          await fetchCompanies();
        } else {
          addToast("error", result.error ?? "Erreur lors de la modification.");
        }
      }

      setSaving(false);
      setModalOpen(false);
      setEditingCompany(null);
    },
    [modalMode, editingCompany, addToast, fetchCompanies],
  );

  const handleDelete = useCallback(
    async (companyId: string) => {
      try {
        const result = await apiFetch(`${API_BASE}/${companyId}`, {
          method: "DELETE",
        });
        if (result.ok) {
          addToast("success", "Société supprimée avec succès.");
          setCompanies((prev) => prev.filter((c) => c.id !== companyId));
          if (viewingCompany?.id === companyId) setViewingCompany(null);
        } else {
          addToast("error", result.error ?? "Erreur lors de la suppression.");
        }
      } finally {
        setDeleteTarget(null);
      }
    },
    [addToast, viewingCompany],
  );

  /* ── Filter helpers ── */

  const resetFilters = () => {
    setSearch("");
    setFilterStatus("all");
  };

  const hasActiveFilters = search || filterStatus !== "all";

  const selectClass =
    "px-3 py-2 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200 appearance-none bg-no-repeat bg-position-[right_0.75rem_center] bg-size-[1rem] bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2317171a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")] pr-9";

  /* ── Loading state ── */

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
            Chargement des sociétés…
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
            Sociétés de livraison
          </h1>
          <p className="font-poppins text-sm text-dark/50 mt-1">
            Gérez les sociétés de livraison, leurs coordonnées et tarifs.
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
            Ajouter une société
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Total
          </p>
          <p className="font-poppins text-2xl font-bold text-dark">
            {stats.total}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="font-poppins text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-1">
            Actives
          </p>
          <p className="font-poppins text-2xl font-bold text-emerald-500">
            {stats.active}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="font-poppins text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Inactives
          </p>
          <p className="font-poppins text-2xl font-bold text-gray-400">
            {stats.inactive}
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
            placeholder="Rechercher par nom, téléphone, email…"
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200"
          />
        </div>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className={selectClass}
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
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
          {filtered.length} société{filtered.length !== 1 ? "s" : ""}
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className={selectClass + " w-full"}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
          {filtered.length} société{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Company List */}
      <DeliveryTable
        companies={filtered}
        onView={handleView}
        onEdit={canWrite ? handleEdit : undefined}
        onDelete={canWrite ? setDeleteTarget : undefined}
      />

      {/* Company Detail Modal */}
      <DeliveryDetailModal
        isOpen={!!viewingCompany}
        company={viewingCompany}
        onClose={() => setViewingCompany(null)}
      />

      {/* Create / Edit Modal */}
      <DeliveryModal
        isOpen={modalOpen}
        mode={modalMode}
        initialData={
          editingCompany
            ? {
                name: editingCompany.name,
                phone: editingCompany.phone,
                email: editingCompany.email,
                address: editingCompany.address,
                price: String(editingCompany.price),
                status: editingCompany.status,
                notes: editingCompany.notes,
              }
            : undefined
        }
        onCancel={() => {
          setModalOpen(false);
          setEditingCompany(null);
        }}
        onSave={handleModalSave}
        saving={saving}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        categoryName={deleteTarget?.name ?? ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
      />
    </>
  );
}
