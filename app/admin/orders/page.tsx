"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import OrderTable from "../component/orders/OrderTable";
import OrderCard from "../component/orders/OrderCard";
import OrderDetailModal from "../component/orders/OrderDetailModal";
import StatusUpdateModal from "../component/orders/StatusUpdateModal";
import DeleteOrderModal from "../component/orders/DeleteOrderModal";
import Toast from "../component/shared/Toast";
import { useToast } from "../hooks/useToast";
import { useAdminAuth } from "../context/AdminAuthContext";
import type { AdminOrder } from "../component/orders/OrderTable";
import type { OrderStatus } from "@/models/Order";
import { ORDER_STATUS_CONFIG } from "../component/orders/OrderTable";

/* ──────────────── API helper ──────────────── */

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

interface APIOrderListResponse {
  orders: AdminOrder[];
  total: number;
  stats: OrderStats | null;
}

interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  returned: number;
  revenue: number;
}

type FilterStatus = OrderStatus | "all";

/* ──────────────── Page ──────────────── */

export default function AdminOrdersPage() {
  const { canWrite } = useAdminAuth();
  const { toasts, addToast, removeToast } = useToast();

  /* State */
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* Filters */
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  /* Modal state */
  const [viewingOrder, setViewingOrder] = useState<AdminOrder | null>(null);
  const [statusTarget, setStatusTarget] = useState<AdminOrder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminOrder | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ── Fetch orders ── */

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const result = await apiFetch<APIOrderListResponse>(ORDERS_API);
    if (result.ok && result.data) {
      setOrders(result.data.orders);
      if (result.data.stats) {
        setStats(result.data.stats);
      }
    } else {
      addToast(
        "error",
        result.error ?? "Erreur lors du chargement des commandes.",
      );
    }
    setLoading(false);
  }, [addToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /* ── Filtered orders ── */

  const filtered = useMemo(() => {
    let result = orders;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.ref.toLowerCase().includes(q) ||
          o.userName.toLowerCase().includes(q) ||
          o.userEmail.toLowerCase().includes(q),
      );
    }
    if (filterStatus !== "all") {
      result = result.filter((o) => o.status === filterStatus);
    }
    return result;
  }, [orders, search, filterStatus]);

  /* ── Handlers ── */

  const handleView = useCallback((order: AdminOrder) => {
    setViewingOrder(order);
  }, []);

  const handleOpenStatusUpdate = useCallback((order: AdminOrder) => {
    setStatusTarget(order);
  }, []);

  const handleUpdateStatus = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      setSaving(true);
      try {
        const result = await apiFetch<{ order: AdminOrder }>(
          `${ORDERS_API}/${orderId}`,
          {
            method: "PATCH",
            body: JSON.stringify({ status: newStatus }),
          },
        );
        if (result.ok) {
          const statusLabel = ORDER_STATUS_CONFIG[newStatus].label;
          addToast("success", `Statut mis à jour : ${statusLabel}`);
          await fetchOrders();
          /* Update viewing order if open */
          if (viewingOrder?.id === orderId && result.data?.order) {
            setViewingOrder(result.data.order);
          }
        } else {
          addToast("error", result.error ?? "Erreur lors de la mise à jour.");
        }
      } finally {
        setSaving(false);
        setStatusTarget(null);
      }
    },
    [addToast, fetchOrders, viewingOrder],
  );

  /* ── Filter helpers ── */

  const handleDelete = useCallback(
    async (orderId: string) => {
      setDeleting(true);
      try {
        const result = await apiFetch(`${ORDERS_API}/${orderId}`, {
          method: "DELETE",
        });
        if (result.ok) {
          addToast("success", "Commande supprimée avec succès.");
          setOrders((prev) => prev.filter((o) => o.id !== orderId));
          if (viewingOrder?.id === orderId) setViewingOrder(null);
        } else {
          addToast("error", result.error ?? "Erreur lors de la suppression.");
        }
      } finally {
        setDeleting(false);
        setDeleteTarget(null);
      }
    },
    [addToast, viewingOrder],
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
            Chargement des commandes…
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
            Commandes
          </h1>
          <p className="font-poppins text-sm text-dark/50 mt-1">
            Gérez les commandes, suivez les livraisons et mettez à jour les
            statuts.
          </p>
        </div>
        {/* Revenue badge */}
        <div className="w-full sm:w-auto inline-flex items-center gap-2 px-5 py-2.5 bg-primary/5 border border-primary/10 rounded-lg shrink-0 self-start sm:self-auto">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="font-poppins text-[10px] font-semibold text-primary/60 uppercase tracking-wider leading-tight">
              Revenu total
            </p>
            <p className="font-poppins text-lg font-bold text-primary leading-tight">
              {stats.revenue.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
              })}{" "}
              TND
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3 mb-8">
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
            Confirmées
          </p>
          <p className="font-poppins text-2xl font-bold text-blue-500">
            {stats.confirmed}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="font-poppins text-[10px] font-semibold text-indigo-500 uppercase tracking-wider mb-1">
            En traitement
          </p>
          <p className="font-poppins text-2xl font-bold text-indigo-500">
            {stats.processing}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="font-poppins text-[10px] font-semibold text-purple-500 uppercase tracking-wider mb-1">
            Expédiées
          </p>
          <p className="font-poppins text-2xl font-bold text-purple-500">
            {stats.shipped}
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
            Annulées
          </p>
          <p className="font-poppins text-2xl font-bold text-red-500">
            {stats.cancelled}
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
            placeholder="Rechercher par réf, client…"
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
          <option value="confirmed">Confirmée</option>
          <option value="processing">En traitement</option>
          <option value="shipped">Expédiée</option>
          <option value="delivered">Livrée</option>
          <option value="cancelled">Annulée</option>
          <option value="returned">Retournée</option>
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
          {filtered.length} commande{filtered.length !== 1 ? "s" : ""}
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
              <option value="confirmed">Confirmée</option>
              <option value="processing">En traitement</option>
              <option value="shipped">Expédiée</option>
              <option value="delivered">Livrée</option>
              <option value="cancelled">Annulée</option>
              <option value="returned">Retournée</option>
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
          {filtered.length} commande{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Order List — Desktop Table */}
      <OrderTable
        orders={filtered}
        onView={handleView}
        onUpdateStatus={canWrite ? handleOpenStatusUpdate : undefined}
        onDelete={canWrite ? setDeleteTarget : undefined}
      />

      {/* Order List — Mobile Cards */}
      <OrderCard
        orders={filtered}
        onView={handleView}
        onUpdateStatus={canWrite ? handleOpenStatusUpdate : undefined}
        onDelete={canWrite ? setDeleteTarget : undefined}
      />

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={!!viewingOrder}
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
        onUpdateStatus={canWrite ? handleUpdateStatus : undefined}
        saving={saving}
      />

      {/* Status Update Modal */}
      <StatusUpdateModal
        isOpen={!!statusTarget}
        order={statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleUpdateStatus}
        saving={saving}
      />

      {/* Delete Order Modal */}
      <DeleteOrderModal
        isOpen={!!deleteTarget}
        orderRef={deleteTarget?.ref ?? ""}
        saving={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
      />
    </>
  );
}
