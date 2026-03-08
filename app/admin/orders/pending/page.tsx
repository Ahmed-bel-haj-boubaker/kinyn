"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";

import OrderDetailModal from "../../component/orders/OrderDetailModal";
import StatusUpdateModal from "../../component/orders/StatusUpdateModal";
import Toast from "../../component/shared/Toast";
import { useToast } from "../../hooks/useToast";
import type { AdminOrder } from "../../component/orders/OrderTable";
import type { OrderStatus } from "@/models/Order";
import { ORDER_STATUS_CONFIG } from "../../component/orders/OrderTable";

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

/* ──────────────── Page ──────────────── */

export default function PendingOrdersPage() {
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

  /* Search */
  const [search, setSearch] = useState("");

  /* Modal state */
  const [viewingOrder, setViewingOrder] = useState<AdminOrder | null>(null);
  const [statusTarget, setStatusTarget] = useState<AdminOrder | null>(null);

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

  /* ── Filtered — only pending ── */

  const pendingOrders = useMemo(() => {
    let result = orders.filter((o) => o.status === "pending");
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.ref.toLowerCase().includes(q) ||
          o.userName.toLowerCase().includes(q) ||
          o.userEmail.toLowerCase().includes(q) ||
          o.shippingAddress.phone.includes(q),
      );
    }
    return result;
  }, [orders, search]);

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

  /* Quick confirm handler */
  const handleQuickConfirm = useCallback(
    async (order: AdminOrder) => {
      await handleUpdateStatus(order.id, "confirmed");
    },
    [handleUpdateStatus],
  );

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
            Chargement des commandes en attente…
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
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 font-poppins text-xs text-dark/40 mb-2">
            <Link
              href="/admin/orders"
              className="hover:text-dark/60 transition-colors duration-150"
            >
              Commandes
            </Link>
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="text-dark/60">En attente</span>
          </div>
          <h1 className="font-erotique text-3xl sm:text-4xl text-dark">
            Commandes en attente
          </h1>
          <p className="font-poppins text-sm text-dark/50 mt-1">
            Validez ou traitez les nouvelles commandes reçues.
          </p>
        </div>

        {/* Back + stats badge */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark/60 hover:text-dark hover:border-gray-300 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/10 shrink-0"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Toutes les commandes
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-amber-400">
          <p className="font-poppins text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-1">
            En attente
          </p>
          <p className="font-poppins text-3xl font-bold text-amber-500">
            {stats.pending}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Total commandes
          </p>
          <p className="font-poppins text-2xl font-bold text-dark">
            {stats.total}
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
          <p className="font-poppins text-[10px] font-semibold text-primary/60 uppercase tracking-wider mb-1">
            Revenu total
          </p>
          <p className="font-poppins text-2xl font-bold text-primary">
            {stats.revenue.toLocaleString("fr-FR", {
              minimumFractionDigits: 2,
            })}{" "}
            <span className="text-sm font-semibold">TND</span>
          </p>
        </div>
      </div>

      {/* Quick actions info */}
      {pendingOrders.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 mb-6 bg-amber-50 border border-amber-100 rounded-xl">
          <svg
            className="w-5 h-5 text-amber-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="font-poppins text-sm text-amber-700">
            <strong>{pendingOrders.length}</strong> commande
            {pendingOrders.length > 1 ? "s" : ""} en attente de validation.
            Cliquez sur une commande pour la consulter ou utilisez le bouton de
            confirmation rapide.
          </p>
        </div>
      )}

      {/* Search bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
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
            placeholder="Rechercher par réf, client, téléphone…"
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200"
          />
        </div>

        {/* Count badge */}
        <span className="ml-auto font-poppins text-xs text-dark/40 hidden sm:block">
          {pendingOrders.length} commande{pendingOrders.length !== 1 ? "s" : ""}{" "}
          en attente
        </span>
      </div>

      {/* Pending Orders — Desktop Table */}
      <div className="hidden md:block">
        {pendingOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-14 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="font-poppins text-lg font-semibold text-dark mb-1">
              Aucune commande en attente
            </p>
            <p className="font-poppins text-sm text-dark/40">
              Toutes les commandes ont été traitées. Bravo !
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
                    Commande
                  </th>
                  <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-4 py-4">
                    Client
                  </th>
                  <th className="hidden lg:table-cell text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-4 py-4">
                    Téléphone
                  </th>
                  <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-4 py-4">
                    Montant
                  </th>
                  <th className="hidden lg:table-cell text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-4 py-4">
                    Paiement
                  </th>
                  <th className="hidden xl:table-cell text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-4 py-4">
                    Date
                  </th>
                  <th className="text-right font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.map((o) => {
                  const itemCount = o.items.reduce((a, i) => a + i.quantity, 0);
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-background/60 transition-colors duration-150 cursor-pointer"
                      onClick={() => handleView(o)}
                    >
                      {/* Order */}
                      <td className="px-6 py-3.5">
                        <div>
                          <p className="font-poppins text-sm font-semibold text-dark">
                            {o.ref}
                          </p>
                          <p className="font-poppins text-xs text-dark/40">
                            {itemCount} article{itemCount > 1 ? "s" : ""}
                          </p>
                        </div>
                      </td>
                      {/* Client */}
                      <td className="px-4 py-3.5">
                        <div className="min-w-0">
                          <p className="font-poppins text-sm font-medium text-dark truncate max-w-36">
                            {o.userName}
                          </p>
                          <p className="font-poppins text-xs text-dark/40 truncate max-w-36">
                            {o.userEmail}
                          </p>
                        </div>
                      </td>
                      {/* Phone */}
                      <td className="hidden lg:table-cell px-4 py-3.5">
                        <p className="font-poppins text-sm text-dark/70">
                          {o.shippingAddress.phone || "—"}
                        </p>
                      </td>
                      {/* Amount */}
                      <td className="px-4 py-3.5">
                        <span className="font-poppins text-sm font-semibold text-dark">
                          {o.totalAmount.toLocaleString("fr-FR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          TND
                        </span>
                      </td>
                      {/* Payment */}
                      <td className="hidden lg:table-cell px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 font-poppins text-xs font-medium px-2 py-0.5 rounded-full ${
                            o.paymentMethod === "cod"
                              ? "bg-orange-50 text-orange-600"
                              : "bg-green-50 text-green-600"
                          }`}
                        >
                          {o.paymentMethod === "cod"
                            ? "À la livraison"
                            : "Carte bancaire"}
                        </span>
                      </td>
                      {/* Date */}
                      <td className="hidden xl:table-cell px-4 py-3.5">
                        <p className="font-poppins text-sm text-dark/60">
                          {new Date(o.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <p className="font-poppins text-xs text-dark/30">
                          {new Date(o.createdAt).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </td>
                      {/* Actions */}
                      <td className="px-6 py-3.5 text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleQuickConfirm(o)}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white font-poppins text-xs font-medium hover:bg-blue-600 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                            title="Confirmer la commande"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Confirmer
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenStatusUpdate(o)}
                            className="p-1.5 rounded-lg text-dark/30 hover:text-dark/60 hover:bg-dark/5 transition-colors duration-150 focus:outline-none"
                            title="Changer le statut"
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
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Orders — Mobile Cards */}
      <div className="md:hidden flex flex-col gap-3">
        {pendingOrders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
              <svg
                className="w-7 h-7 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="font-poppins text-sm font-semibold text-dark mb-1">
              Aucune commande en attente
            </p>
            <p className="font-poppins text-xs text-dark/40">
              Tout est à jour !
            </p>
          </div>
        ) : (
          pendingOrders.map((o) => {
            const itemCount = o.items.reduce((a, i) => a + i.quantity, 0);
            return (
              <div
                key={o.id}
                className="bg-white rounded-2xl shadow-sm p-4 border border-gray-50"
                onClick={() => handleView(o)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-poppins text-sm font-semibold text-dark">
                      {o.ref}
                    </p>
                    <p className="font-poppins text-xs text-dark/40 mt-0.5">
                      {new Date(o.createdAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 font-poppins text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    En attente
                  </span>
                </div>

                {/* Client info */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-poppins text-[10px] font-bold text-primary">
                      {o.userName
                        .split(" ")
                        .map((w) => w.charAt(0))
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-poppins text-sm font-medium text-dark truncate">
                      {o.userName}
                    </p>
                    <p className="font-poppins text-xs text-dark/40 truncate">
                      {o.shippingAddress.phone || o.userEmail}
                    </p>
                  </div>
                </div>

                {/* Items preview + amount */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-50">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {o.items.slice(0, 3).map((item, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-lg bg-dark/5 border-2 border-white shrink-0 overflow-hidden"
                        >
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg
                                className="w-3.5 h-3.5 text-dark/20"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="font-poppins text-xs text-dark/50">
                      {itemCount} article{itemCount > 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className="font-poppins text-sm font-bold text-dark">
                    {o.totalAmount.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    TND
                  </span>
                </div>

                {/* Footer with payment + quick actions */}
                <div
                  className="flex items-center justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center font-poppins text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        o.paymentMethod === "cod"
                          ? "bg-orange-50 text-orange-600"
                          : "bg-green-50 text-green-600"
                      }`}
                    >
                      {o.paymentMethod === "cod" ? "COD" : "Carte"}
                    </span>
                    <span className="font-poppins text-[10px] text-dark/30">
                      {o.shippingMethod === "express" ? "Express" : "Standard"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickConfirm(o)}
                      disabled={saving}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500 text-white font-poppins text-xs font-medium hover:bg-blue-600 transition-colors duration-150 focus:outline-none disabled:opacity-50"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Confirmer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenStatusUpdate(o)}
                      className="p-1.5 rounded-lg text-dark/30 hover:text-dark/60 hover:bg-dark/5 transition-colors duration-150 focus:outline-none"
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
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={!!viewingOrder}
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
        onUpdateStatus={handleUpdateStatus}
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
    </>
  );
}
