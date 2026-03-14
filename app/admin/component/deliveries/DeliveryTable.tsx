"use client";

import type { DeliveryCompanyStatus } from "@/models/Delivery";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export interface AdminDeliveryCompany {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  price: number;
  status: DeliveryCompanyStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const COMPANY_STATUS_CONFIG: Record<
  DeliveryCompanyStatus,
  { label: string; dot: string; badge: string }
> = {
  active: {
    label: "Active",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-600",
  },
  inactive: {
    label: "Inactive",
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-500",
  },
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Props â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

interface DeliveryTableProps {
  companies: AdminDeliveryCompany[];
  onView: (company: AdminDeliveryCompany) => void;
  onEdit?: (company: AdminDeliveryCompany) => void;
  onDelete?: (company: AdminDeliveryCompany) => void;
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(price: number) {
  return price.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " TND";
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

export default function DeliveryTable({
  companies,
  onView,
  onEdit,
  onDelete,
}: DeliveryTableProps) {
  if (companies.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-dark/5 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-dark/30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
            />
          </svg>
        </div>
        <p className="font-poppins text-dark/50 text-sm">
          Aucune société de livraison pour le moment.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
                Société
              </th>
              <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
                Téléphone
              </th>
              <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
                Email
              </th>
              <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
                Prix
              </th>
              <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
                Statut
              </th>
              <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
                Date
              </th>
              <th className="text-right font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => {
              const statusConf = COMPANY_STATUS_CONFIG[c.status];
              return (
                <tr
                  key={c.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-background/60 transition-colors duration-150"
                >
                  <td className="px-6 py-3.5">
                    <button
                      type="button"
                      onClick={() => onView(c)}
                      className="font-poppins text-sm font-medium text-dark hover:text-primary transition-colors duration-150 text-left"
                    >
                      {c.name}
                    </button>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-poppins text-sm text-dark/60">
                      {c.phone || "â€”"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-poppins text-sm text-dark/60">
                      {c.email || "â€”"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-poppins text-sm font-semibold text-dark">
                      {formatPrice(c.price)}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-poppins text-xs font-medium ${statusConf.badge}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`}
                      />
                      {statusConf.label}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-poppins text-sm text-dark/50">
                      {formatDate(c.createdAt)}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onView(c)}
                        className="p-1.5 rounded-lg text-dark/30 hover:text-dark hover:bg-dark/5 transition-colors duration-150"
                        title="Détails"
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
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(c)}
                          className="p-1.5 rounded-lg text-dark/30 hover:text-primary hover:bg-primary/5 transition-colors duration-150"
                          title="Modifier"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(c)}
                          className="p-1.5 rounded-lg text-dark/30 hover:text-red-500 hover:bg-red-50 transition-colors duration-150"
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
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {companies.map((c) => {
          const statusConf = COMPANY_STATUS_CONFIG[c.status];
          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl shadow-sm p-4 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onView(c)}
                    className="font-poppins text-sm font-semibold text-dark hover:text-primary transition-colors duration-150 text-left truncate block w-full"
                  >
                    {c.name}
                  </button>
                  <p className="font-poppins text-xs text-dark/40 mt-0.5">
                    {formatDate(c.createdAt)}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-poppins text-xs font-medium shrink-0 ${statusConf.badge}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`}
                  />
                  {statusConf.label}
                </span>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider">
                    Prix
                  </p>
                  <p className="font-poppins font-semibold text-dark">
                    {formatPrice(c.price)}
                  </p>
                </div>
                <div>
                  <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider">
                    Téléphone
                  </p>
                  <p className="font-poppins text-dark/60">
                    {c.phone || "â€”"}
                  </p>
                </div>
                {c.email && (
                  <div className="col-span-2">
                    <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider">
                      Email
                    </p>
                    <p className="font-poppins text-dark/60">{c.email}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => onView(c)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-dark/50 hover:text-dark hover:bg-dark/5 font-poppins text-xs font-medium transition-colors duration-150"
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
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(c)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-primary/60 hover:text-primary hover:bg-primary/5 font-poppins text-xs font-medium transition-colors duration-150"
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Modifier
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(c)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50 font-poppins text-xs font-medium transition-colors duration-150"
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
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
