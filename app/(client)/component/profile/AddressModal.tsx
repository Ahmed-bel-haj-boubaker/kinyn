"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";

interface AddressFormData {
  country: string;
  city: string;
  address: string;
  postalCode: string;
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: AddressFormData) => void;
  initial?: AddressFormData | null;
  resetKey: number;
}

const emptyForm: AddressFormData = {
  country: "",
  city: "",
  address: "",
  postalCode: "",
};

const fieldDefs: {
  key: keyof AddressFormData;
  label: string;
  placeholder: string;
}[] = [
  { key: "country", label: "Pays", placeholder: "Tunisie" },
  { key: "city", label: "Ville", placeholder: "Tunis" },
  { key: "address", label: "Adresse", placeholder: "12 Rue de la Liberté" },
  { key: "postalCode", label: "Code Postal", placeholder: "1000" },
];

/* ─── Inner form – re-mounted via key so useState re-inits ─── */

function InnerForm({
  onClose,
  onSave,
  initial,
}: {
  onClose: () => void;
  onSave: (data: AddressFormData) => void;
  initial: AddressFormData;
}) {
  const [form, setForm] = useState<AddressFormData>(initial);

  const handleChange = (key: keyof AddressFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  const isEditing = initial !== emptyForm;

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {fieldDefs.map((field) => (
        <div key={field.key} className="flex flex-col gap-1.5">
          <label
            htmlFor={`addr-${field.key}`}
            className="font-poppins text-[11px] font-semibold uppercase tracking-wide text-[#999]"
          >
            {field.label}
          </label>
          <input
            id={`addr-${field.key}`}
            type="text"
            value={form[field.key]}
            onChange={(e) => handleChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            required
            className="w-full rounded-lg border border-[#E0DED9] bg-[#FAFAF8] px-4 py-2.5 font-poppins text-[13px] text-dark placeholder:text-[#CCC] outline-none transition-all duration-200 focus:border-primary focus:ring-1 focus:ring-primary/20"
          />
        </div>
      ))}

      <div className="flex justify-end gap-3 pt-3">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-full border border-[#E0DED9] px-5 py-2.5 font-poppins text-[12px] font-medium text-[#666] transition-all duration-200 hover:border-[#CCC] hover:text-dark"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-primary px-5 py-2.5 font-poppins text-[12px] font-medium text-white transition-all duration-200 hover:bg-primary/90"
        >
          {isEditing ? "Mettre à jour" : "Ajouter"}
        </button>
      </div>
    </form>
  );
}

/* ─── Outer modal wrapper ─── */

export default function AddressModal({
  isOpen,
  onClose,
  onSave,
  initial,
  resetKey,
}: AddressModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) onClose();
    },
    [onClose],
  );

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[3px] animate-[fadeIn_200ms_ease-in-out_forwards]"
      role="dialog"
      aria-modal="true"
      aria-label={initial ? "Modifier l'adresse" : "Ajouter une adresse"}
    >
      <div className="relative w-full max-w-md mx-4 rounded-xl bg-white border border-[#EEECE7] shadow-[0_16px_50px_rgba(0,0,0,0.12)] animate-[scaleIn_200ms_ease-in-out_forwards]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0EFEB] px-6 py-4">
          <h3 className="font-erotique text-lg text-dark">
            {initial ? "Modifier l\u2019adresse" : "Nouvelle Adresse"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-full p-1.5 text-[#999] transition-colors duration-200 hover:bg-[#F5F4F1] hover:text-dark"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <InnerForm
          key={resetKey}
          onClose={onClose}
          onSave={onSave}
          initial={initial ?? emptyForm}
        />
      </div>
    </div>
  );
}
