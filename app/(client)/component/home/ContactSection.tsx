"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Mail, Phone, MapPin, Instagram, Facebook } from "lucide-react";

const INQUIRY_TYPES = [
  "Service client",
  "Commande",
  "Collaboration",
  "Presse",
  "Autre",
];

interface BusinessProfile {
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  socialLinks: { instagram: string; facebook: string };
}

export default function ContactSection() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    inquiry: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);

  useEffect(() => {
    fetch("/api/business-profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.profile) setProfile(data.profile);
      })
      .catch(() => {});
  }, []);

  const update = useCallback(
    (field: string) =>
      (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
      ) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value })),
    [],
  );

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!form.name.trim() || !form.email.trim() || !form.message.trim())
        return;
      setSubmitted(true);
    },
    [form],
  );

  const locationParts = [
    profile?.address,
    profile?.city,
    profile?.postalCode,
    profile?.country,
  ].filter(Boolean);
  const location = locationParts.join(", ");

  const socials = [];
  if (profile?.socialLinks.instagram)
    socials.push({
      label: "Instagram",
      href: profile.socialLinks.instagram,
      icon: Instagram,
    });
  if (profile?.socialLinks.facebook)
    socials.push({
      label: "Facebook",
      href: profile.socialLinks.facebook,
      icon: Facebook,
    });

  return (
    <section className="bg-background py-12 sm:py-16 md:py-20 lg:py-28 px-4 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-275">
        {/* Header */}
        <div className="mb-10 sm:mb-14 md:mb-16 lg:mb-20 text-center">
          <p className="font-poppins text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-primary">
            Nous ecrire
          </p>
          <h2 className="mt-3 font-erotique text-3xl sm:text-4xl md:text-5xl text-dark">
            Contact
          </h2>
          <p className="mx-auto mt-5 max-w-md font-poppins text-[0.88rem] leading-relaxed text-dark/50">
            Une question, une demande particuliere ou simplement envie
            d&apos;echanger -- nous sommes a votre ecoute.
          </p>
        </div>

        {/* Two-column */}
        <div className="grid gap-10 sm:gap-12 md:grid-cols-5 md:gap-12 lg:gap-20">
          {/* Left - Info */}
          <div className="space-y-7 sm:space-y-10 md:col-span-2">
            <p className="font-poppins text-[0.85rem] leading-[1.8] text-dark/60">
              Kinyn incarne une vision ou le raffinement rencontre
              l&apos;authenticite. Chaque echange compte -- nous vous repondons
              avec le meme soin que celui accorde a nos creations.
            </p>

            {/* Contact details */}
            <div className="space-y-6">
              {profile?.email && (
                <div className="flex items-start gap-4">
                  <Mail
                    className="mt-0.5 h-4.5 w-4.5 shrink-0 text-dark/35"
                    strokeWidth={1.5}
                  />
                  <div>
                    <p className="font-poppins text-[0.72rem] uppercase tracking-[0.15em] text-dark/40">
                      Email
                    </p>
                    <a
                      href={`mailto:${profile.email}`}
                      className="mt-1 block font-poppins text-[0.88rem] text-dark transition-colors duration-200 hover:text-primary"
                    >
                      {profile.email}
                    </a>
                  </div>
                </div>
              )}

              {profile?.phone && (
                <div className="flex items-start gap-4">
                  <Phone
                    className="mt-0.5 h-4.5 w-4.5 shrink-0 text-dark/35"
                    strokeWidth={1.5}
                  />
                  <div>
                    <p className="font-poppins text-[0.72rem] uppercase tracking-[0.15em] text-dark/40">
                      Telephone
                    </p>
                    <a
                      href={`tel:${profile.phone}`}
                      className="mt-1 block font-poppins text-[0.88rem] text-dark transition-colors duration-200 hover:text-primary"
                    >
                      {profile.phone}
                    </a>
                  </div>
                </div>
              )}

              {location && (
                <div className="flex items-start gap-4">
                  <MapPin
                    className="mt-0.5 h-4.5 w-4.5 shrink-0 text-dark/35"
                    strokeWidth={1.5}
                  />
                  <div>
                    <p className="font-poppins text-[0.72rem] uppercase tracking-[0.15em] text-dark/40">
                      Showroom
                    </p>
                    <p className="mt-1 font-poppins text-[0.88rem] text-dark">
                      {location}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Socials */}
            {socials.length > 0 && (
              <div>
                <p className="mb-4 font-poppins text-[0.72rem] uppercase tracking-[0.15em] text-dark/40">
                  Suivez-nous
                </p>
                <div className="flex items-center gap-4">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-dark/10 text-dark/50 transition-all duration-200 hover:border-dark/30 hover:text-dark"
                    >
                      <s.icon className="h-4 w-4" strokeWidth={1.5} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right - Form */}
          <div className="md:col-span-3">
            {submitted ? (
              <div className="flex min-h-105 items-center justify-center rounded-2xl border border-dark/5 bg-white px-8 py-16">
                <div className="text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-6 w-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-erotique text-2xl text-dark">
                    Message envoye
                  </h3>
                  <p className="mt-3 font-poppins text-[0.85rem] text-dark/50">
                    Merci pour votre message. Notre equipe vous repondra dans
                    les plus brefs delais.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setForm({
                        name: "",
                        email: "",
                        inquiry: "",
                        subject: "",
                        message: "",
                      });
                    }}
                    className="mt-8 font-poppins text-[0.78rem] tracking-[0.05em] text-primary underline underline-offset-4 transition-opacity duration-200 hover:opacity-70"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="space-y-5 rounded-2xl border border-dark/5 bg-white px-6 py-8 sm:px-8 sm:py-10"
                aria-label="Formulaire de contact"
              >
                {/* Name and Email row */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="mb-2 block font-poppins text-[0.72rem] uppercase tracking-[0.12em] text-dark/50"
                    >
                      Nom <span className="text-primary">*</span>
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={form.name}
                      onChange={update("name")}
                      required
                      placeholder="Votre nom"
                      className="w-full rounded-lg border border-dark/10 bg-white px-4 py-3 font-poppins text-[0.85rem] text-dark placeholder-dark/30 outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/15"
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-2 block font-poppins text-[0.72rem] uppercase tracking-[0.12em] text-dark/50"
                    >
                      Email <span className="text-primary">*</span>
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={form.email}
                      onChange={update("email")}
                      required
                      placeholder="votre@email.com"
                      className="w-full rounded-lg border border-dark/10 bg-white px-4 py-3 font-poppins text-[0.85rem] text-dark placeholder-dark/30 outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/15"
                      aria-required="true"
                    />
                  </div>
                </div>

                {/* Inquiry type and Subject row */}
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-inquiry"
                      className="mb-2 block font-poppins text-[0.72rem] uppercase tracking-[0.12em] text-dark/50"
                    >
                      Type de demande
                    </label>
                    <select
                      id="contact-inquiry"
                      value={form.inquiry}
                      onChange={update("inquiry")}
                      className="w-full appearance-none rounded-lg border border-dark/10 bg-white px-4 py-3 font-poppins text-[0.85rem] text-dark outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/15"
                    >
                      <option value="">Selectionner</option>
                      {INQUIRY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="mb-2 block font-poppins text-[0.72rem] uppercase tracking-[0.12em] text-dark/50"
                    >
                      Sujet
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      value={form.subject}
                      onChange={update("subject")}
                      placeholder="Sujet de votre message"
                      className="w-full rounded-lg border border-dark/10 bg-white px-4 py-3 font-poppins text-[0.85rem] text-dark placeholder-dark/30 outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-2 block font-poppins text-[0.72rem] uppercase tracking-[0.12em] text-dark/50"
                  >
                    Message <span className="text-primary">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    value={form.message}
                    onChange={update("message")}
                    required
                    rows={5}
                    placeholder="Votre message..."
                    className="w-full resize-none rounded-lg border border-dark/10 bg-white px-4 py-3 font-poppins text-[0.85rem] text-dark placeholder-dark/30 outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/15"
                    aria-required="true"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full rounded-lg bg-primary py-3.5 font-poppins text-[0.82rem] font-semibold tracking-[0.08em] text-white transition-all duration-300 hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99]"
                >
                  Envoyer le message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
