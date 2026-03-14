"use client";

import type { ShipmentStatus } from "@/models/Shipment";

/* ──────────────── Types ──────────────── */

export interface AdminShipment {
  id: string;
  deliveryCompany: string;
  order: string;
  companyName: string;
  companyPhone: string;
  orderRef: string;
  status: ShipmentStatus;
  trackingNumber: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const SHIPMENT_STATUS_CONFIG: Record<
  ShipmentStatus,
  { label: string; dot: string; badge: string }
> = {
  pending: {
    label: "En attente",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-600",
  },
  picked_up: {
    label: "Récupéré",
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-600",
  },
  in_transit: {
    label: "En transit",
    dot: "bg-purple-500",
    badge: "bg-purple-50 text-purple-600",
  },
  delivered: {
    label: "Livré",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-600",
  },
  failed: {
    label: "Échoué",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-600",
  },
};

/* ──────────────── Props ──────────────── */

interface ShipmentTableProps {
  shipments: AdminShipment[];
  onView: (shipment: AdminShipment) => void;
  onEdit?: (shipment: AdminShipment) => void;
  onDelete?: (shipment: AdminShipment) => void;
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

export default function ShipmentTable({
  shipments,
  onView,
  onEdit,
  onDelete,
}: ShipmentTableProps) {
  if (shipments.length === 0) {
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
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <p className="font-poppins text-dark/50 text-sm">
          Aucune expédition pour le moment.
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
                Commande
              </th>
              <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
                Société
              </th>
              <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
                N° Suivi
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
            {shipments.map((s) => {
              const statusConf = SHIPMENT_STATUS_CONFIG[s.status];
              return (
                <tr
                  key={s.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-background/60 transition-colors duration-150"
                >
                  <td className="px-6 py-3.5">
                    <button
                      type="button"
                      onClick={() => onView(s)}
                      className="font-poppins text-xs font-medium text-primary bg-primary/5 px-2 py-1 rounded-md hover:bg-primary/10 transition-colors duration-150"
                    >
                      {s.orderRef}
                    </button>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-poppins text-sm font-medium text-dark">
                      {s.companyName}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="font-poppins text-sm text-dark/60">
                      {s.trackingNumber || "—"}
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
                      {formatDate(s.createdAt)}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onView(s)}
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
                          onClick={() => onEdit(s)}
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
                          onClick={() => onDelete(s)}
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
        {shipments.map((s) => {
          const statusConf = SHIPMENT_STATUS_CONFIG[s.status];
          return (
            <div
              key={s.id}
              className="bg-white rounded-2xl shadow-sm p-4 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onView(s)}
                    className="font-poppins text-xs font-medium text-primary bg-primary/5 px-2 py-1 rounded-md hover:bg-primary/10 transition-colors duration-150"
                  >
                    {s.orderRef}
                  </button>
                  <p className="font-poppins text-xs text-dark/40 mt-1">
                    {formatDate(s.createdAt)}
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
                    Société
                  </p>
                  <p className="font-poppins font-medium text-dark">
                    {s.companyName}
                  </p>
                </div>
                {s.trackingNumber && (
                  <div>
                    <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider">
                      N° Suivi
                    </p>
                    <p className="font-poppins text-dark/60">
                      {s.trackingNumber}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => onView(s)}
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
                    onClick={() => onEdit(s)}
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
                    onClick={() => onDelete(s)}
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
