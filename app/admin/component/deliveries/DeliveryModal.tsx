"use client";

import { useEffect, useRef, useState } from "react";
import type { DeliveryCompanyStatus } from "@/models/Delivery";

export interface CompanyFormData {
  name: string;
  phone: string;
  email: string;
  address: string;
  price: string;
  status: DeliveryCompanyStatus;
  notes: string;
}

interface DeliveryModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData?: CompanyFormData;
  onCancel: () => void;
  onSave: (data: CompanyFormData) => void;
  saving?: boolean;
}

const STATUS_OPTIONS: { value: DeliveryCompanyStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const emptyForm: CompanyFormData = {
  name: "",
  phone: "",
  email: "",
  address: "",
  price: "",
  status: "active",
  notes: "",
};

export default function DeliveryModal({
  isOpen,
  mode,
  initialData,
  onCancel,
  onSave,
  saving,
}: DeliveryModalProps) {
  const formKey = `${isOpen}-${mode}-${initialData?.name ?? ""}`;

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
        mode === "create" ? "Ajouter une société" : "Modifier la société"
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
          <CompanyFormInner
            key={formKey}
            mode={mode}
            initialData={initialData}
            onCancel={onCancel}
            onSave={onSave}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}

/* â”€â”€ Inner form component â”€â”€ */

function CompanyFormInner({
  mode,
  initialData,
  onCancel,
  onSave,
  saving,
}: Omit<DeliveryModalProps, "isOpen">) {
  const [form, setForm] = useState<CompanyFormData>(initialData ?? emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => nameRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Le nom est requis";
    if (!form.price.trim()) {
      newErrors.price = "Le prix est requis";
    } else if (isNaN(Number(form.price)) || Number(form.price) < 0) {
      newErrors.price = "Le prix doit Ãªtre un nombre positif";
    }
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
          {mode === "create"
            ? "Ajouter une société"
            : "Modifier la société"}
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
        {/* Name */}
        <div>
          <label
            htmlFor="company-name"
            className="block font-poppins text-sm font-medium text-dark mb-1.5"
          >
            Nom de la société *
          </label>
          <input
            ref={nameRef}
            id="company-name"
            type="text"
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Ex: Aramex, DHL, Poste Tunisienneâ€¦"
            className={`${inputClass} ${errors.name ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`}
          />
          {errors.name && (
            <p className="font-poppins text-xs text-red-500 mt-1">
              {errors.name}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="company-phone"
            className="block font-poppins text-sm font-medium text-dark mb-1.5"
          >
            Téléphone
          </label>
          <input
            id="company-phone"
            type="text"
            value={form.phone}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, phone: e.target.value }))
            }
            placeholder="Ex: +216 71 234 567"
            className={inputClass}
          />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="company-email"
            className="block font-poppins text-sm font-medium text-dark mb-1.5"
          >
            Email
          </label>
          <input
            id="company-email"
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="Ex: contact@aramex.tn"
            className={inputClass}
          />
        </div>

        {/* Address */}
        <div>
          <label
            htmlFor="company-address"
            className="block font-poppins text-sm font-medium text-dark mb-1.5"
          >
            Adresse
          </label>
          <input
            id="company-address"
            type="text"
            value={form.address}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, address: e.target.value }))
            }
            placeholder="Ex: Rue de la Liberté, Tunis"
            className={inputClass}
          />
        </div>

        {/* Price */}
        <div>
          <label
            htmlFor="company-price"
            className="block font-poppins text-sm font-medium text-dark mb-1.5"
          >
            Prix de livraison (TND) *
          </label>
          <input
            id="company-price"
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, price: e.target.value }))
            }
            placeholder="0.00"
            className={`${inputClass} ${errors.price ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`}
          />
          {errors.price && (
            <p className="font-poppins text-xs text-red-500 mt-1">
              {errors.price}
            </p>
          )}
        </div>

        {/* Status (only in edit mode) */}
        {mode === "edit" && (
          <div>
            <label
              htmlFor="company-status"
              className="block font-poppins text-sm font-medium text-dark mb-1.5"
            >
              Statut
            </label>
            <select
              id="company-status"
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value as DeliveryCompanyStatus,
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

        {/* Notes */}
        <div>
          <label
            htmlFor="company-notes"
            className="block font-poppins text-sm font-medium text-dark mb-1.5"
          >
            Notes
          </label>
          <textarea
            id="company-notes"
            value={form.notes}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, notes: e.target.value }))
            }
            placeholder="Notes internesâ€¦"
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
