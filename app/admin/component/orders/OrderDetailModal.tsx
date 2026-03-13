"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminOrder } from "./OrderTable";
import { ORDER_STATUS_CONFIG } from "./OrderTable";
import type { OrderStatus } from "@/models/Order";

/* ──────────────── Props ──────────────── */

interface OrderDetailModalProps {
  isOpen: boolean;
  order: AdminOrder | null;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, status: OrderStatus) => Promise<void>;
  saving: boolean;
}

/* ──────────────── Helpers ──────────────── */

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
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

/* ──────────────── Status Flow Timeline ──────────────── */

const STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

function getStepIndex(status: OrderStatus): number {
  if (status === "cancelled" || status === "returned") return -1;
  return STATUS_FLOW.indexOf(status);
}

/* ──────────────── Component ──────────────── */

export default function OrderDetailModal({
  isOpen,
  order,
  onClose,
  onUpdateStatus,
  saving,
}: OrderDetailModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("pending");
  const [showStatusChange, setShowStatusChange] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const prevOrderIdRef = useRef<string | null>(null);

  /* Sync selected status when order changes (avoids setState-in-effect lint) */
  const orderId = order?.id ?? null;
  const orderStatus = order?.status ?? "pending";
  if (orderId !== prevOrderIdRef.current) {
    prevOrderIdRef.current = orderId;
    if (orderId) {
      setSelectedStatus(orderStatus);
      setShowStatusChange(false);
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

  if (!order) return null;

  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status === "cancelled";
  const isReturned = order.status === "returned";
  const itemCount = order.items.reduce((a, i) => a + i.quantity, 0);

  const handleSaveStatus = async () => {
    if (selectedStatus !== order.status) {
      await onUpdateStatus?.(order.id, selectedStatus);
    }
    setShowStatusChange(false);
  };

  return (
    <div
      className={`fixed inset-0 z-90 flex items-end sm:items-center justify-center transition-all duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Détails de la commande"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-dark/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={`relative w-full sm:max-w-2xl flex flex-col bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl transition-all duration-300 max-h-[92dvh] sm:max-h-[90vh] sm:mx-4 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Header — sticky inside the card */}
        <div className="shrink-0 bg-white rounded-t-2xl border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-poppins text-base sm:text-lg font-semibold text-dark truncate">
                Commande {order.ref}
              </h2>
              <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
                <p className="font-poppins text-xs text-dark/40">
                  {formatDate(order.createdAt)} à {formatTime(order.createdAt)}
                </p>
                {(() => {
                  const st = ORDER_STATUS_CONFIG[order.status];
                  return (
                    <span
                      className={`inline-flex items-center gap-1 font-poppins text-xs font-medium px-2 py-0.5 rounded-full ${st.badge}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  );
                })()}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-dark/40 hover:text-dark hover:bg-dark/5 transition-colors duration-150 focus:outline-none shrink-0"
              aria-label="Fermer"
            >
              <svg
                className="w-5 h-5"
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
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 sm:py-5 space-y-5">
          {/* ─── Status Timeline ─── */}
          {!isCancelled && !isReturned && (
            <div className="bg-background rounded-xl p-4">
              <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-4">
                Progression
              </p>
              <div className="grid grid-cols-5">
                {STATUS_FLOW.map((s, i) => {
                  const cfg = ORDER_STATUS_CONFIG[s];
                  const isActive = i <= currentStep;
                  const isCurrent = i === currentStep;
                  const leftActive = i > 0 && i <= currentStep;
                  const rightActive =
                    i < STATUS_FLOW.length - 1 && i < currentStep;
                  return (
                    <div
                      key={s}
                      className="flex flex-col items-center relative"
                    >
                      {/* Left connector half */}
                      {i > 0 && (
                        <div
                          className={`absolute top-3.5 sm:top-4.5 left-0 right-1/2 h-0.5 transition-colors duration-300 ${
                            leftActive ? "bg-emerald-300" : "bg-gray-200"
                          }`}
                        />
                      )}
                      {/* Right connector half */}
                      {i < STATUS_FLOW.length - 1 && (
                        <div
                          className={`absolute top-3.5 sm:top-4.5 left-1/2 right-0 h-0.5 transition-colors duration-300 ${
                            rightActive ? "bg-emerald-300" : "bg-gray-200"
                          }`}
                        />
                      )}
                      {/* Circle */}
                      <div
                        className={`relative z-10 w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isCurrent
                            ? `${cfg.badge} ring-2 ring-offset-2 ring-current`
                            : isActive
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-gray-100 text-dark/20"
                        }`}
                      >
                        {isActive && !isCurrent ? (
                          <svg
                            className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        ) : (
                          <span className="font-poppins text-[10px] sm:text-xs font-bold">
                            {i + 1}
                          </span>
                        )}
                      </div>
                      {/* Label */}
                      <p
                        className={`font-poppins text-[8px] sm:text-[10px] mt-1 sm:mt-1.5 text-center leading-tight px-0.5 ${
                          isActive ? "text-dark font-medium" : "text-dark/30"
                        }`}
                      >
                        {cfg.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cancelled / Returned banner */}
          {(isCancelled || isReturned) && (
            <div
              className={`rounded-xl p-4 flex items-center gap-3 ${
                isCancelled
                  ? "bg-red-50 text-red-700"
                  : "bg-gray-50 text-gray-700"
              }`}
            >
              <svg
                className="w-5 h-5 shrink-0"
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
              <p className="font-poppins text-sm font-medium">
                {isCancelled
                  ? "Cette commande a été annulée."
                  : "Cette commande a été retournée."}
              </p>
            </div>
          )}

          {/* ─── Update Status Section ─── */}
          <div className="bg-background rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider">
                Modifier le statut
              </p>
              {!showStatusChange && (
                <button
                  type="button"
                  onClick={() => setShowStatusChange(true)}
                  className="font-poppins text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Changer
                </button>
              )}
            </div>
            {showStatusChange ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {ALL_STATUSES.map((s) => {
                    const cfg = ORDER_STATUS_CONFIG[s];
                    const isSelected = selectedStatus === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedStatus(s)}
                        className={`inline-flex items-center gap-1.5 font-poppins text-xs font-medium px-3 py-1.5 rounded-full border-2 transition-all duration-150 ${
                          isSelected
                            ? `${cfg.badge} border-current`
                            : "bg-white text-dark/50 border-transparent hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isSelected ? cfg.dot : "bg-dark/20"}`}
                        />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStatusChange(false);
                      setSelectedStatus(order.status);
                    }}
                    className="px-4 py-2 rounded-lg border border-gray-200 font-poppins text-xs font-medium text-dark/60 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveStatus}
                    disabled={saving || selectedStatus === order.status}
                    className="px-4 py-2 rounded-lg bg-primary text-white font-poppins text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving && (
                      <svg
                        className="w-3.5 h-3.5 animate-spin"
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
                    Enregistrer
                  </button>
                </div>
              </div>
            ) : (
              <p className="font-poppins text-sm text-dark/60">
                Statut actuel :{" "}
                <span className="font-semibold text-dark">
                  {ORDER_STATUS_CONFIG[order.status].label}
                </span>
              </p>
            )}
          </div>

          {/* ─── Two column layout: Client + Shipping ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Client */}
            <div className="bg-background rounded-xl p-4">
              <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Client
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="font-poppins text-sm font-bold text-primary uppercase">
                      {(order.userName || order.userEmail || "?").charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-poppins text-sm font-semibold text-dark truncate">
                      {order.userName || "—"}
                    </p>
                    <p className="font-poppins text-xs text-dark/40 truncate">
                      {order.userEmail || order.user}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-background rounded-xl p-4">
              <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Adresse de livraison
              </p>
              <div className="font-poppins text-sm text-dark/70 space-y-1">
                <p className="font-medium text-dark">
                  {order.shippingAddress.firstName}{" "}
                  {order.shippingAddress.lastName}
                </p>
                <p>{order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.postalCode}{" "}
                  {order.shippingAddress.city}
                </p>
                <p>{order.shippingAddress.country}</p>
                <p className="text-dark/40 flex items-center gap-1.5 pt-1">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  {order.shippingAddress.phone}
                </p>
              </div>
            </div>
          </div>

          {/* ─── Order Items ─── */}
          <div>
            <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg
                className="w-4 h-4"
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
              Articles ({itemCount})
            </p>
            <div className="bg-background rounded-xl overflow-hidden divide-y divide-white">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="w-14 h-14 rounded-xl bg-white shrink-0 flex items-center justify-center overflow-hidden border border-gray-100">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        className="w-6 h-6 text-dark/20"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-poppins text-sm font-medium text-dark truncate">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-poppins text-xs text-dark/40">
                        Qté: {item.quantity}
                      </span>
                      {item.size && (
                        <>
                          <span className="w-0.5 h-0.5 rounded-full bg-dark/20" />
                          <span className="font-poppins text-xs text-dark/40">
                            Taille: {item.size}
                          </span>
                        </>
                      )}
                      {item.color && (
                        <>
                          <span className="w-0.5 h-0.5 rounded-full bg-dark/20" />
                          <span className="font-poppins text-xs text-dark/40">
                            Couleur: {item.color}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="font-poppins text-sm font-semibold text-dark shrink-0">
                    {(item.price * item.quantity).toFixed(2)} TND
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Order Summary ─── */}
          <div className="bg-background rounded-xl p-4">
            <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-3 flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              Récapitulatif
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-poppins text-sm text-dark/60">
                  Sous-total
                </span>
                <span className="font-poppins text-sm text-dark">
                  {order.subtotal.toFixed(2)} TND
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-poppins text-sm text-dark/60">
                  Livraison (
                  {order.shippingMethod === "express" ? "Express" : "Standard"})
                </span>
                <span className="font-poppins text-sm text-dark">
                  {order.shippingCost.toFixed(2)} TND
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-dark/10">
                <span className="font-poppins text-sm font-bold text-dark">
                  Total
                </span>
                <span className="font-poppins text-lg font-bold text-primary">
                  {order.totalAmount.toFixed(2)} TND
                </span>
              </div>
            </div>
          </div>

          {/* ─── Notes ─── */}
          {order.notes && (
            <div className="bg-background rounded-xl p-4">
              <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-2 flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                Notes du client
              </p>
              <p className="font-poppins text-sm text-dark/60 italic">
                &ldquo;{order.notes}&rdquo;
              </p>
            </div>
          )}

          {/* ─── Metadata ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 pt-2 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-poppins text-xs text-dark/30">
                Paiement:{" "}
                <span className="text-dark/50 font-medium">
                  {order.paymentMethod === "cod"
                    ? "À la livraison"
                    : "Carte bancaire"}
                </span>
              </span>
              <span className="font-poppins text-xs text-dark/30">
                Livraison:{" "}
                <span className="text-dark/50 font-medium">
                  {order.shippingMethod === "express" ? "Express" : "Standard"}
                </span>
              </span>
            </div>
            <span className="font-poppins text-xs text-dark/30">
              MAJ: {formatDate(order.updatedAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
