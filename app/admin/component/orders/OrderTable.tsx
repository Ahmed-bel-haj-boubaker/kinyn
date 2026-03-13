"use client";

import type { OrderStatus } from "@/models/Order";

/* ──────────────── Types ──────────────── */

export interface AdminOrder {
  id: string;
  ref: string;
  user: string;
  userName: string;
  userEmail: string;
  items: {
    product: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
  }[];
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: {
    firstName: string;
    lastName: string;
    phone: string;
    country: string;
    city: string;
    address: string;
    postalCode: string;
  };
  shippingMethod: "standard" | "express";
  paymentMethod: "card" | "cod";
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; dot: string; badge: string }
> = {
  pending: {
    label: "En attente",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-600",
  },
  confirmed: {
    label: "Confirmée",
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-600",
  },
  processing: {
    label: "En traitement",
    dot: "bg-indigo-500",
    badge: "bg-indigo-50 text-indigo-600",
  },
  shipped: {
    label: "Expédiée",
    dot: "bg-purple-500",
    badge: "bg-purple-50 text-purple-600",
  },
  delivered: {
    label: "Livrée",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-600",
  },
  cancelled: {
    label: "Annulée",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-600",
  },
  returned: {
    label: "Retournée",
    dot: "bg-gray-500",
    badge: "bg-gray-100 text-gray-600",
  },
};

/* ──────────────── Props ──────────────── */

interface OrderTableProps {
  orders: AdminOrder[];
  onView: (order: AdminOrder) => void;
  onUpdateStatus?: (order: AdminOrder) => void;
  onDelete?: (order: AdminOrder) => void;
}

/* ──────────────── Helpers ──────────────── */

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ──────────────── Component ──────────────── */

export default function OrderTable({
  orders,
  onView,
  onUpdateStatus,
  onDelete,
}: OrderTableProps) {
  if (orders.length === 0) {
    return (
      <div className="hidden md:block bg-white rounded-2xl shadow-sm p-14 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-dark/5 flex items-center justify-center mb-3">
          <svg
            className="w-7 h-7 text-dark/30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="font-poppins text-dark/50 text-sm">
          Aucune commande trouvée.
        </p>
      </div>
    );
  }

  return (
    <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-x-auto">
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
              Articles
            </th>
            <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-4 py-4">
              Total
            </th>
            <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-4 py-4">
              Statut
            </th>
            <th className="hidden lg:table-cell text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-4 py-4">
              Date
            </th>
            <th className="text-right font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const st = ORDER_STATUS_CONFIG[o.status];
            const itemCount = o.items.reduce((a, i) => a + i.quantity, 0);
            return (
              <tr
                key={o.id}
                className="border-b border-gray-50 last:border-0 hover:bg-background/60 transition-colors duration-150 cursor-pointer"
                onClick={() => onView(o)}
              >
                {/* Order Ref */}
                <td className="px-6 py-3.5">
                  <div>
                    <p className="font-poppins text-sm font-semibold text-dark">
                      {o.ref}
                    </p>
                    <p className="font-poppins text-xs text-dark/40 mt-0.5">
                      {o.paymentMethod === "cod"
                        ? "Paiement à la livraison"
                        : "Carte bancaire"}
                    </p>
                  </div>
                </td>
                {/* Client */}
                <td className="px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="font-poppins text-sm font-medium text-dark truncate max-w-28 lg:max-w-40">
                      {o.userName || "—"}
                    </p>
                    <p className="hidden lg:block font-poppins text-xs text-dark/40 truncate max-w-40">
                      {o.userEmail || o.user}
                    </p>
                  </div>
                </td>
                {/* Items */}
                <td className="hidden lg:table-cell px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    {/* Stacked item thumbnails (max 3) */}
                    <div className="flex -space-x-2">
                      {o.items.slice(0, 3).map((item, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-lg bg-dark/5 border-2 border-white shrink-0 flex items-center justify-center overflow-hidden"
                        >
                          {item.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
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
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="font-poppins text-xs text-dark/50">
                      {itemCount} article{itemCount > 1 ? "s" : ""}
                    </span>
                  </div>
                </td>
                {/* Total */}
                <td className="px-4 py-3.5">
                  <span className="font-poppins text-sm font-semibold text-dark">
                    {o.totalAmount.toFixed(2)} TND
                  </span>
                </td>
                {/* Status */}
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 font-poppins text-xs font-medium px-2.5 py-1 rounded-full ${st.badge}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                </td>
                {/* Date */}
                <td className="hidden lg:table-cell px-4 py-3.5">
                  <div>
                    <p className="font-poppins text-sm text-dark/70">
                      {formatDate(o.createdAt)}
                    </p>
                    <p className="font-poppins text-xs text-dark/40">
                      {formatTime(o.createdAt)}
                    </p>
                  </div>
                </td>
                {/* Actions */}
                <td className="px-6 py-3.5">
                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onView(o)}
                      className="p-2 rounded-lg text-dark/40 hover:text-primary hover:bg-primary/5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label={`Voir commande ${o.ref}`}
                      title="Voir les détails"
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateStatus?.(o)}
                      className="p-2 rounded-lg text-dark/40 hover:text-primary hover:bg-primary/5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label={`Modifier statut ${o.ref}`}
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
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete?.(o)}
                      className="p-2 rounded-lg text-dark/40 hover:text-red-500 hover:bg-red-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-200"
                      aria-label={`Supprimer commande ${o.ref}`}
                      title="Supprimer"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
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
  );
}
