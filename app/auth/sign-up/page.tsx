"use client";

import Link from "next/link";
import { useState, useCallback, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";

/* ════════════════════════════════════════════════════════════════
   Sign-Up Page — KINYN Luxury Fashion
   Route: /auth/sign-up
   ════════════════════════════════════════════════════════════════ */

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
}

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};

export default function SignUpPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  /* ── Field change handler ── */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    /* Clear error on interaction */
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  /* ── Validation ── */
  const validate = useCallback((): FormErrors => {
    const e: FormErrors = {};

    if (!form.firstName.trim()) e.firstName = "Le prénom est requis.";
    if (!form.lastName.trim()) e.lastName = "Le nom est requis.";

    if (!form.email.trim()) {
      e.email = "L'email est requis.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Veuillez entrer un email valide.";
    }

    if (!form.password) {
      e.password = "Le mot de passe est requis.";
    } else if (form.password.length < 8) {
      e.password = "Le mot de passe doit contenir au moins 8 caractères.";
    }

    if (!form.confirmPassword) {
      e.confirmPassword = "Veuillez confirmer votre mot de passe.";
    } else if (form.confirmPassword !== form.password) {
      e.confirmPassword = "Les mots de passe ne correspondent pas.";
    }

    if (!form.acceptTerms) {
      e.acceptTerms = "Vous devez accepter les conditions d'utilisation.";
    }

    return e;
  }, [form]);

  /* ── Submit ── */
  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const validationErrors = validate();
      setErrors(validationErrors);
      setApiError(null);

      if (Object.keys(validationErrors).length > 0) return;

      setLoading(true);
      try {
        const res = await fetch("/api/auth/sign-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            password: form.password,
            confirmPassword: form.confirmPassword,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setApiError(data.error ?? "Une erreur est survenue.");
          return;
        }

        setSubmitted(true);
      } catch {
        setApiError("Erreur de connexion au serveur. Réessayez plus tard.");
      } finally {
        setLoading(false);
      }
    },
    [validate, form],
  );

  /* ── Reusable input renderer ── */
  const inputClasses = (field: keyof FormErrors) =>
    `w-full rounded-lg border bg-white/60 px-4 py-3 font-poppins text-sm text-dark placeholder-dark/40 outline-none transition-all duration-200 ${
      errors[field]
        ? "border-primary ring-1 ring-primary/30"
        : "border-dark/15 hover:border-dark/30 focus:border-primary focus:ring-1 focus:ring-primary/30"
    }`;

  return (
    <main className="flex min-h-screen w-full bg-background">
      {/* ───────── Left — Brand Image (desktop only) ───────── */}
      <div className="relative hidden w-1/2 lg:block">
        <Image
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80"
          alt="KINYN — Mode de luxe"
          width={1000}
          height={1000}
          className="h-full w-full object-cover"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark/70 via-dark/30 to-transparent" />

        {/* Brand text over image */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
          <Link href="/" aria-label="Retour à l'accueil">
            <Image
              src="/images/logo.png"
              alt="KINYN"
              width={200}
              height={60}
              className="h-auto w-48 xl:w-56"
            />
          </Link>
          <p className="mt-4 max-w-md font-poppins text-sm leading-relaxed text-white/80">
            Créez votre compte et découvrez une mode pensée pour sublimer chaque
            moment de votre quotidien.
          </p>
        </div>
      </div>

      {/* ───────── Right — Sign-up Form ───────── */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="mb-8 text-center lg:hidden">
            <Link href="/" aria-label="Retour à l'accueil">
              <Image
                src="/images/logo.png"
                alt="KINYN"
                width={160}
                height={48}
                className="mx-auto h-auto w-40"
              />
            </Link>
          </div>

          {/* Card */}
          <div className="rounded-2xl bg-white/50 px-8 py-10 shadow-lg shadow-dark/5 backdrop-blur-sm sm:px-10">
            <h1 className="font-erotique text-3xl text-dark">
              Créer un compte
            </h1>
            <p className="mt-2 font-poppins text-sm text-dark/60">
              Rejoignez l&apos;univers KINYN
            </p>

            {/* Success state */}
            {submitted ? (
              <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="font-poppins text-sm font-medium text-green-800">
                  Votre compte a été créé avec succès !
                </p>
                <Link
                  href={
                    redirectTo !== "/"
                      ? `/auth/sign-in?redirect=${encodeURIComponent(redirectTo)}`
                      : "/auth/sign-in"
                  }
                  className="mt-4 inline-block font-poppins text-sm font-semibold text-primary underline-offset-2 transition-colors hover:underline"
                >
                  Se connecter
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="mt-8 space-y-5"
              >
                {/* Name row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Prénom */}
                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-1.5 block font-poppins text-xs font-medium tracking-wide text-dark/70"
                    >
                      Prénom <span className="text-primary">*</span>
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      aria-required="true"
                      aria-invalid={!!errors.firstName}
                      aria-describedby={
                        errors.firstName ? "err-firstName" : undefined
                      }
                      placeholder="Votre prénom"
                      value={form.firstName}
                      onChange={handleChange}
                      className={inputClasses("firstName")}
                    />
                    {errors.firstName && (
                      <p
                        id="err-firstName"
                        role="alert"
                        className="mt-1 font-poppins text-xs text-primary"
                      >
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  {/* Nom */}
                  <div>
                    <label
                      htmlFor="lastName"
                      className="mb-1.5 block font-poppins text-xs font-medium tracking-wide text-dark/70"
                    >
                      Nom <span className="text-primary">*</span>
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      aria-required="true"
                      aria-invalid={!!errors.lastName}
                      aria-describedby={
                        errors.lastName ? "err-lastName" : undefined
                      }
                      placeholder="Votre nom"
                      value={form.lastName}
                      onChange={handleChange}
                      className={inputClasses("lastName")}
                    />
                    {errors.lastName && (
                      <p
                        id="err-lastName"
                        role="alert"
                        className="mt-1 font-poppins text-xs text-primary"
                      >
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block font-poppins text-xs font-medium tracking-wide text-dark/70"
                  >
                    Email <span className="text-primary">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "err-email" : undefined}
                    placeholder="exemple@email.com"
                    value={form.email}
                    onChange={handleChange}
                    className={inputClasses("email")}
                  />
                  {errors.email && (
                    <p
                      id="err-email"
                      role="alert"
                      className="mt-1 font-poppins text-xs text-primary"
                    >
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block font-poppins text-xs font-medium tracking-wide text-dark/70"
                  >
                    Mot de passe <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      aria-required="true"
                      aria-invalid={!!errors.password}
                      aria-describedby={
                        errors.password ? "err-password" : undefined
                      }
                      placeholder="Min. 8 caractères"
                      value={form.password}
                      onChange={handleChange}
                      className={inputClasses("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/40 transition-colors hover:text-dark/70"
                    >
                      {showPassword ? (
                        <EyeOff size={18} strokeWidth={1.5} />
                      ) : (
                        <Eye size={18} strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p
                      id="err-password"
                      role="alert"
                      className="mt-1 font-poppins text-xs text-primary"
                    >
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1.5 block font-poppins text-xs font-medium tracking-wide text-dark/70"
                  >
                    Confirmer le mot de passe{" "}
                    <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      aria-required="true"
                      aria-invalid={!!errors.confirmPassword}
                      aria-describedby={
                        errors.confirmPassword
                          ? "err-confirmPassword"
                          : undefined
                      }
                      placeholder="Retapez votre mot de passe"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className={inputClasses("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((p) => !p)}
                      aria-label={
                        showConfirm
                          ? "Masquer la confirmation"
                          : "Afficher la confirmation"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/40 transition-colors hover:text-dark/70"
                    >
                      {showConfirm ? (
                        <EyeOff size={18} strokeWidth={1.5} />
                      ) : (
                        <Eye size={18} strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p
                      id="err-confirmPassword"
                      role="alert"
                      className="mt-1 font-poppins text-xs text-primary"
                    >
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Terms checkbox */}
                <div>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      name="acceptTerms"
                      type="checkbox"
                      checked={form.acceptTerms}
                      onChange={handleChange}
                      aria-invalid={!!errors.acceptTerms}
                      aria-describedby={
                        errors.acceptTerms ? "err-acceptTerms" : undefined
                      }
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-dark/20 accent-primary"
                    />
                    <span className="font-poppins text-xs leading-relaxed text-dark/60">
                      J&apos;accepte les{" "}
                      <Link
                        href="/conditions"
                        className="font-medium text-dark underline underline-offset-2 transition-colors hover:text-primary"
                      >
                        conditions d&apos;utilisation
                      </Link>{" "}
                      et la{" "}
                      <Link
                        href="/confidentialite"
                        className="font-medium text-dark underline underline-offset-2 transition-colors hover:text-primary"
                      >
                        politique de confidentialité
                      </Link>
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p
                      id="err-acceptTerms"
                      role="alert"
                      className="mt-1 font-poppins text-xs text-primary"
                    >
                      {errors.acceptTerms}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-primary py-3.5 font-poppins text-sm font-semibold tracking-wide text-white transition-all duration-200 hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin"
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
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Création en cours…
                    </span>
                  ) : (
                    "Créer un compte"
                  )}
                </button>

                {/* API Error */}
                {apiError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center">
                    <p className="font-poppins text-sm text-red-700">
                      {apiError}
                    </p>
                  </div>
                )}

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-dark/10" />
                  <span className="font-poppins text-[11px] text-dark/40">
                    ou
                  </span>
                  <span className="h-px flex-1 bg-dark/10" />
                </div>

                {/* Google placeholder */}
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-dark/15 bg-white py-3.5 font-poppins text-sm font-medium text-dark transition-all duration-200 hover:border-dark/30 hover:bg-dark/[0.02] active:scale-[0.98]"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continuer avec Google
                </button>
              </form>
            )}

            {/* Link to sign-in */}
            {!submitted && (
              <p className="mt-8 text-center font-poppins text-sm text-dark/60">
                Vous avez déjà un compte ?{" "}
                <Link
                  href="/auth/sign-in"
                  className="font-semibold text-primary underline-offset-2 transition-colors hover:underline"
                >
                  Se connecter
                </Link>
              </p>
            )}
          </div>

          {/* Footer note */}
          <p className="mt-6 text-center font-poppins text-[11px] text-dark/40">
            © {new Date().getFullYear()} KINYN. Tous droits réservés.
          </p>
        </div>
      </div>
    </main>
  );
}
