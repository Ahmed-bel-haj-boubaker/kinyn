"use client";

import { useEffect } from "react";
import type { AdminDeliveryCompany } from "./DeliveryTable";
import { COMPANY_STATUS_CONFIG } from "./DeliveryTable";

interface DeliveryDetailModalProps {
  isOpen: boolean;
  company: AdminDeliveryCompany | null;
  onClose: () => void;
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

function formatPrice(price: number) {
  return price.toLocaleString("fr-FR", { minimumFractionDigits: 2 }) + " TND";
}

export default function DeliveryDetailModal({
  isOpen,
  company,
  onClose,
}: DeliveryDetailModalProps) {
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
      aria-label="Détails de la société"
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
        {company && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 sm:px-8 sm:pt-8">
              <h2 className="font-erotique text-2xl text-dark">
                Détails de la société
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
                  const statusConf = COMPANY_STATUS_CONFIG[company.status];
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-poppins text-sm font-medium ${statusConf.badge}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${statusConf.dot}`}
                      />
                      {statusConf.label}
                    </span>
                  );
                })()}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-background/60 rounded-xl p-4">
                  <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-1">
                    Société
                  </p>
                  <p className="font-poppins text-sm font-semibold text-dark">
                    {company.name}
                  </p>
                </div>
                <div className="bg-background/60 rounded-xl p-4">
                  <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-1">
                    Prix
                  </p>
                  <p className="font-poppins text-sm font-semibold text-primary">
                    {formatPrice(company.price)}
                  </p>
                </div>
                <div className="bg-background/60 rounded-xl p-4">
                  <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-1">
                    Téléphone
                  </p>
                  <p className="font-poppins text-sm text-dark">
                    {company.phone || <span className="text-dark/40">—</span>}
                  </p>
                </div>
                <div className="bg-background/60 rounded-xl p-4">
                  <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-1">
                    Email
                  </p>
                  <p className="font-poppins text-sm text-dark">
                    {company.email || <span className="text-dark/40">—</span>}
                  </p>
                </div>
                {company.address && (
                  <div className="bg-background/60 rounded-xl p-4 sm:col-span-2">
                    <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-1">
                      Adresse
                    </p>
                    <p className="font-poppins text-sm text-dark">
                      {company.address}
                    </p>
                  </div>
                )}
                <div className="bg-background/60 rounded-xl p-4">
                  <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-1">
                    Créée le
                  </p>
                  <p className="font-poppins text-sm text-dark">
                    {formatDate(company.createdAt)}
                  </p>
                </div>
                <div className="bg-background/60 rounded-xl p-4">
                  <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-1">
                    Mise à jour
                  </p>
                  <p className="font-poppins text-sm text-dark">
                    {formatDate(company.updatedAt)}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {company.notes && (
                <div className="bg-background/60 rounded-xl p-4">
                  <p className="font-poppins text-[10px] font-semibold text-dark/40 uppercase tracking-wider mb-1">
                    Notes
                  </p>
                  <p className="font-poppins text-sm text-dark/70 whitespace-pre-wrap">
                    {company.notes}
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
