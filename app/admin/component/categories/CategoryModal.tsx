"use client";

import { useEffect, useRef, useState } from "react";

export type CategoryLevel = "mere" | "sous" | "finale";
export type CategoryStatus = "active" | "hidden";

export interface CategoryFormData {
  name: string;
  level: CategoryLevel;
  parent: string; // parent ID (empty string for mère)
  status: CategoryStatus;
}

interface CategoryModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData?: CategoryFormData;
  parentOptions: { value: string; label: string; level: CategoryLevel }[];
  onCancel: () => void;
  onSave: (data: CategoryFormData) => void;
  saving?: boolean;
}

const LEVEL_OPTIONS: { value: CategoryLevel; label: string }[] = [
  { value: "mere", label: "Catégorie mère" },
  { value: "sous", label: "Sous-catégorie" },
  { value: "finale", label: "Catégorie finale" },
];

const emptyForm: CategoryFormData = {
  name: "",
  level: "mere",
  parent: "",
  status: "active",
};

export default function CategoryModal({
  isOpen,
  mode,
  initialData,
  parentOptions,
  onCancel,
  onSave,
  saving,
}: CategoryModalProps) {
  // Derive a stable key from props to remount the inner form when modal opens/data changes
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
        mode === "create" ? "Ajouter une catégorie" : "Modifier la catégorie"
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
          <CategoryFormInner
            key={formKey}
            mode={mode}
            initialData={initialData}
            parentOptions={parentOptions}
            onCancel={onCancel}
            onSave={onSave}
            saving={saving}
          />
        )}
      </div>
    </div>
  );
}

/* ── Inner form component — re-mounts via key to reset state cleanly ── */

function CategoryFormInner({
  mode,
  initialData,
  parentOptions,
  onCancel,
  onSave,
  saving,
}: Omit<CategoryModalProps, "isOpen">) {
  const [form, setForm] = useState<CategoryFormData>(initialData ?? emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => nameRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const filteredParentOptions = parentOptions.filter((opt) => {
    if (form.level === "sous") return opt.level === "mere";
    if (form.level === "finale") return opt.level === "sous";
    return false;
  });

  const handleLevelChange = (level: CategoryLevel) => {
    setForm((prev) => ({ ...prev, level, parent: "" }));
    setErrors((prev) => ({ ...prev, parent: "" }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Le nom est requis";
    if (form.level !== "mere" && !form.parent)
      newErrors.parent = "La catégorie parente est requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSave(form);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 sm:px-8 sm:pt-8">
        <h2 className="font-erotique text-2xl text-dark">
          {mode === "create"
            ? "Ajouter une catégorie"
            : "Modifier la catégorie"}
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
            htmlFor="cat-name"
            className="block font-poppins text-sm font-medium text-dark mb-1.5"
          >
            Nom de la catégorie *
          </label>
          <input
            ref={nameRef}
            id="cat-name"
            type="text"
            value={form.name}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, name: e.target.value }));
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            aria-required="true"
            aria-invalid={!!errors.name}
            className={`w-full font-poppins px-4 py-2.5 rounded-lg border text-sm text-dark placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 ${
              errors.name
                ? "border-red-400 focus:ring-red-200"
                : "border-gray-300 focus:border-primary focus:ring-primary/20"
            }`}
            placeholder="ex: Robes"
          />
          {errors.name && (
            <p className="font-poppins text-xs text-red-500 mt-1">
              {errors.name}
            </p>
          )}
        </div>

        {/* Level */}
        <div>
          <label
            htmlFor="cat-level"
            className="block font-poppins text-sm font-medium text-dark mb-1.5"
          >
            Niveau *
          </label>
          <select
            id="cat-level"
            value={form.level}
            onChange={(e) => handleLevelChange(e.target.value as CategoryLevel)}
            className="w-full font-poppins px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-dark bg-white transition-all duration-200 focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2317171a%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-size-[1rem] bg-position-[right_0.75rem_center] bg-no-repeat pr-10"
          >
            {LEVEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Parent */}
        <div>
          <label
            htmlFor="cat-parent"
            className="block font-poppins text-sm font-medium text-dark mb-1.5"
          >
            Catégorie parente {form.level !== "mere" && "*"}
          </label>
          <select
            id="cat-parent"
            value={form.parent}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, parent: e.target.value }));
              if (errors.parent) setErrors((prev) => ({ ...prev, parent: "" }));
            }}
            disabled={form.level === "mere"}
            aria-invalid={!!errors.parent}
            className={`w-full font-poppins px-4 py-2.5 rounded-lg border text-sm text-dark bg-white transition-all duration-200 focus:outline-none focus:ring-2 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2317171a%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-size-[1rem] bg-position-[right_0.75rem_center] bg-no-repeat pr-10 ${
              form.level === "mere"
                ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50"
                : errors.parent
                  ? "border-red-400 focus:ring-red-200"
                  : "border-gray-300 focus:border-primary focus:ring-primary/20"
            }`}
          >
            <option value="">Sélectionner...</option>
            {filteredParentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.parent && (
            <p className="font-poppins text-xs text-red-500 mt-1">
              {errors.parent}
            </p>
          )}
        </div>

        {/* Status Toggle */}
        <div>
          <label className="block font-poppins text-sm font-medium text-dark mb-2">
            Statut
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={form.status === "active"}
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  status: prev.status === "active" ? "hidden" : "active",
                }))
              }
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                form.status === "active" ? "bg-primary" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                  form.status === "active" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="font-poppins text-sm text-dark/70">
              {form.status === "active" ? "Active" : "Masquée"}
            </span>
          </div>
        </div>

        {/* Actions */}
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
              ? "Enregistrement..."
              : mode === "create"
                ? "Créer"
                : "Enregistrer"}
          </button>
        </div>
      </form>
    </>
  );
}
