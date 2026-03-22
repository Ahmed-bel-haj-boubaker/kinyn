"use client";

import { useEffect, useRef, useState } from "react";
import type { DeliveryMethodStatus } from "@/models/DeliveryMethod";

export interface MethodFormData {
  name: string;
  description: string;
  price: string;
  estimatedDays: string;
  status: DeliveryMethodStatus;
}

interface DeliveryMethodModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData?: MethodFormData;
  onCancel: () => void;
  onSave: (data: MethodFormData) => void;
  saving?: boolean;
}

const STATUS_OPTIONS: { value: DeliveryMethodStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const emptyForm: MethodFormData = {
  name: "",
  description: "",
  price: "",
  estimatedDays: "",
  status: "active",
};

export default function DeliveryMethodModal({
  isOpen,
  mode,
  initialData,
  onCancel,
  onSave,
  saving,
}: DeliveryMethodModalProps) {
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

  const [form, setForm] = useState<MethodFormData>(emptyForm);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ?? emptyForm);
      setTimeout(() => nameRef.current?.focus(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formKey]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price.trim()) return;
    onSave(form);
  };

  if (!isOpen) return null;

  const inputCls =
    "w-full font-poppins px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 text-dark placeholder:text-gray-400 bg-white transition-all duration-200 text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-erotique text-2xl text-dark">
            {mode === "create"
              ? "Nouvelle méthode de livraison"
              : "Modifier la méthode"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-lg text-dark/30 hover:text-dark hover:bg-dark/5 transition-colors"
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block font-poppins text-sm font-medium text-dark mb-1.5">
              Nom *
            </label>
            <input
              ref={nameRef}
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className={inputCls}
              placeholder="Ex : Standard, Express…"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-poppins text-sm font-medium text-dark mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className={inputCls + " resize-none"}
              placeholder="Livraison sous 3 à 5 jours ouvrables"
              rows={2}
            />
          </div>

          {/* Price + Estimated days */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-poppins text-sm font-medium text-dark mb-1.5">
                Prix (TND) *
              </label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                className={inputCls}
                placeholder="8.000"
                min="0"
                step="0.001"
                required
              />
            </div>
            <div>
              <label className="block font-poppins text-sm font-medium text-dark mb-1.5">
                Délai estimé
              </label>
              <input
                type="text"
                name="estimatedDays"
                value={form.estimatedDays}
                onChange={handleChange}
                className={inputCls}
                placeholder="3-5 jours"
              />
            </div>
          </div>

          {/* Status (edit only) */}
          {mode === "edit" && (
            <div>
              <label className="block font-poppins text-sm font-medium text-dark mb-1.5">
                Statut
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={inputCls}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-lg font-poppins text-sm font-medium text-dark/50 hover:text-dark hover:bg-dark/5 transition-colors duration-150"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !form.name.trim() || !form.price.trim()}
              className="px-5 py-2.5 rounded-lg bg-primary text-white font-poppins text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 flex items-center gap-2"
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
              {mode === "create" ? "Créer" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
