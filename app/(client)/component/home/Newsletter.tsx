"use client";

import { Mail } from "lucide-react";
import { FormEvent, useCallback, useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!email.trim()) return;
      setSubmitted(true);
      setEmail("");
    },
    [email],
  );

  return (
    <section className="bg-dark py-20 px-6 lg:px-10">
      <div className="mx-auto max-w-[680px] text-center">
        {/* Icon */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" strokeWidth={1.8} />
        </div>

        {/* Heading */}
        <h2 className="font-erotique text-3xl text-background sm:text-4xl">
          Restez Inspiré
        </h2>

        <p className="mx-auto mt-4 max-w-md font-poppins text-[0.88rem] leading-relaxed text-background/55">
          Inscrivez-vous pour recevoir en avant-première nos nouvelles
          collections, offres exclusives et conseils mode.
        </p>

        {/* Form */}
        {submitted ? (
          <div className="mt-10 rounded-full border border-primary/30 bg-primary/10 px-8 py-4">
            <p className="font-poppins text-[0.88rem] font-medium text-primary">
              Merci pour votre inscription ! ✓
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-0"
            aria-label="Inscription newsletter"
          >
            <div className="relative w-full sm:flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse e-mail"
                required
                className="w-full rounded-full border border-background/15 bg-background/10 px-6 py-3.5 font-poppins text-[0.82rem] text-background placeholder-background/35 outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/30 sm:rounded-r-none sm:pr-4"
                aria-label="Adresse e-mail"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-full bg-primary px-8 py-3.5 font-poppins text-[0.82rem] font-semibold tracking-wide text-background transition-transform duration-200 ease-out hover:scale-105 active:scale-[0.98] sm:w-auto sm:rounded-l-none"
            >
              S&apos;abonner
            </button>
          </form>
        )}

        <p className="mt-5 font-poppins text-[0.68rem] text-background/30">
          En vous inscrivant, vous acceptez notre politique de confidentialité.
          Désabonnement possible à tout moment.
        </p>
      </div>
    </section>
  );
}
