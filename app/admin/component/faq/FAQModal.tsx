/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useRef, useState } from "react";
import type { FAQStatus } from "@/models/FAQ";

/* ──────────────── Types ──────────────── */

export interface FAQFormData {
  question: string;
  answer: string;
  category: string;
  status: FAQStatus;
  order: number;
}

interface FAQModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  saving: boolean;
  initialData?: FAQFormData;
  categoryOptions: string[];
  onCancel: () => void;
  onSave: (data: FAQFormData) => void;
}

const DEFAULT_FORM: FAQFormData = {
  question: "",
  answer: "",
  category: "Général",
  status: "draft",
  order: 0,
};

/* ──────────────── Component ──────────────── */

export default function FAQModal({
  isOpen,
  mode,
  saving,
  initialData,
  categoryOptions,
  onCancel,
  onSave,
}: FAQModalProps) {
  const firstRef = useRef<HTMLTextAreaElement>(null);
  const [form, setForm] = useState<FAQFormData>(DEFAULT_FORM);
  const [customCategory, setCustomCategory] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [errors, setErrors] = useState<Partial<FAQFormData>>({});

  /* ── Sync form with initialData on open ── */
  useEffect(() => {
    if (isOpen) {
      const data = initialData ?? DEFAULT_FORM;
      setForm(data);
      const isKnown =
        categoryOptions.includes(data.category) || data.category === "Général";
      setUseCustom(!isKnown && data.category !== "");
      setCustomCategory(!isKnown ? data.category : "");
      setErrors({});
      setTimeout(() => firstRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, initialData, categoryOptions]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !saving) onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, saving, onCancel]);

  /* ── Validation ── */
  function validate(): boolean {
    const errs: Partial<FAQFormData> = {};
    if (!form.question.trim()) errs.question = "La question est requise.";
    else if (form.question.trim().length < 5)
      errs.question = "Question trop courte (min. 5 caractères).";
    if (!form.answer.trim()) errs.answer = "La réponse est requise.";
    else if (form.answer.trim().length < 10)
      errs.answer = "Réponse trop courte (min. 10 caractères).";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const finalCategory = useCustom
      ? customCategory.trim() || "Général"
      : form.category;
    onSave({ ...form, category: finalCategory });
  }

  function set<K extends keyof FAQFormData>(key: K, value: FAQFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  /* ── Known categories for select dropdown ── */
  const allCategories = Array.from(
    new Set(["Général", ...categoryOptions]),
  ).sort();

  return (
    <div
      className={`fixed inset-0 z-90 flex items-start justify-center px-4 pt-16 pb-8 transition-all duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={mode === "create" ? "Créer une FAQ" : "Modifier une FAQ"}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
        onClick={() => !saving && onCancel()}
      />

      {/* Panel */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-poppins font-semibold text-dark text-lg">
            {mode === "create" ? "Nouvelle FAQ" : "Modifier la FAQ"}
          </h2>
          <button
            type="button"
            onClick={() => !saving && onCancel()}
            disabled={saving}
            className="text-dark/40 hover:text-dark transition-colors p-1 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form
          id="faq-form"
          onSubmit={handleSubmit}
          className="overflow-y-auto flex-1"
        >
          <div className="px-6 py-5 flex flex-col gap-5">
            {/* Question */}
            <div>
              <label className="block font-poppins text-sm font-medium text-dark mb-1.5">
                Question <span className="text-primary">*</span>
              </label>
              <textarea
                ref={firstRef}
                rows={3}
                value={form.question}
                onChange={(e) => set("question", e.target.value)}
                placeholder="Ex : Quels sont les délais de livraison ?"
                className={`w-full resize-none rounded-xl border px-4 py-3 font-poppins text-sm text-dark placeholder-dark/30 outline-none transition-colors focus:border-primary ${
                  errors.question
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 bg-gray-50 focus:bg-white"
                }`}
              />
              {errors.question && (
                <p className="mt-1 text-xs text-red-500">{errors.question}</p>
              )}
            </div>

            {/* Answer */}
            <div>
              <label className="block font-poppins text-sm font-medium text-dark mb-1.5">
                Réponse <span className="text-primary">*</span>
              </label>
              <textarea
                rows={5}
                value={form.answer}
                onChange={(e) => set("answer", e.target.value)}
                placeholder="Rédigez la réponse complète ici..."
                className={`w-full resize-y rounded-xl border px-4 py-3 font-poppins text-sm text-dark placeholder-dark/30 outline-none transition-colors focus:border-primary ${
                  errors.answer
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 bg-gray-50 focus:bg-white"
                }`}
              />
              {errors.answer && (
                <p className="mt-1 text-xs text-red-500">{errors.answer}</p>
              )}
            </div>

            {/* Category + Order row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block font-poppins text-sm font-medium text-dark mb-1.5">
                  Catégorie
                </label>
                {useCustom ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Catégorie personnalisée"
                      className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 font-poppins text-sm text-dark outline-none focus:border-primary focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustom(false);
                        setCustomCategory("");
                        set("category", "Général");
                      }}
                      className="px-2.5 rounded-xl border border-gray-200 text-dark/50 hover:text-dark text-xs"
                    >
                      ← Liste
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={form.category}
                      onChange={(e) => set("category", e.target.value)}
                      className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 font-poppins text-sm text-dark outline-none focus:border-primary focus:bg-white"
                    >
                      {allCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setUseCustom(true)}
                      className="px-2.5 rounded-xl border border-gray-200 text-dark/50 hover:text-dark text-xs whitespace-nowrap"
                    >
                      + Autre
                    </button>
                  </div>
                )}
              </div>

              {/* Order */}
              <div>
                <label className="block font-poppins text-sm font-medium text-dark mb-1.5">
                  Ordre d&apos;affichage
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.order}
                  onChange={(e) =>
                    set("order", parseInt(e.target.value, 10) || 0)
                  }
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 font-poppins text-sm text-dark outline-none focus:border-primary focus:bg-white"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block font-poppins text-sm font-medium text-dark mb-2">
                Statut
              </label>
              <div className="flex gap-3">
                {(["published", "draft"] as FAQStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set("status", s)}
                    className={`flex-1 py-2.5 rounded-xl border font-poppins text-sm font-medium transition-all ${
                      form.status === s
                        ? s === "published"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-400 bg-gray-100 text-gray-700"
                        : "border-gray-200 bg-white text-dark/50 hover:border-gray-300"
                    }`}
                  >
                    {s === "published" ? "✓ Publié" : "Brouillon"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => !saving && onCancel()}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl border border-gray-200 font-poppins text-sm text-dark hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="faq-form"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-primary font-poppins text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {saving && (
              <svg
                className="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
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
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            )}
            {saving
              ? "Enregistrement..."
              : mode === "create"
                ? "Créer la FAQ"
                : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}
