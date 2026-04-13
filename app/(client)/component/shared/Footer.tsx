"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Facebook,
  Instagram,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Heart,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BusinessProfile {
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  socialLinks: {
    instagram: string;
    facebook: string;
  };
}

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const ACCOUNT = [
  { label: "Mon profil", href: "/profile" },
  { label: "Suivi de commande", href: "/profile?tab=orders" },
  { label: "Mes adresses", href: "/profile?tab=addresses" },
  { label: "Informations personnelles", href: "/profile?tab=info" },
];

const SERVICE = [
  { label: "Contactez-nous", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Livraison & Retours", href: "/livraison-retours" },

  {
    label: "Politique de confidentialité",
    href: "/politique-de-confidentialite",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);

  useEffect(() => {
    /* Fetch business profile */
    fetch("/api/business-profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.profile) setProfile(data.profile);
      })
      .catch(() => {});
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 4000);
  };

  /* Build social links from profile */
  const socials = [];
  if (profile?.socialLinks.facebook) {
    socials.push({
      label: "Facebook",
      href: profile.socialLinks.facebook,
      icon: Facebook,
    });
  }
  if (profile?.socialLinks.instagram) {
    socials.push({
      label: "Instagram",
      href: profile.socialLinks.instagram,
      icon: Instagram,
    });
  }

  /* Location string */
  const location = [profile?.address, profile?.city, profile?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <footer role="contentinfo" className="bg-dark text-white/80">
      {/* ============ main grid ============ */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-10 md:pt-20 md:pb-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10">
          {/* ---------- col 1: brand ---------- */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              className="inline-block mb-5"
              aria-label="Kinyn — Accueil"
            >
              <Image
                src="/images/logo2.png"
                alt="Kinyn"
                width={70}
                height={70}
                className="brightness-0 invert opacity-90"
              />
            </Link>

            <p className="font-poppins text-white/50 text-sm leading-relaxed mb-6 max-w-xs">
              Kinyn incarne l&apos;élégance tunisienne contemporaine. Des
              créations uniques mêlant savoir-faire artisanal et design moderne,
              pour ceux qui recherchent un style raffiné et intemporel.
            </p>

            {/* social icons */}
            {socials.length > 0 && (
              <div className="flex items-center gap-3">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Suivre Kinyn sur ${s.label}`}
                    className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center
                               text-white/60 hover:bg-primary hover:text-white
                               transition-colors duration-200"
                  >
                    <s.icon size={16} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* ---------- col 2: votre compte ---------- */}
          <div>
            <h3 className="font-erotique text-white text-lg mb-5 tracking-wide">
              Votre Compte
            </h3>
            <ul className="space-y-2.5">
              {ACCOUNT.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="font-poppins text-white/50 text-sm hover:text-primary
                               transition-colors duration-200 inline-block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ---------- col 3: service client ---------- */}
          <div>
            <h3 className="font-erotique text-white text-lg mb-5 tracking-wide">
              Service Client
            </h3>
            <ul className="space-y-2.5">
              {SERVICE.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="font-poppins text-white/50 text-sm hover:text-primary
                               transition-colors duration-200 inline-block"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ---------- col 4: contact + newsletter ---------- */}
          <div>
            <h3 className="font-erotique text-white text-lg mb-5 tracking-wide">
              Contact
            </h3>

            {/* contact details */}
            <ul className="space-y-3 mb-8">
              {location && (
                <li className="flex items-start gap-2.5">
                  <MapPin size={15} className="text-primary mt-0.5 shrink-0" />
                  <span className="font-poppins text-white/50 text-sm leading-relaxed">
                    {location}
                  </span>
                </li>
              )}
              {profile?.phone && (
                <li className="flex items-center gap-2.5">
                  <Phone size={15} className="text-primary shrink-0" />
                  <a
                    href={`tel:${profile.phone}`}
                    className="font-poppins text-white/50 text-sm hover:text-primary
                               transition-colors duration-200"
                  >
                    {profile.phone}
                  </a>
                </li>
              )}
              {profile?.email && (
                <li className="flex items-center gap-2.5">
                  <Mail size={15} className="text-primary shrink-0" />
                  <a
                    href={`mailto:${profile.email}`}
                    className="font-poppins text-white/50 text-sm hover:text-primary
                               transition-colors duration-200"
                  >
                    {profile.email}
                  </a>
                </li>
              )}
            </ul>

            {/* mini newsletter */}
            <p className="font-poppins text-white/40 text-xs mb-3 uppercase tracking-wider">
              Newsletter
            </p>
            <form onSubmit={handleSubscribe} className="flex">
              <label htmlFor="footer-email" className="sr-only">
                Adresse e-mail
              </label>
              <input
                id="footer-email"
                type="email"
                required
                placeholder="Votre e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 min-w-0 bg-white/8 border border-white/10
                           rounded-l-full px-4 py-2.5 font-poppins text-sm text-white
                           placeholder:text-white/30 focus:outline-none focus:border-primary/50
                           transition-colors duration-200"
              />
              <button
                type="submit"
                aria-label="S'abonner à la newsletter"
                className="bg-primary hover:bg-primary/80 text-white
                           px-4 rounded-r-full transition-colors duration-200
                           flex items-center justify-center"
              >
                <ArrowRight size={16} />
              </button>
            </form>
            {subscribed && (
              <p className="font-poppins text-primary text-xs mt-2 animate-pulse">
                Merci pour votre inscription !
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ============ bottom bar ============ */}
      <div className="border-t border-white/8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-poppins text-white/35 text-xs text-center sm:text-left">
            &copy; {new Date().getFullYear()} Kinyn. Tous droits réservés.
          </p>
          <p className="font-poppins text-white/25 text-xs flex items-center gap-1">
            Fait avec <Heart size={11} className="text-primary fill-primary" />{" "}
            en Tunisie
          </p>
        </div>
      </div>
    </footer>
  );
}
