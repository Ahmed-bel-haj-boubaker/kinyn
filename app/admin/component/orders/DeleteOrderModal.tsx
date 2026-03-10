"use client";

import { useEffect, useRef } from "react";

interface DeleteOrderModalProps {
  isOpen: boolean;
  orderRef: string;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteOrderModal({
  isOpen,
  orderRef,
  saving,
  onCancel,
  onConfirm,
}: DeleteOrderModalProps) {
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
      if (e.key === "Escape" && isOpen && !saving) onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, saving, onCancel]);

  return (
    <div
      className={`fixed inset-0 z-90 flex items-center justify-center px-4 transition-all duration-300 ${
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
        onClick={saving ? undefined : onCancel}
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </div>

        <h3 className="font-poppins text-lg font-semibold text-dark text-center">
          Supprimer la commande
        </h3>
        <p className="font-poppins text-sm text-dark/60 text-center mt-2">
          Êtes-vous sûr de vouloir supprimer la commande{" "}
          <span className="font-semibold text-dark">{orderRef}</span> ? Cette
          action est irréversible.
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
            className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 font-poppins text-sm font-medium text-white hover:bg-red-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Suppression…
              </>
            ) : (
              "Supprimer"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
