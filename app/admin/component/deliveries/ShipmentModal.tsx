"use client";

import { useEffect, useRef, useState } from "react";
import type { ShipmentStatus } from "@/models/Shipment";

export interface ShipmentFormData {
  deliveryCompany: string;
  order: string;
  status: ShipmentStatus;
  trackingNumber: string;
  notes: string;
}

interface SelectOption {
  value: string;
  label: string;
}

interface ShipmentModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData?: ShipmentFormData;
  companyOptions: SelectOption[];
  orderOptions: SelectOption[];
  onCancel: () => void;
  onSave: (data: ShipmentFormData) => void;
  saving?: boolean;
}

const STATUS_OPTIONS: { value: ShipmentStatus; label: string }[] = [
  { value: "pending", label: "En attente" },
  { value: "picked_up", label: "Récupéré" },
  { value: "in_transit", label: "En transit" },
  { value: "delivered", label: "Livré" },
  { value: "failed", label: "Échoué" },
];

const emptyForm: ShipmentFormData = {
  deliveryCompany: "",
  order: "",
  status: "pending",
  trackingNumber: "",
  notes: "",
};

export default function ShipmentModal({
  isOpen,
  mode,
  initialData,
  companyOptions,
  orderOptions,
  onCancel,
  onSave,
  saving,
}: ShipmentModalProps) {
  const formKey = `${isOpen}-${mode}-${initialData?.order ?? ""}`;

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
      if (e.key === "Escape" && isOpen) onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onCancel]);

  return (
    <div
      className={`fixed inset-0 z-90 flex items-center justify-center px-4 transition-all duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={
        mode === "create" ? "Créer une expédition" : "Modifier l'expédition"
      }
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto transition-all duration-300 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {isOpen && (
          <ShipmentFormInner
            key={formKey}
            mode={mode}
            initialData={initialData}
            companyOptions={companyOptions}
            orderOptions={orderOptions}
            onCancel={onCancel}
            onSave={onSave}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}

/* ── Inner form component ── */

function ShipmentFormInner({
  mode,
  initialData,
  companyOptions,
  orderOptions,
  onCancel,
  onSave,
  saving,
}: Omit<ShipmentModalProps, "isOpen">) {
  const [form, setForm] = useState<ShipmentFormData>(initialData ?? emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => firstRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.deliveryCompany)
      newErrors.deliveryCompany = "La société est requise";
    if (!form.order) newErrors.order = "La commande est requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSave(form);
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200";

  const selectClass =
    "w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200 appearance-none bg-no-repeat bg-position-[right_0.75rem_center] bg-size-[1rem] bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2317171a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")] pr-9";

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 sm:px-8 sm:pt-8">
        <h2 className="font-erotique text-2xl text-dark">
          {mode === "create" ? "Créer une expédition" : "Modifier l'expédition"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
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

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="p-6 sm:p-8 pt-5 sm:pt-6 space-y-5"
      >
        {/* Delivery Company */}
        <div>
          <label
            htmlFor="ship-company"
            className="block font-poppins text-sm font-medium text-dark mb-1.5"
          >
            Société de livraison *
          </label>
          <select
            ref={firstRef}
            id="ship-company"
            value={form.deliveryCompany}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, deliveryCompany: e.target.value }))
            }
            className={`${selectClass} ${errors.deliveryCompany ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`}
          >
            <option value="">Sélectionner une société</option>
            {companyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.deliveryCompany && (
            <p className="font-poppins text-xs text-red-500 mt-1">
              {errors.deliveryCompany}
            </p>
          )}
        </div>

        {/* Order */}
        <div>
          <label
            htmlFor="ship-order"
            className="block font-poppins text-sm font-medium text-dark mb-1.5"
          >
            Commande *
          </label>
          <select
            id="ship-order"
            value={form.order}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, order: e.target.value }))
            }
            className={`${selectClass} ${errors.order ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`}
          >
            <option value="">Sélectionner une commande</option>
            {orderOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.order && (
            <p className="font-poppins text-xs text-red-500 mt-1">
              {errors.order}
            </p>
          )}
        </div>

        {/* Status (only in edit mode) */}
        {mode === "edit" && (
          <div>
            <label
              htmlFor="ship-status"
              className="block font-poppins text-sm font-medium text-dark mb-1.5"
            >
              Statut
            </label>
            <select
              id="ship-status"
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value as ShipmentStatus,
                }))
              }
              className={selectClass}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tracking Number */}
        <div>
          <label
            htmlFor="ship-tracking"
            className="block font-poppins text-sm font-medium text-dark mb-1.5"
          >
            Numéro de suivi
          </label>
          <input
            id="ship-tracking"
            type="text"
            value={form.trackingNumber}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, trackingNumber: e.target.value }))
            }
            placeholder="Ex: TN123456789"
            className={inputClass}
          />
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="ship-notes"
            className="block font-poppins text-sm font-medium text-dark mb-1.5"
          >
            Notes
          </label>
          <textarea
            id="ship-notes"
            value={form.notes}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, notes: e.target.value }))
            }
            placeholder="Notes internes…"
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 font-poppins text-sm font-medium text-dark hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-dark/10"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white font-poppins text-sm font-medium hover:bg-primary/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving
              ? "Enregistrement…"
              : mode === "create"
                ? "Créer"
                : "Enregistrer"}
          </button>
        </div>
      </form>
    </>
  );
}
