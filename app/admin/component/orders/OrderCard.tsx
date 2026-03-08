"use client";

import type { AdminOrder } from "./OrderTable";
import { ORDER_STATUS_CONFIG } from "./OrderTable";

/* ──────────────── Props ──────────────── */

interface OrderCardProps {
  orders: AdminOrder[];
  onView: (order: AdminOrder) => void;
  onUpdateStatus: (order: AdminOrder) => void;
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

/* ──────────────── Component ──────────────── */

export default function OrderCard({
  orders,
  onView,
  onUpdateStatus,
}: OrderCardProps) {
  if (orders.length === 0) {
    return (
      <div className="md:hidden bg-white rounded-2xl shadow-sm p-10 text-center">
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
    <div className="md:hidden flex flex-col gap-3">
      {orders.map((o) => {
        const st = ORDER_STATUS_CONFIG[o.status];
        const itemCount = o.items.reduce((a, i) => a + i.quantity, 0);
        return (
          <div
            key={o.id}
            className="bg-white rounded-2xl shadow-sm p-4 border border-gray-50"
            onClick={() => onView(o)}
          >
            {/* Header row */}
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0 flex-1">
                <p className="font-poppins text-sm font-semibold text-dark">
                  {o.ref}
                </p>
                <p className="font-poppins text-xs text-dark/40 mt-0.5">
                  {formatDate(o.createdAt)}
                </p>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 font-poppins text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${st.badge}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
            </div>

            {/* Client info */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="font-poppins text-xs font-bold text-primary uppercase">
                  {(o.userName || o.userEmail || "?").charAt(0)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-poppins text-sm font-medium text-dark truncate">
                  {o.userName || "—"}
                </p>
                <p className="font-poppins text-xs text-dark/40 truncate">
                  {o.userEmail || o.user}
                </p>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-3 gap-3 mb-3 border-t border-gray-50 pt-3">
              <div>
                <p className="font-poppins text-xs text-dark/40">Articles</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex -space-x-1.5">
                    {o.items.slice(0, 2).map((item, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded bg-dark/5 border border-white shrink-0 flex items-center justify-center overflow-hidden"
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
                            className="w-3 h-3 text-dark/20"
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
                  <span className="font-poppins text-xs text-dark/60">
                    {itemCount}
                  </span>
                </div>
              </div>
              <div>
                <p className="font-poppins text-xs text-dark/40">Total</p>
                <p className="font-poppins text-sm font-semibold text-dark mt-1">
                  {o.totalAmount.toFixed(2)} TND
                </p>
              </div>
              <div>
                <p className="font-poppins text-xs text-dark/40">Paiement</p>
                <p className="font-poppins text-xs text-dark/60 mt-1">
                  {o.paymentMethod === "cod" ? "À la livraison" : "Carte"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div
              className="flex items-center gap-2 border-t border-gray-50 pt-3"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => onView(o)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-dark/5 text-dark/60 hover:bg-dark/10 font-poppins text-xs font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Détails
              </button>
              <button
                type="button"
                onClick={() => onUpdateStatus(o)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/5 text-primary/70 hover:bg-primary/10 font-poppins text-xs font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Statut
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
