"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type { Admin, AdminRole, AdminStatus } from "./AdminsTable";

type ModalMode = "create" | "edit";

interface AdminModalProps {
  isOpen: boolean;
  mode: ModalMode;
  initialData?: Admin | null;
  onClose: () => void;
  onSave: (admin: Omit<Admin, "id"> & { id?: string }) => void;
}

/* ------------------------------------------------------------------ */
/*  Inner form                                                         */
/* ------------------------------------------------------------------ */

interface FormInnerProps {
  mode: ModalMode;
  initialData?: Admin | null;
  onClose: () => void;
  onSave: (admin: Omit<Admin, "id"> & { id?: string }) => void;
}

function AdminFormInner({
  mode,
  initialData,
  onClose,
  onSave,
}: FormInnerProps) {
  const [firstName, setFirstName] = useState(initialData?.firstName ?? "");
  const [lastName, setLastName] = useState(initialData?.lastName ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [role, setRole] = useState<AdminRole>(initialData?.role ?? "admin");
  const [status, setStatus] = useState<AdminStatus>(
    initialData?.status ?? "active",
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "Le prénom est requis";
    if (!lastName.trim()) e.lastName = "Le nom est requis";
    if (!email.trim()) e.email = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Format d'email invalide";
    if (phone && !/^[\d\s+()-]{8,}$/.test(phone))
      e.phone = "Numéro de téléphone invalide";
    if (mode === "create") {
      if (!password) e.password = "Le mot de passe est requis";
      else if (password.length < 8) e.password = "Minimum 8 caractères";
      if (password !== confirmPassword)
        e.confirmPassword = "Les mots de passe ne correspondent pas";
    } else if (password) {
      if (password.length < 8) e.password = "Minimum 8 caractères";
      if (password !== confirmPassword)
        e.confirmPassword = "Les mots de passe ne correspondent pas";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      ...(initialData?.id ? { id: initialData.id } : {}),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      status,
      avatar: initialData?.avatar ?? "",
      createdAt: initialData?.createdAt ?? new Date().toISOString(),
      lastLogin: initialData?.lastLogin ?? "",
    });
  };

  const fieldClass = (field: string) =>
    `w-full px-4 py-2.5 rounded-xl border ${
      errors[field]
        ? "border-primary/60 ring-2 ring-primary/10"
        : "border-gray-200"
    } bg-white font-poppins text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200`;

  const selectClass = (field: string) =>
    `${fieldClass(field)} appearance-none bg-no-repeat bg-position-[right_0.75rem_center] bg-size-[1rem] bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2317171a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")] pr-10`;

  const getInitials = () => {
    const f = firstName.charAt(0) || "?";
    const l = lastName.charAt(0) || "?";
    return `${f}${l}`.toUpperCase();
  };

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
        <h2 className="font-erotique text-xl text-dark">
          {mode === "create"
            ? "Nouvel Administrateur"
            : "Modifier l'Administrateur"}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-dark/40 hover:text-dark hover:bg-dark/5 transition-colors duration-150 focus:outline-none"
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

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Avatar Preview */}
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
            {initialData?.avatar ? (
              <Image
                src={initialData.avatar}
                alt="Avatar"
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-poppins text-lg font-bold text-primary">
                {getInitials()}
              </span>
            )}
          </div>
          <div>
            <p className="font-poppins text-sm font-medium text-dark">
              {firstName || lastName
                ? `${firstName} ${lastName}`.trim()
                : "Nouvel administrateur"}
            </p>
            <p className="font-poppins text-xs text-dark/40 mt-0.5">
              {email || "email@exemple.com"}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-poppins text-xs font-medium text-dark/60 mb-1.5">
              Prénom <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="ex: Ahmed"
              className={fieldClass("firstName")}
            />
            {errors.firstName && (
              <p className="font-poppins text-xs text-primary mt-1">
                {errors.firstName}
              </p>
            )}
          </div>
          <div>
            <label className="block font-poppins text-xs font-medium text-dark/60 mb-1.5">
              Nom <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="ex: Ben Ali"
              className={fieldClass("lastName")}
            />
            {errors.lastName && (
              <p className="font-poppins text-xs text-primary mt-1">
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block font-poppins text-xs font-medium text-dark/60 mb-1.5">
            Adresse e-mail <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@kinyn.com"
              className={`${fieldClass("email")} pl-10`}
            />
          </div>
          {errors.email && (
            <p className="font-poppins text-xs text-primary mt-1">
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block font-poppins text-xs font-medium text-dark/60 mb-1.5">
            Téléphone
          </label>
          <div className="relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+216 XX XXX XXX"
              className={`${fieldClass("phone")} pl-10`}
            />
          </div>
          {errors.phone && (
            <p className="font-poppins text-xs text-primary mt-1">
              {errors.phone}
            </p>
          )}
        </div>

        {/* Role & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-poppins text-xs font-medium text-dark/60 mb-1.5">
              Rôle <span className="text-primary">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              className={selectClass("role")}
            >
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="moderator">Modérateur</option>
            </select>
          </div>
          <div>
            <label className="block font-poppins text-xs font-medium text-dark/60 mb-1.5">
              Statut
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AdminStatus)}
              className={selectClass("status")}
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
        </div>

        {/* Role Info */}
        <div className="bg-background rounded-xl p-3.5">
          <div className="flex items-start gap-2.5">
            <svg
              className="w-4 h-4 text-dark/40 mt-0.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-poppins text-xs font-medium text-dark/60">
                Permissions du rôle
              </p>
              <p className="font-poppins text-xs text-dark/40 mt-0.5">
                {role === "super_admin" &&
                  "Accès complet : gestion des admins, produits, catégories, commandes et paramètres."}
                {role === "admin" &&
                  "Gestion des produits, catégories et commandes. Pas d'accès à la gestion des administrateurs."}
                {role === "moderator" &&
                  "Consultation et modération du contenu. Accès en lecture seule aux produits et commandes."}
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Password Section */}
        <div>
          <h3 className="font-poppins text-sm font-semibold text-dark mb-3 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-dark/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            {mode === "create" ? "Mot de passe" : "Changer le mot de passe"}
          </h3>
          {mode === "edit" && (
            <p className="font-poppins text-xs text-dark/40 mb-3">
              Laissez vide pour garder le mot de passe actuel.
            </p>
          )}
          <div className="space-y-4">
            <div>
              <label className="block font-poppins text-xs font-medium text-dark/60 mb-1.5">
                Mot de passe{" "}
                {mode === "create" && <span className="text-primary">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === "create"
                      ? "Min. 8 caractères"
                      : "Nouveau mot de passe"
                  }
                  className={`${fieldClass("password")} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60 transition-colors"
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="font-poppins text-xs text-primary mt-1">
                  {errors.password}
                </p>
              )}
            </div>
            <div>
              <label className="block font-poppins text-xs font-medium text-dark/60 mb-1.5">
                Confirmer le mot de passe{" "}
                {mode === "create" && <span className="text-primary">*</span>}
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmer le mot de passe"
                className={fieldClass("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="font-poppins text-xs text-primary mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-lg border border-gray-300 font-poppins text-sm font-medium text-dark hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-dark/10"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-5 py-2.5 rounded-lg bg-primary text-white font-poppins text-sm font-medium hover:bg-primary/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {mode === "create" ? "Créer" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Outer Modal Wrapper                                                */
/* ------------------------------------------------------------------ */

export default function AdminModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSave,
}: AdminModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-90 flex items-center justify-center px-4 transition-all duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={
        mode === "create"
          ? "Nouvel administrateur"
          : "Modifier l'administrateur"
      }
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div
        className={`relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <AdminFormInner
          key={initialData?.id ?? (isOpen ? "new" : "closed")}
          mode={mode}
          initialData={initialData}
          onClose={onClose}
          onSave={onSave}
        />
      </div>
    </div>
  );
}
