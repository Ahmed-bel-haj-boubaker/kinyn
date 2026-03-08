"use client";

import { useEffect, useRef } from "react";

/* ──────────────── Props ──────────────── */

interface DeleteCustomerModalProps {
  isOpen: boolean;
  customerName: string;
  onCancel: () => void;
  onConfirm: () => void;
  saving: boolean;
}

/* ──────────────── Component ──────────────── */

export default function DeleteCustomerModal({
  isOpen,
  customerName,
  onCancel,
  onConfirm,
  saving,
}: DeleteCustomerModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      cancelRef.current?.focus();
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onCancel]);

  return (
    <div
      className={`fixed inset-0 z-60 flex items-center justify-center px-4 transition-all duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Confirmer la suppression"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 transition-all duration-300 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Warning Icon */}
        <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-5">
          <svg
            className="w-7 h-7 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h3 className="font-poppins text-lg font-semibold text-dark text-center">
          Supprimer le client
        </h3>
        <p className="font-poppins text-sm text-dark/60 text-center mt-2">
          Êtes-vous sûr de vouloir supprimer{" "}
          <span className="font-semibold text-dark">
            &ldquo;{customerName}&rdquo;
          </span>{" "}
          ? Cette action est irréversible et supprimera toutes les données du
          client.
        </p>
        <p className="font-poppins text-xs text-dark/40 text-center mt-2">
          Note : Les clients avec des commandes en cours ne peuvent pas être
          supprimés.
        </p>

        <div className="flex gap-3 mt-6">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 font-poppins text-sm font-medium text-dark hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-dark/10 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white font-poppins text-sm font-medium hover:bg-red-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
          >
            {saving ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}
