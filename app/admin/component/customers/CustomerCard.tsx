"use client";

import type { AdminCustomer } from "./CustomerTable";
import { CUSTOMER_STATUS_CONFIG } from "./CustomerTable";

/* ──────────────── Props ──────────────── */

interface CustomerCardProps {
  customers: AdminCustomer[];
  onView: (c: AdminCustomer) => void;
  onUpdateStatus: (c: AdminCustomer) => void;
  onDelete: (c: AdminCustomer) => void;
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

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

/* ──────────────── Component ──────────────── */

export default function CustomerCard({
  customers,
  onView,
  onUpdateStatus,
  onDelete,
}: CustomerCardProps) {
  if (customers.length === 0) {
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <p className="font-poppins text-dark/50 text-sm">
          Aucun client trouvé.
        </p>
      </div>
    );
  }

  return (
    <div className="md:hidden flex flex-col gap-3">
      {customers.map((c) => {
        const st = CUSTOMER_STATUS_CONFIG[c.status];
        return (
          <div
            key={c.id}
            className="bg-white rounded-2xl shadow-sm p-4 border border-gray-50"
            onClick={() => onView(c)}
          >
            {/* Header row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {c.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.avatar}
                      alt={`${c.firstName} ${c.lastName}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="font-poppins text-sm font-bold text-primary">
                      {getInitials(c.firstName, c.lastName)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-poppins text-sm font-semibold text-dark truncate">
                    {c.firstName} {c.lastName}
                  </p>
                  <p className="font-poppins text-xs text-dark/40 truncate">
                    {c.email}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 font-poppins text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ml-2 ${st.badge}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-3 gap-3 mb-3 border-t border-gray-50 pt-3">
              <div>
                <p className="font-poppins text-xs text-dark/40">Commandes</p>
                <p className="font-poppins text-sm font-semibold text-dark mt-1">
                  {c.totalOrders}
                </p>
              </div>
              <div>
                <p className="font-poppins text-xs text-dark/40">Dépensé</p>
                <p className="font-poppins text-sm font-semibold text-dark mt-1">
                  {c.totalSpent.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  TND
                </p>
              </div>
              <div>
                <p className="font-poppins text-xs text-dark/40">Inscrit le</p>
                <p className="font-poppins text-xs text-dark/60 mt-1">
                  {formatDate(c.createdAt)}
                </p>
              </div>
            </div>

            {/* Phone */}
            {c.phone && (
              <div className="mb-3 border-t border-gray-50 pt-3">
                <p className="font-poppins text-xs text-dark/40">Téléphone</p>
                <p className="font-poppins text-sm text-dark/70 mt-0.5">
                  {c.phone}
                </p>
              </div>
            )}

            {/* Actions */}
            <div
              className="flex items-center gap-2 border-t border-gray-50 pt-3"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => onView(c)}
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
                onClick={() => onUpdateStatus(c)}
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
              <button
                type="button"
                onClick={() => onDelete(c)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 font-poppins text-xs font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-200"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
