"use client";

import type { DeliveryMethodStatus } from "@/models/DeliveryMethod";

/* ──────────────── Types ──────────────── */

export interface AdminDeliveryMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
  status: DeliveryMethodStatus;
  createdAt: string;
  updatedAt: string;
}

export const METHOD_STATUS_CONFIG: Record<
  DeliveryMethodStatus,
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

/* ──────────────── Props ──────────────── */

interface DeliveryMethodTableProps {
  methods: AdminDeliveryMethod[];
  onEdit?: (method: AdminDeliveryMethod) => void;
  onDelete?: (method: AdminDeliveryMethod) => void;
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

function formatPrice(price: number) {
  return price.toLocaleString("fr-FR", { minimumFractionDigits: 3 }) + " TND";
}

/* ──────────────── Component ──────────────── */

export default function DeliveryMethodTable({
  methods,
  onEdit,
  onDelete,
}: DeliveryMethodTableProps) {
  if (methods.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl shadow-sm">
        <svg
          className="w-12 h-12 text-dark/10 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-3.637c0-.298-.118-.585-.33-.796l-3.96-3.96A1.125 1.125 0 0015.862 8H14.25M2.25 14.25V6.375c0-.621.504-1.125 1.125-1.125h11.25c.621 0 1.125.504 1.125 1.125v8.25"
          />
        </svg>
        <p className="font-poppins text-sm text-dark/40">
          Aucune méthode de livraison trouvée
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-4 font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider">
                Méthode
              </th>
              <th className="text-left px-6 py-4 font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider">
                Prix
              </th>
              <th className="text-left px-6 py-4 font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider">
                Délai estimé
              </th>
              <th className="text-left px-6 py-4 font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider">
                Statut
              </th>
              <th className="text-left px-6 py-4 font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider">
                Créée le
              </th>
              {(onEdit || onDelete) && (
                <th className="text-right px-6 py-4 font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {methods.map((m) => {
              const st = METHOD_STATUS_CONFIG[m.status];
              return (
                <tr
                  key={m.id}
                  className="border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors duration-100"
                >
                  <td className="px-6 py-4">
                    <p className="font-poppins text-sm font-semibold text-dark">
                      {m.name}
                    </p>
                    {m.description && (
                      <p className="font-poppins text-xs text-dark/40 mt-0.5 truncate max-w-62.5">
                        {m.description}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-poppins text-sm font-semibold text-dark">
                      {formatPrice(m.price)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-poppins text-sm text-dark/60">
                      {m.estimatedDays || "—"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${st.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-poppins text-xs text-dark/40">
                      {formatDate(m.createdAt)}
                    </p>
                  </td>
                  {(onEdit || onDelete) && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(m)}
                            className="p-2 rounded-lg text-dark/30 hover:text-primary hover:bg-primary/5 transition-colors duration-150"
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
                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                              />
                            </svg>
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(m)}
                            className="p-2 rounded-lg text-dark/30 hover:text-red-500 hover:bg-red-50 transition-colors duration-150"
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
                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-50">
        {methods.map((m) => {
          const st = METHOD_STATUS_CONFIG[m.status];
          return (
            <div key={m.id} className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-poppins text-sm font-semibold text-dark">
                    {m.name}
                  </p>
                  {m.description && (
                    <p className="font-poppins text-xs text-dark/40 mt-0.5">
                      {m.description}
                    </p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${st.badge}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                  {st.label}
                </span>
              </div>
              <div className="flex items-center gap-4 mb-3">
                <p className="font-poppins text-sm font-semibold text-dark">
                  {formatPrice(m.price)}
                </p>
                {m.estimatedDays && (
                  <p className="font-poppins text-xs text-dark/40">
                    {m.estimatedDays}
                  </p>
                )}
              </div>
              {(onEdit || onDelete) && (
                <div className="flex items-center gap-2">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(m)}
                      className="flex-1 py-2 rounded-lg border border-gray-200 font-poppins text-xs font-medium text-dark/60 hover:border-primary hover:text-primary transition-colors duration-150"
                    >
                      Modifier
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(m)}
                      className="flex-1 py-2 rounded-lg border border-gray-200 font-poppins text-xs font-medium text-dark/60 hover:border-red-300 hover:text-red-500 transition-colors duration-150"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
