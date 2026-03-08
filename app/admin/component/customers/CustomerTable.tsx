"use client";

import type { UserStatus } from "@/models/User";

/* ──────────────── Types ──────────────── */

export interface AdminCustomer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: UserStatus;
  avatar: string;
  isEmailVerified: boolean;
  addresses: {
    id: string;
    label: string;
    country: string;
    city: string;
    address: string;
    postalCode: string;
    isDefault: boolean;
  }[];
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  lastLogin: string | null;
  createdAt: string;
}

export const CUSTOMER_STATUS_CONFIG: Record<
  UserStatus,
  { label: string; dot: string; badge: string }
> = {
  active: {
    label: "Actif",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-600",
  },
  inactive: {
    label: "Inactif",
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-600",
  },
  suspended: {
    label: "Suspendu",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-600",
  },
};

/* ──────────────── Props ──────────────── */

interface CustomerTableProps {
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

export default function CustomerTable({
  customers,
  onView,
  onUpdateStatus,
  onDelete,
}: CustomerTableProps) {
  if (customers.length === 0) {
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
    <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
              Client
            </th>
            <th className="hidden lg:table-cell text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-4 py-4">
              Téléphone
            </th>
            <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-4 py-4">
              Commandes
            </th>
            <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-4 py-4">
              Total dépensé
            </th>
            <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-4 py-4">
              Statut
            </th>
            <th className="hidden lg:table-cell text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-4 py-4">
              Inscription
            </th>
            <th className="text-right font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => {
            const st = CUSTOMER_STATUS_CONFIG[c.status];
            return (
              <tr
                key={c.id}
                className="border-b border-gray-50 last:border-0 hover:bg-background/60 transition-colors duration-150 cursor-pointer"
                onClick={() => onView(c)}
              >
                {/* Client */}
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {c.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.avatar}
                          alt={`${c.firstName} ${c.lastName}`}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <span className="font-poppins text-xs font-bold text-primary">
                          {getInitials(c.firstName, c.lastName)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-poppins text-sm font-medium text-dark truncate max-w-32 lg:max-w-48">
                        {c.firstName} {c.lastName}
                      </p>
                      <p className="font-poppins text-xs text-dark/40 truncate max-w-32 lg:max-w-48">
                        {c.email}
                      </p>
                    </div>
                  </div>
                </td>
                {/* Phone */}
                <td className="hidden lg:table-cell px-4 py-3.5">
                  <p className="font-poppins text-sm text-dark/70">
                    {c.phone || "—"}
                  </p>
                </td>
                {/* Orders */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-poppins text-sm font-semibold text-dark">
                      {c.totalOrders}
                    </span>
                    <span className="font-poppins text-xs text-dark/40">
                      cmd{c.totalOrders > 1 ? "s" : ""}
                    </span>
                  </div>
                </td>
                {/* Total Spent */}
                <td className="px-4 py-3.5">
                  <span className="font-poppins text-sm font-semibold text-dark">
                    {c.totalSpent.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    TND
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
                {/* Inscription Date */}
                <td className="hidden lg:table-cell px-4 py-3.5">
                  <p className="font-poppins text-sm text-dark/70">
                    {formatDate(c.createdAt)}
                  </p>
                </td>
                {/* Actions */}
                <td className="px-6 py-3.5">
                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onView(c)}
                      className="p-2 rounded-lg text-dark/40 hover:text-primary hover:bg-primary/5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label={`Voir ${c.firstName} ${c.lastName}`}
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
                      onClick={() => onUpdateStatus(c)}
                      className="p-2 rounded-lg text-dark/40 hover:text-primary hover:bg-primary/5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label={`Changer statut ${c.firstName}`}
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
                      onClick={() => onDelete(c)}
                      className="p-2 rounded-lg text-dark/40 hover:text-red-500 hover:bg-red-50 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-200"
                      aria-label={`Supprimer ${c.firstName}`}
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
