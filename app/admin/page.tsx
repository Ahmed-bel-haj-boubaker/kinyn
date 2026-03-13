"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ──────────────── Types ──────────────── */

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

interface ProductStats {
  total: number;
  active: number;
  draft: number;
  outofstock: number;
  lowStock: number;
}

interface CustomerStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  withOrders: number;
  totalRevenue: number;
}

interface RecentOrder {
  id: string;
  ref: string;
  userName: string;
  userEmail: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface MonthlyRevenue {
  label: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  id: string;
  name: string;
  totalSold: number;
  totalRevenue: number;
  stock: number;
  image: string;
}

interface DashboardData {
  orderStats: OrderStats;
  productStats: ProductStats;
  customerStats: CustomerStats;
  recentOrders: RecentOrder[];
  monthlyRevenue: MonthlyRevenue[];
  topProducts: TopProduct[];
}

/* ──────────────── Status helpers ──────────────── */

const ORDER_STATUS: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  pending: { label: "En attente", bg: "bg-amber-50", text: "text-amber-700" },
  confirmed: { label: "Confirmée", bg: "bg-blue-50", text: "text-blue-700" },
  processing: {
    label: "En traitement",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
  },
  shipped: { label: "Expédiée", bg: "bg-purple-50", text: "text-purple-700" },
  delivered: { label: "Livrée", bg: "bg-emerald-50", text: "text-emerald-700" },
  cancelled: { label: "Annulée", bg: "bg-red-50", text: "text-red-700" },
  returned: { label: "Retournée", bg: "bg-gray-100", text: "text-gray-700" },
};

const fmt = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2 });

/* ──────────────── Page ──────────────── */

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (!res.ok) throw new Error("Erreur lors du chargement.");
        const json = await res.json();
        if (!json.success) throw new Error(json.error ?? "Erreur serveur.");
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Loading ── */
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
            Chargement du tableau de bord…
          </p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <div>
            <h3 className="font-poppins font-semibold text-red-900">Erreur</h3>
            <p className="font-poppins text-sm text-red-700 mt-0.5">
              {error ?? "Impossible de charger les données."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const {
    orderStats,
    productStats,
    customerStats,
    recentOrders,
    monthlyRevenue,
    topProducts,
  } = data;
  const maxMonthlyRevenue = Math.max(
    ...monthlyRevenue.map((m) => m.revenue),
    1,
  );

  return (
    <>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-erotique text-3xl sm:text-4xl text-dark">
            Vue d&apos;ensemble
          </h1>
          <p className="font-poppins text-sm text-dark/50 mt-1">
            Bienvenue ! Voici un résumé de votre boutique.
          </p>
        </div>
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
              {fmt(customerStats.totalRevenue)} TND
            </p>
          </div>
        </div>
      </div>

      {/* ── Top-level stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard
          href="/admin/orders"
          label="Commandes"
          value={orderStats.total}
          sub={`${orderStats.pending} en attente`}
          color="text-dark"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          }
        />
        <StatCard
          href="/admin/orders"
          label="Revenu"
          value={`${fmt(orderStats.revenue)} TND`}
          sub={`${orderStats.delivered} livrées`}
          color="text-primary"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          }
        />
        <StatCard
          href="/admin/products"
          label="Produits"
          value={productStats.total}
          sub={`${productStats.lowStock} stock faible`}
          color="text-dark"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          }
        />
        <StatCard
          href="/admin/customers"
          label="Clients"
          value={customerStats.total}
          sub={`${customerStats.active} actifs`}
          color="text-dark"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          }
        />
      </div>

      {/* ── Order Status + Monthly Revenue ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
        {/* Order Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-poppins text-sm font-semibold text-dark">
              Statuts des commandes
            </h2>
            <Link
              href="/admin/orders"
              className="font-poppins text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Voir tout →
            </Link>
          </div>
          <div className="space-y-3">
            {(
              [
                {
                  key: "pending",
                  label: "En attente",
                  color: "bg-amber-500",
                  value: orderStats.pending,
                },
                {
                  key: "confirmed",
                  label: "Confirmées",
                  color: "bg-blue-500",
                  value: orderStats.confirmed,
                },
                {
                  key: "processing",
                  label: "En traitement",
                  color: "bg-indigo-500",
                  value: orderStats.processing,
                },
                {
                  key: "shipped",
                  label: "Expédiées",
                  color: "bg-purple-500",
                  value: orderStats.shipped,
                },
                {
                  key: "delivered",
                  label: "Livrées",
                  color: "bg-emerald-500",
                  value: orderStats.delivered,
                },
                {
                  key: "cancelled",
                  label: "Annulées",
                  color: "bg-red-500",
                  value: orderStats.cancelled,
                },
                {
                  key: "returned",
                  label: "Retournées",
                  color: "bg-gray-400",
                  value: orderStats.returned,
                },
              ] as const
            ).map((s) => {
              const pct =
                orderStats.total > 0 ? (s.value / orderStats.total) * 100 : 0;
              return (
                <div key={s.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-poppins text-xs text-dark/60">
                      {s.label}
                    </span>
                    <span className="font-poppins text-xs font-semibold text-dark">
                      {s.value}{" "}
                      <span className="text-dark/30 font-normal">
                        ({pct.toFixed(0)}%)
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`${s.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6">
          <h2 className="font-poppins text-sm font-semibold text-dark mb-5">
            Revenu mensuel
          </h2>
          <div className="flex items-end gap-2 sm:gap-3 h-44">
            {monthlyRevenue.map((m) => {
              const pct =
                maxMonthlyRevenue > 0
                  ? (m.revenue / maxMonthlyRevenue) * 100
                  : 0;
              return (
                <div
                  key={m.label}
                  className="flex-1 flex flex-col items-center gap-1.5"
                >
                  <span className="font-poppins text-[10px] font-semibold text-dark/60 leading-none">
                    {m.orders > 0 ? fmt(m.revenue) : "—"}
                  </span>
                  <div
                    className="w-full flex items-end"
                    style={{ height: "120px" }}
                  >
                    <div
                      className="w-full bg-primary/15 rounded-t-md hover:bg-primary/25 transition-colors duration-200 relative group"
                      style={{ height: `${Math.max(pct, 2)}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-dark text-white text-[10px] font-poppins px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {m.orders} cmd{m.orders !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <span className="font-poppins text-[11px] text-dark/40 leading-none">
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Product Status + Customer Status ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <MiniCard
          label="Produits actifs"
          value={productStats.active}
          color="text-emerald-600"
          href="/admin/products"
        />
        <MiniCard
          label="Brouillons"
          value={productStats.draft}
          color="text-dark/50"
          href="/admin/products"
        />
        <MiniCard
          label="Rupture de stock"
          value={productStats.outofstock}
          color="text-red-500"
          href="/admin/products"
        />
        <MiniCard
          label="Stock faible"
          value={productStats.lowStock}
          color="text-amber-500"
          href="/admin/products"
        />
      </div>

      {/* ── Top Products + Recent Orders ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
        {/* Top Products */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-5 sm:p-6 pb-0 sm:pb-0">
            <h2 className="font-poppins text-sm font-semibold text-dark">
              Meilleures ventes
            </h2>
            <Link
              href="/admin/products"
              className="font-poppins text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Voir tout →
            </Link>
          </div>
          <div className="p-5 sm:p-6 pt-4 sm:pt-4 space-y-3">
            {topProducts.length > 0 ? (
              topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="font-poppins text-xs font-bold text-dark/20 w-5 text-center shrink-0">
                    {i + 1}
                  </span>
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <svg
                        className="w-5 h-5 text-dark/20"
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
                  <div className="flex-1 min-w-0">
                    <p className="font-poppins text-sm text-dark truncate">
                      {p.name}
                    </p>
                    <p className="font-poppins text-xs text-dark/40">
                      {p.totalSold} vendu{p.totalSold !== 1 ? "s" : ""} ·{" "}
                      {fmt(p.totalRevenue)} TND
                    </p>
                  </div>
                  <span
                    className={`font-poppins text-xs font-semibold shrink-0 ${p.stock > 5 ? "text-emerald-600" : p.stock > 0 ? "text-amber-500" : "text-red-500"}`}
                  >
                    {p.stock} en stock
                  </span>
                </div>
              ))
            ) : (
              <p className="font-poppins text-sm text-dark/30 text-center py-6">
                Aucune donnée disponible
              </p>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-5 sm:p-6 pb-0 sm:pb-0">
            <h2 className="font-poppins text-sm font-semibold text-dark">
              Commandes récentes
            </h2>
            <Link
              href="/admin/orders"
              className="font-poppins text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Voir tout →
            </Link>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-3 text-left font-poppins text-[10px] font-semibold uppercase tracking-wider text-dark/40">
                    Réf
                  </th>
                  <th className="px-6 py-3 text-left font-poppins text-[10px] font-semibold uppercase tracking-wider text-dark/40">
                    Client
                  </th>
                  <th className="px-6 py-3 text-right font-poppins text-[10px] font-semibold uppercase tracking-wider text-dark/40">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left font-poppins text-[10px] font-semibold uppercase tracking-wider text-dark/40">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left font-poppins text-[10px] font-semibold uppercase tracking-wider text-dark/40">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((o) => {
                    const s = ORDER_STATUS[o.status] ?? ORDER_STATUS.pending;
                    return (
                      <tr
                        key={o.id}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-3.5">
                          <span className="font-poppins text-sm font-medium text-primary">
                            {o.ref}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="font-poppins text-sm text-dark">
                            {o.userName || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span className="font-poppins text-sm font-semibold text-dark">
                            {fmt(o.totalAmount)} TND
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.bg} ${s.text}`}
                          >
                            {s.label}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="font-poppins text-xs text-dark/40">
                            {new Date(o.createdAt).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center font-poppins text-sm text-dark/30"
                    >
                      Aucune commande pour le moment
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden p-4 space-y-3">
            {recentOrders.length > 0 ? (
              recentOrders.slice(0, 5).map((o) => {
                const s = ORDER_STATUS[o.status] ?? ORDER_STATUS.pending;
                return (
                  <div
                    key={o.id}
                    className="flex items-center gap-3 p-3 bg-gray-50/70 rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-poppins text-sm font-medium text-primary">
                        {o.ref}
                      </p>
                      <p className="font-poppins text-xs text-dark/40 truncate">
                        {o.userName || "—"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-poppins text-sm font-semibold text-dark">
                        {fmt(o.totalAmount)}
                      </p>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${s.bg} ${s.text}`}
                      >
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="font-poppins text-sm text-dark/30 text-center py-6">
                Aucune commande
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Customer summary row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
          <p className="font-poppins text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-1">
            Clients actifs
          </p>
          <p className="font-poppins text-2xl font-bold text-emerald-600">
            {customerStats.active}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
          <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Inactifs
          </p>
          <p className="font-poppins text-2xl font-bold text-dark/40">
            {customerStats.inactive}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
          <p className="font-poppins text-[10px] font-semibold text-red-500 uppercase tracking-wider mb-1">
            Suspendus
          </p>
          <p className="font-poppins text-2xl font-bold text-red-500">
            {customerStats.suspended}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
          <p className="font-poppins text-[10px] font-semibold text-blue-500 uppercase tracking-wider mb-1">
            Avec commandes
          </p>
          <p className="font-poppins text-2xl font-bold text-blue-600">
            {customerStats.withOrders}
          </p>
        </div>
      </div>
    </>
  );
}

/* ──────────────── StatCard ──────────────── */

function StatCard({
  href,
  label,
  value,
  sub,
  color,
  icon,
}: {
  href: string;
  label: string;
  value: string | number;
  sub: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="block group">
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-1">
              {label}
            </p>
            <p
              className={`font-poppins text-xl sm:text-2xl font-bold ${color} truncate`}
            >
              {value}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 ml-3 group-hover:bg-primary/10 transition-colors duration-200">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              {icon}
            </svg>
          </div>
        </div>
        <p className="font-poppins text-xs text-dark/40 mt-2">{sub}</p>
      </div>
    </Link>
  );
}

/* ──────────────── MiniCard ──────────────── */

function MiniCard({
  label,
  value,
  color,
  href,
}: {
  label: string;
  value: number;
  color: string;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <div className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow duration-200">
        <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className={`font-poppins text-2xl font-bold ${color}`}>{value}</p>
      </div>
    </Link>
  );
}
