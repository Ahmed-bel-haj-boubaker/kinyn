"use client";

import Link from "next/link";
import { useState, useCallback, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

/* ════════════════════════════════════════════════════════════════
   Forget Password Page — KINYN Luxury Fashion
   Route: /auth/forget-password
   ════════════════════════════════════════════════════════════════ */

interface FormState {
  email: string;
}

interface FormErrors {
  email?: string;
}

const initialForm: FormState = {
  email: "",
};

export default function ForgetPasswordPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  /* ── Field change handler ── */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    /* Clear error on interaction */
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }, []);

  /* ── Validation ── */
  const validate = useCallback((): FormErrors => {
    const e: FormErrors = {};

    if (!form.email.trim()) {
      e.email = "L'email est requis.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Veuillez entrer un email valide.";
    }

    return e;
  }, [form]);

  /* ── Submit ── */
  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const validationErrors = validate();
      setErrors(validationErrors);

      if (Object.keys(validationErrors).length === 0) {
        setSubmitted(true);
        /* Placeholder — no backend logic */
      }
    },
    [validate],
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
          src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=80"
          alt="KINYN — Mode de luxe"
          width={1000}
          height={1000}
          className="h-full w-full object-cover"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark/70 via-dark/30 to-transparent" />

        {/* Brand logo over image */}
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
            Réinitialisez votre mot de passe en toute sécurité pour retrouver
            l&apos;accès à votre compte.
          </p>
        </div>
      </div>

      {/* ───────── Right — Reset Password Form ───────── */}
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
            {/* Back button */}
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center gap-2 font-poppins text-xs font-medium text-dark/60 transition-colors hover:text-dark"
            >
              <ArrowLeft size={16} strokeWidth={1.5} />
              Retour à la connexion
            </Link>

            <h1 className="mt-6 font-erotique text-3xl text-dark">
              Mot de passe oublié
            </h1>
            <p className="mt-2 font-poppins text-sm text-dark/60">
              Entrez votre email pour recevoir un lien de réinitialisation
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="font-poppins text-sm font-medium text-green-800">
                  Email envoyé avec succès !
                </p>
                <p className="mt-2 font-poppins text-xs text-green-700/80">
                  Vérifiez votre boîte de réception. Si vous ne voyez pas
                  l&apos;email, pensez à vérifier vos spams.
                </p>
                <Link
                  href="/auth/sign-in"
                  className="mt-4 inline-block font-poppins text-sm font-semibold text-primary underline-offset-2 transition-colors hover:underline"
                >
                  Retour à la connexion
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="mt-8 space-y-5"
              >
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

                {/* Info message */}
                <div className="rounded-lg border border-dark/10 bg-white/40 p-4">
                  <p className="font-poppins text-xs leading-relaxed text-dark/60">
                    Nous vous enverrons un lien de réinitialisation à
                    l&apos;adresse email associée à votre compte. Ce lien sera
                    valide pendant 24 heures.
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full rounded-lg bg-primary py-3.5 font-poppins text-sm font-semibold tracking-wide text-white transition-all duration-200 hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98]"
                >
                  Envoyer le lien de réinitialisation
                </button>
              </form>
            )}

            {/* Link to sign-in */}
            {!submitted && (
              <p className="mt-8 text-center font-poppins text-sm text-dark/60">
                Vous vous souvenez de votre mot de passe ?{" "}
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
