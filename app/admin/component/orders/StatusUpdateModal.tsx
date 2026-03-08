"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminOrder } from "./OrderTable";
import { ORDER_STATUS_CONFIG } from "./OrderTable";
import type { OrderStatus } from "@/models/Order";

/* ──────────────── Props ──────────────── */

interface StatusUpdateModalProps {
  isOpen: boolean;
  order: AdminOrder | null;
  onClose: () => void;
  onConfirm: (orderId: string, status: OrderStatus) => Promise<void>;
  saving: boolean;
}

const ALL_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

/* ──────────────── Component ──────────────── */

export default function StatusUpdateModal({
  isOpen,
  order,
  onClose,
  onConfirm,
  saving,
}: StatusUpdateModalProps) {
  const [selected, setSelected] = useState<OrderStatus>("pending");
  const cancelRef = useRef<HTMLButtonElement>(null);
  const prevOrderIdRef = useRef<string | null>(null);

  /* Sync selected status when order changes (avoids setState-in-effect lint) */
  const orderId = order?.id ?? null;
  const orderStatus = order?.status ?? "pending";
  if (orderId !== prevOrderIdRef.current) {
    prevOrderIdRef.current = orderId;
    if (orderId) {
      setSelected(orderStatus);
    }
  }

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
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!order) return null;

  return (
    <div
      className={`fixed inset-0 z-90 flex items-center justify-center px-4 transition-all duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Modifier le statut"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 sm:p-8 transition-all duration-300 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Icon */}
        <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
          <svg
            className="w-7 h-7 text-primary"
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
        </div>

        <h3 className="font-poppins text-lg font-semibold text-dark text-center">
          Modifier le statut
        </h3>
        <p className="font-poppins text-sm text-dark/60 text-center mt-1 mb-5">
          Commande <span className="font-semibold text-dark">{order.ref}</span>
        </p>

        {/* Status grid */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {ALL_STATUSES.map((s) => {
            const cfg = ORDER_STATUS_CONFIG[s];
            const isSelected = selected === s;
            const isCurrent = order.status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSelected(s)}
                className={`inline-flex items-center gap-1.5 font-poppins text-xs font-medium px-3 py-2 rounded-full border-2 transition-all duration-150 ${
                  isSelected
                    ? `${cfg.badge} border-current shadow-sm`
                    : "bg-white text-dark/50 border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${isSelected ? cfg.dot : "bg-dark/20"}`}
                />
                {cfg.label}
                {isCurrent && (
                  <span className="text-[9px] text-dark/30 ml-0.5">
                    (actuel)
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Warning for cancel */}
        {selected === "cancelled" && order.status !== "cancelled" && (
          <div className="bg-red-50 rounded-lg p-3 mb-4 flex items-start gap-2">
            <svg
              className="w-4 h-4 text-red-500 shrink-0 mt-0.5"
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
            <p className="font-poppins text-xs text-red-600">
              L&apos;annulation restaurera le stock des articles commandés.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 font-poppins text-sm font-medium text-dark hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-dark/10"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onConfirm(order.id, selected)}
            disabled={saving || selected === order.status}
            className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white font-poppins text-sm font-medium hover:bg-primary/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving && (
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
            )}
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
