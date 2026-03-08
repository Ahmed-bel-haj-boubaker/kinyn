"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import CustomerTable from "../component/customers/CustomerTable";
import CustomerCard from "../component/customers/CustomerCard";
import CustomerDetailModal from "../component/customers/CustomerDetailModal";
import CustomerStatusModal from "../component/customers/CustomerStatusModal";
import DeleteCustomerModal from "../component/customers/DeleteCustomerModal";
import Toast from "../component/shared/Toast";
import { useToast } from "../hooks/useToast";
import type { AdminCustomer } from "../component/customers/CustomerTable";
import { CUSTOMER_STATUS_CONFIG } from "../component/customers/CustomerTable";
import type { UserStatus } from "@/models/User";

/* ──────────────── API helper ──────────────── */

const CUSTOMERS_API = "/api/admin/customers";

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
    console.log(json);
    if (!res.ok) return { ok: false, error: json.error ?? "Erreur serveur." };
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, error: "Erreur réseau." };
  }
}

/* ──────────────── Types ──────────────── */

interface APICustomerListResponse {
  customers: AdminCustomer[];
  total: number;
  stats: CustomerStats | null;
}

interface CustomerStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  withOrders: number;
  totalRevenue: number;
}

type FilterStatus = UserStatus | "all";
type FilterOrders = "all" | "yes" | "no";

/* ──────────────── Page ──────────────── */

export default function AdminCustomersPage() {
  const { toasts, addToast, removeToast } = useToast();

  /* State */
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    withOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* Filters */
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterOrders, setFilterOrders] = useState<FilterOrders>("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  /* Modal state */
  const [viewingCustomer, setViewingCustomer] = useState<AdminCustomer | null>(
    null,
  );
  const [statusTarget, setStatusTarget] = useState<AdminCustomer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCustomer | null>(null);

  /* ── Fetch customers ── */

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterOrders !== "all") params.set("hasOrders", filterOrders);

    const url = `${CUSTOMERS_API}${params.toString() ? `?${params}` : ""}`;
    const result = await apiFetch<APICustomerListResponse>(url);

    if (result.ok && result.data) {
      setCustomers(result.data.customers);
      if (result.data.stats) {
        setStats(result.data.stats);
      }
    } else {
      addToast(
        "error",
        result.error ?? "Erreur lors du chargement des clients.",
      );
    }
    setLoading(false);
  }, [addToast, filterOrders]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  /* ── Filtered customers (client-side for search + status) ── */

  const filtered = useMemo(() => {
    let result = customers;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q)),
      );
    }
    if (filterStatus !== "all") {
      result = result.filter((c) => c.status === filterStatus);
    }
    return result;
  }, [customers, search, filterStatus]);

  /* ── Handlers ── */

  const handleView = useCallback((customer: AdminCustomer) => {
    setViewingCustomer(customer);
  }, []);

  const handleOpenStatusUpdate = useCallback((customer: AdminCustomer) => {
    setStatusTarget(customer);
  }, []);

  const handleOpenDelete = useCallback((customer: AdminCustomer) => {
    setDeleteTarget(customer);
  }, []);

  const handleUpdateStatus = useCallback(
    async (customerId: string, newStatus: UserStatus) => {
      setSaving(true);
      try {
        const result = await apiFetch<{ customer: AdminCustomer }>(
          `${CUSTOMERS_API}/${customerId}`,
          {
            method: "PATCH",
            body: JSON.stringify({ status: newStatus }),
          },
        );
        if (result.ok) {
          const statusLabel = CUSTOMER_STATUS_CONFIG[newStatus].label;
          addToast("success", `Statut mis à jour : ${statusLabel}`);
          await fetchCustomers();
          /* Update viewing customer if open */
          if (viewingCustomer?.id === customerId && result.data?.customer) {
            setViewingCustomer(result.data.customer);
          }
        } else {
          addToast("error", result.error ?? "Erreur lors de la mise à jour.");
        }
      } finally {
        setSaving(false);
        setStatusTarget(null);
      }
    },
    [addToast, fetchCustomers, viewingCustomer],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const result = await apiFetch<{ message: string }>(
        `${CUSTOMERS_API}/${deleteTarget.id}`,
        { method: "DELETE" },
      );
      if (result.ok) {
        addToast("success", "Client supprimé avec succès.");
        await fetchCustomers();
      } else {
        addToast("error", result.error ?? "Erreur lors de la suppression.");
      }
    } finally {
      setSaving(false);
      setDeleteTarget(null);
    }
  }, [addToast, deleteTarget, fetchCustomers]);

  /* ── Filter helpers ── */

  const resetFilters = () => {
    setSearch("");
    setFilterStatus("all");
    setFilterOrders("all");
  };

  const hasActiveFilters =
    search || filterStatus !== "all" || filterOrders !== "all";

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
            Chargement des clients…
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
            Clients
          </h1>
          <p className="font-poppins text-sm text-dark/50 mt-1">
            Gérez vos clients, consultez leurs commandes et mettez à jour leurs
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
              {stats.totalRevenue.toLocaleString("fr-FR", {
                minimumFractionDigits: 2,
              })}{" "}
              TND
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Total clients
          </p>
          <p className="font-poppins text-2xl font-bold text-dark">
            {stats.total}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="font-poppins text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-1">
            Actifs
          </p>
          <p className="font-poppins text-2xl font-bold text-emerald-500">
            {stats.active}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="font-poppins text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Inactifs
          </p>
          <p className="font-poppins text-2xl font-bold text-gray-500">
            {stats.inactive}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="font-poppins text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-1">
            Suspendus
          </p>
          <p className="font-poppins text-2xl font-bold text-red-500">
            {stats.suspended}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="font-poppins text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">
            Avec commandes
          </p>
          <p className="font-poppins text-2xl font-bold text-primary">
            {stats.withOrders}
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
            placeholder="Rechercher par nom, email, tél…"
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
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
          <option value="suspended">Suspendu</option>
        </select>

        {/* Has orders filter */}
        <select
          value={filterOrders}
          onChange={(e) => setFilterOrders(e.target.value as FilterOrders)}
          className={selectClass}
        >
          <option value="all">Toutes les commandes</option>
          <option value="yes">Avec commandes</option>
          <option value="no">Sans commandes</option>
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
          {filtered.length} client{filtered.length !== 1 ? "s" : ""}
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
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="suspended">Suspendu</option>
            </select>
            <select
              value={filterOrders}
              onChange={(e) => setFilterOrders(e.target.value as FilterOrders)}
              className={selectClass + " w-full"}
            >
              <option value="all">Toutes les commandes</option>
              <option value="yes">Avec commandes</option>
              <option value="no">Sans commandes</option>
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
          {filtered.length} client{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Customer List — Desktop Table */}
      <CustomerTable
        customers={filtered}
        onView={handleView}
        onUpdateStatus={handleOpenStatusUpdate}
        onDelete={handleOpenDelete}
      />

      {/* Customer List — Mobile Cards */}
      <CustomerCard
        customers={filtered}
        onView={handleView}
        onUpdateStatus={handleOpenStatusUpdate}
        onDelete={handleOpenDelete}
      />

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        isOpen={!!viewingCustomer}
        customer={viewingCustomer}
        onClose={() => setViewingCustomer(null)}
        onUpdateStatus={handleUpdateStatus}
        saving={saving}
      />

      {/* Status Update Modal */}
      <CustomerStatusModal
        isOpen={!!statusTarget}
        customer={statusTarget}
        onClose={() => setStatusTarget(null)}
        onConfirm={handleUpdateStatus}
        saving={saving}
      />

      {/* Delete Confirmation Modal */}
      <DeleteCustomerModal
        isOpen={!!deleteTarget}
        customerName={
          deleteTarget
            ? `${deleteTarget.firstName} ${deleteTarget.lastName}`
            : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        saving={saving}
      />
    </>
  );
}
