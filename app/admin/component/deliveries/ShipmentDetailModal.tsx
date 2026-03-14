"use client";

import { useEffect } from "react";
import type { AdminShipment } from "./ShipmentTable";
import { SHIPMENT_STATUS_CONFIG } from "./ShipmentTable";
import type { ShipmentStatus } from "@/models/Shipment";

interface ShipmentDetailModalProps {
  isOpen: boolean;
  shipment: AdminShipment | null;
  onClose: () => void;
  onUpdateStatus?: (shipmentId: string, newStatus: ShipmentStatus) => void;
  saving?: boolean;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── Status timeline steps (excluding failed) ── */
const TIMELINE_STEPS: { status: ShipmentStatus; label: string }[] = [
  { status: "pending", label: "En attente" },
  { status: "picked_up", label: "Récupéré" },
  { status: "in_transit", label: "En transit" },
  { status: "delivered", label: "Livré" },
];

function getStepIndex(status: ShipmentStatus): number {
  if (status === "failed") return -1;
  return TIMELINE_STEPS.findIndex((s) => s.status === status);
}

export default function ShipmentDetailModal({
  isOpen,
  shipment,
  onClose,
  onUpdateStatus,
  saving,
}: ShipmentDetailModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  return (
    <div
      className={`fixed inset-0 z-90 flex items-center justify-center px-4 transition-all duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Détails de l'expédition"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto transition-all duration-300 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {shipment && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 sm:px-8 sm:pt-8">
              <h2 className="font-erotique text-2xl text-dark">
                Détails de l&apos;expédition
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-dark/5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-dark/10"
                aria-label="Fermer"
              >
                <svg
                  className="w-5 h-5 text-dark/50"
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
              </button>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8 pt-5 sm:pt-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                {(() => {
                  const conf = SHIPMENT_STATUS_CONFIG[shipment.status];
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-poppins text-sm font-medium ${conf.badge}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
                      {conf.label}
                    </span>
                  );
                })()}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-background/60 rounded-xl p-4">
                  <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-1">
                    Commande
                  </p>
                  <p className="font-poppins text-sm font-semibold text-dark">
                    {shipment.orderRef || shipment.order}
                  </p>
                </div>
                <div className="bg-background/60 rounded-xl p-4">
                  <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-1">
                    Société
                  </p>
                  <p className="font-poppins text-sm font-semibold text-dark">
                    {shipment.companyName}
                  </p>
                </div>
                {shipment.companyPhone && (
                  <div className="bg-background/60 rounded-xl p-4">
                    <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-1">
                      Tél. société
                    </p>
                    <p className="font-poppins text-sm text-dark">
                      {shipment.companyPhone}
                    </p>
                  </div>
                )}
                <div className="bg-background/60 rounded-xl p-4">
                  <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-1">
                    N° Suivi
                  </p>
                  <p className="font-poppins text-sm text-dark">
                    {shipment.trackingNumber || (
                      <span className="text-dark/40">—</span>
                    )}
                  </p>
                </div>
                <div className="bg-background/60 rounded-xl p-4">
                  <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-1">
                    Créée le
                  </p>
                  <p className="font-poppins text-sm text-dark">
                    {formatDate(shipment.createdAt)}
                  </p>
                </div>
                <div className="bg-background/60 rounded-xl p-4">
                  <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-1">
                    Mise à jour
                  </p>
                  <p className="font-poppins text-sm text-dark">
                    {formatDate(shipment.updatedAt)}
                  </p>
                </div>
              </div>

              {/* Status Timeline */}
              {shipment.status !== "failed" && (
                <div>
                  <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-3">
                    Progression
                  </p>
                  <div className="flex items-center gap-0">
                    {TIMELINE_STEPS.map((step, idx) => {
                      const currentIdx = getStepIndex(shipment.status);
                      const done = idx <= currentIdx;
                      const isLast = idx === TIMELINE_STEPS.length - 1;
                      return (
                        <div
                          key={step.status}
                          className={`flex items-center ${isLast ? "" : "flex-1"}`}
                        >
                          {/* Circle */}
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                              done
                                ? "bg-primary text-white"
                                : "bg-gray-200 text-dark/30"
                            }`}
                          >
                            {done ? (
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : (
                              <span className="font-poppins text-xs font-bold">
                                {idx + 1}
                              </span>
                            )}
                          </div>
                          {/* Line */}
                          {!isLast && (
                            <div
                              className={`flex-1 h-0.5 transition-colors ${
                                idx < currentIdx ? "bg-primary" : "bg-gray-200"
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Labels */}
                  <div className="flex justify-between mt-2">
                    {TIMELINE_STEPS.map((step) => (
                      <p
                        key={step.status}
                        className="font-poppins text-[10px] text-dark/40 text-center"
                        style={{ width: `${100 / TIMELINE_STEPS.length}%` }}
                      >
                        {step.label}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Failed notice */}
              {shipment.status === "failed" && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="font-poppins text-sm text-red-600 font-medium">
                    Cette expédition a échoué.
                  </p>
                </div>
              )}

              {/* Quick Status Update */}
              {onUpdateStatus && (
                <div>
                  <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-3">
                    Changer le statut
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      Object.keys(SHIPMENT_STATUS_CONFIG) as ShipmentStatus[]
                    ).map((s) => {
                      const conf = SHIPMENT_STATUS_CONFIG[s];
                      const isCurrent = s === shipment.status;
                      return (
                        <button
                          key={s}
                          type="button"
                          disabled={isCurrent || saving}
                          onClick={() => onUpdateStatus(shipment.id, s)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-poppins text-xs font-medium transition-all duration-150 focus:outline-none ${
                            isCurrent
                              ? `${conf.badge} ring-2 ring-offset-1 ring-current cursor-default`
                              : `${conf.badge} opacity-60 hover:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed`
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${conf.dot}`}
                          />
                          {conf.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              {shipment.notes && (
                <div className="bg-background/60 rounded-xl p-4">
                  <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-1">
                    Notes
                  </p>
                  <p className="font-poppins text-sm text-dark/70 whitespace-pre-wrap">
                    {shipment.notes}
                  </p>
                </div>
              )}

              {/* Close button */}
              <button
                type="button"
                onClick={onClose}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 font-poppins text-sm font-medium text-dark hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-dark/10"
              >
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
