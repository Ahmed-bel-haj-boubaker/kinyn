"use client";

import { useEffect, useState } from "react";
import type { AdminCustomer } from "./CustomerTable";
import { CUSTOMER_STATUS_CONFIG } from "./CustomerTable";
import type { UserStatus } from "@/models/User";

/* ──────────────── Props ──────────────── */

interface StatusUpdateModalProps {
  isOpen: boolean;
  customer: AdminCustomer | null;
  onClose: () => void;
  onConfirm: (customerId: string, newStatus: UserStatus) => Promise<void>;
  saving: boolean;
}

/* ──────────────── Component ──────────────── */

export default function CustomerStatusModal({
  isOpen,
  customer,
  onClose,
  onConfirm,
  saving,
}: StatusUpdateModalProps) {
  const [selected, setSelected] = useState<UserStatus | null>(null);
  const [prevCustomerId, setPrevCustomerId] = useState<string | null>(null);

  const currentId = customer?.id ?? null;
  if (currentId !== prevCustomerId) {
    setPrevCustomerId(currentId);
    if (selected !== null) {
      setSelected(null);
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
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

  if (!customer) return null;

  const statuses: UserStatus[] = ["active", "inactive", "suspended"];

  const handleConfirm = () => {
    if (!selected || selected === customer.status) return;
    onConfirm(customer.id, selected);
  };

  return (
    <div
      className={`fixed inset-0 z-60 flex items-center justify-center px-4 transition-all duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Changer le statut"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 sm:p-6 transition-all duration-300 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <h3 className="font-poppins text-lg font-semibold text-dark mb-1">
          Changer le statut
        </h3>
        <p className="font-poppins text-sm text-dark/50 mb-5">
          {customer.firstName} {customer.lastName}
        </p>

        {/* Current status */}
        <p className="font-poppins text-xs text-dark/40 mb-2">Statut actuel</p>
        <div className="mb-5">
          <span
            className={`inline-flex items-center gap-1.5 font-poppins text-sm font-medium px-3 py-1 rounded-full ${CUSTOMER_STATUS_CONFIG[customer.status].badge}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${CUSTOMER_STATUS_CONFIG[customer.status].dot}`}
            />
            {CUSTOMER_STATUS_CONFIG[customer.status].label}
          </span>
        </div>

        {/* Status options */}
        <p className="font-poppins text-xs text-dark/40 mb-2">Nouveau statut</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {statuses.map((s) => {
            const cfg = CUSTOMER_STATUS_CONFIG[s];
            const isActive = selected === s;
            const isCurrent = customer.status === s;
            return (
              <button
                key={s}
                type="button"
                disabled={isCurrent}
                onClick={() => setSelected(s)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-poppins text-sm font-medium border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-30 disabled:cursor-not-allowed ${
                  isActive
                    ? "border-primary bg-primary/5 text-dark"
                    : "border-gray-200 text-dark/60 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 font-poppins text-sm font-medium text-dark hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-dark/10 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selected || selected === customer.status || saving}
            className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white font-poppins text-sm font-medium hover:bg-primary/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Enregistrement…" : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}
