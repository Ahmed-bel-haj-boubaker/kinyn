"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import ShipmentTable from "../../component/deliveries/ShipmentTable";
import ShipmentModal from "../../component/deliveries/ShipmentModal";
import ShipmentDetailModal from "../../component/deliveries/ShipmentDetailModal";
import DeleteConfirmModal from "../../component/shared/DeleteConfirmModal";
import Toast from "../../component/shared/Toast";
import { useToast } from "../../hooks/useToast";
import { useAdminAuth } from "../../context/AdminAuthContext";
import type { AdminShipment } from "../../component/deliveries/ShipmentTable";
import { SHIPMENT_STATUS_CONFIG } from "../../component/deliveries/ShipmentTable";
import type { ShipmentFormData } from "../../component/deliveries/ShipmentModal";
import type { ShipmentStatus } from "@/models/Shipment";

/* ──────────────── API helper ──────────────── */

const API_BASE = "/api/admin/shipments";
const COMPANIES_API = "/api/admin/deliveries";
const ORDERS_API = "/api/admin/orders";

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
  shipments: AdminShipment[];
  total: number;
  stats: ShipmentStats | null;
}

interface ShipmentStats {
  total: number;
  pending: number;
  picked_up: number;
  in_transit: number;
  delivered: number;
  failed: number;
}

interface CompanyListResponse {
  companies: { id: string; name: string }[];
}

interface OrderListResponse {
  orders: { id: string; ref: string }[];
}

type FilterStatus = ShipmentStatus | "all";

/* ──────────────── Page ──────────────── */

export default function AdminShipmentsPage() {
  const { canWrite } = useAdminAuth();
  const { toasts, addToast, removeToast } = useToast();

  /* State */
  const [shipments, setShipments] = useState<AdminShipment[]>([]);
  const [stats, setStats] = useState<ShipmentStats>({
    total: 0,
    pending: 0,
    picked_up: 0,
    in_transit: 0,
    delivered: 0,
    failed: 0,
  });
  const [companyOptions, setCompanyOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [orderOptions, setOrderOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* Filters */
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  /* Modal state */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingShipment, setEditingShipment] = useState<AdminShipment | null>(
    null,
  );
  const [viewingShipment, setViewingShipment] = useState<AdminShipment | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<AdminShipment | null>(null);

  /* ── Fetch shipments ── */

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    const result = await apiFetch<APIListResponse>(API_BASE);
    if (result.ok && result.data) {
      setShipments(result.data.shipments);
      if (result.data.stats) {
        setStats(result.data.stats);
      }
    } else {
      addToast(
        "error",
        result.error ?? "Erreur lors du chargement des expéditions.",
      );
    }
    setLoading(false);
  }, [addToast]);

  /* ── Fetch company options ── */

  const fetchCompanyOptions = useCallback(async () => {
    const result = await apiFetch<CompanyListResponse>(COMPANIES_API);
    if (result.ok && result.data) {
      setCompanyOptions(
        result.data.companies.map((c) => ({ value: c.id, label: c.name })),
      );
    }
  }, []);

  /* ── Fetch order options ── */

  const fetchOrderOptions = useCallback(async () => {
    const result = await apiFetch<OrderListResponse>(ORDERS_API);
    if (result.ok && result.data) {
      setOrderOptions(
        result.data.orders.map((o) => ({ value: o.id, label: o.ref })),
      );
    }
  }, []);

  useEffect(() => {
    fetchShipments();
    fetchCompanyOptions();
    fetchOrderOptions();
  }, [fetchShipments, fetchCompanyOptions, fetchOrderOptions]);

  /* ── Filtered shipments ── */

  const filtered = useMemo(() => {
    let result = shipments;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.companyName.toLowerCase().includes(q) ||
          s.orderRef.toLowerCase().includes(q) ||
          s.trackingNumber.toLowerCase().includes(q),
      );
    }
    if (filterStatus !== "all") {
      result = result.filter((s) => s.status === filterStatus);
    }
    return result;
  }, [shipments, search, filterStatus]);

  /* ── Handlers ── */

  const handleCreate = useCallback(() => {
    setEditingShipment(null);
    setModalMode("create");
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((s: AdminShipment) => {
    setEditingShipment(s);
    setModalMode("edit");
    setModalOpen(true);
  }, []);

  const handleView = useCallback((s: AdminShipment) => {
    setViewingShipment(s);
  }, []);

  const handleModalSave = useCallback(
    async (data: ShipmentFormData) => {
      setSaving(true);

      if (modalMode === "create") {
        const body: Record<string, unknown> = {
          deliveryCompany: data.deliveryCompany,
          order: data.order,
          trackingNumber: data.trackingNumber,
          notes: data.notes,
        };

        const result = await apiFetch<{ shipment: AdminShipment }>(API_BASE, {
          method: "POST",
          body: JSON.stringify(body),
        });

        if (result.ok) {
          addToast("success", "Expédition créée avec succès");
          await fetchShipments();
        } else {
          addToast("error", result.error ?? "Erreur lors de la création.");
        }
      } else if (editingShipment) {
        const body: Record<string, unknown> = {
          deliveryCompany: data.deliveryCompany,
          order: data.order,
          status: data.status,
          trackingNumber: data.trackingNumber,
          notes: data.notes,
        };

        const result = await apiFetch<{ shipment: AdminShipment }>(
          `${API_BASE}/${editingShipment.id}`,
          { method: "PATCH", body: JSON.stringify(body) },
        );

        if (result.ok) {
          addToast("success", "Expédition modifiée avec succès");
          await fetchShipments();
        } else {
          addToast("error", result.error ?? "Erreur lors de la modification.");
        }
      }

      setSaving(false);
      setModalOpen(false);
      setEditingShipment(null);
    },
    [modalMode, editingShipment, addToast, fetchShipments],
  );

  const handleUpdateStatus = useCallback(
    async (shipmentId: string, newStatus: ShipmentStatus) => {
      setSaving(true);
      try {
        const result = await apiFetch<{ shipment: AdminShipment }>(
          `${API_BASE}/${shipmentId}`,
          {
            method: "PATCH",
            body: JSON.stringify({ status: newStatus }),
          },
        );
        if (result.ok) {
          const statusLabel = SHIPMENT_STATUS_CONFIG[newStatus].label;
          addToast("success", `Statut mis à jour : ${statusLabel}`);
          await fetchShipments();
          if (viewingShipment?.id === shipmentId && result.data?.shipment) {
            setViewingShipment(result.data.shipment);
          }
        } else {
          addToast("error", result.error ?? "Erreur lors de la mise à jour.");
        }
      } finally {
        setSaving(false);
      }
    },
    [addToast, fetchShipments, viewingShipment],
  );

  const handleDelete = useCallback(
    async (shipmentId: string) => {
      try {
        const result = await apiFetch(`${API_BASE}/${shipmentId}`, {
          method: "DELETE",
        });
        if (result.ok) {
          addToast("success", "Expédition supprimée avec succès.");
          setShipments((prev) => prev.filter((s) => s.id !== shipmentId));
          if (viewingShipment?.id === shipmentId) setViewingShipment(null);
        } else {
          addToast("error", result.error ?? "Erreur lors de la suppression.");
        }
      } finally {
        setDeleteTarget(null);
      }
    },
    [addToast, viewingShipment],
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
            Chargement des expéditions…
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
            Suivi des expéditions
          </h1>
          <p className="font-poppins text-sm text-dark/50 mt-1">
            Affectez des commandes aux sociétés de livraison et suivez leur
            progression.
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
            Nouvelle expédition
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Total
          </p>
          <p className="font-poppins text-2xl font-bold text-dark">
            {stats.total}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="font-poppins text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-1">
            En attente
          </p>
          <p className="font-poppins text-2xl font-bold text-amber-500">
            {stats.pending}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="font-poppins text-[10px] font-semibold text-blue-500 uppercase tracking-wider mb-1">
            Récupérées
          </p>
          <p className="font-poppins text-2xl font-bold text-blue-500">
            {stats.picked_up}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="font-poppins text-[10px] font-semibold text-purple-500 uppercase tracking-wider mb-1">
            En transit
          </p>
          <p className="font-poppins text-2xl font-bold text-purple-500">
            {stats.in_transit}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="font-poppins text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-1">
            Livrées
          </p>
          <p className="font-poppins text-2xl font-bold text-emerald-500">
            {stats.delivered}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="font-poppins text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-1">
            Échouées
          </p>
          <p className="font-poppins text-2xl font-bold text-red-500">
            {stats.failed}
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
            placeholder="Rechercher par société, commande, n° suivi…"
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
          <option value="pending">En attente</option>
          <option value="picked_up">Récupéré</option>
          <option value="in_transit">En transit</option>
          <option value="delivered">Livré</option>
          <option value="failed">Échoué</option>
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
          {filtered.length} expédition{filtered.length !== 1 ? "s" : ""}
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
              <option value="pending">En attente</option>
              <option value="picked_up">Récupéré</option>
              <option value="in_transit">En transit</option>
              <option value="delivered">Livré</option>
              <option value="failed">Échoué</option>
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
          {filtered.length} expédition{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Shipment List */}
      <ShipmentTable
        shipments={filtered}
        onView={handleView}
        onEdit={canWrite ? handleEdit : undefined}
        onDelete={canWrite ? setDeleteTarget : undefined}
      />

      {/* Shipment Detail Modal */}
      <ShipmentDetailModal
        isOpen={!!viewingShipment}
        shipment={viewingShipment}
        onClose={() => setViewingShipment(null)}
        onUpdateStatus={canWrite ? handleUpdateStatus : undefined}
        saving={saving}
      />

      {/* Create / Edit Modal */}
      <ShipmentModal
        isOpen={modalOpen}
        mode={modalMode}
        initialData={
          editingShipment
            ? {
                deliveryCompany: editingShipment.deliveryCompany,
                order: editingShipment.order,
                status: editingShipment.status,
                trackingNumber: editingShipment.trackingNumber,
                notes: editingShipment.notes,
              }
            : undefined
        }
        companyOptions={companyOptions}
        orderOptions={orderOptions}
        onCancel={() => {
          setModalOpen(false);
          setEditingShipment(null);
        }}
        onSave={handleModalSave}
        saving={saving}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        categoryName={
          deleteTarget
            ? `${deleteTarget.orderRef} → ${deleteTarget.companyName}`
            : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
      />
    </>
  );
}
