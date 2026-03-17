"use client";

import { useState, useEffect, useCallback } from "react";
import Toast from "../component/shared/Toast";
import { useToast } from "../hooks/useToast";
import { useAdminAuth } from "../context/AdminAuthContext";
import { JSX } from "react/jsx-runtime";

/* ──────────────── Types ──────────────── */

interface SocialLinks {
  instagram: string;
  facebook: string;
  tiktok: string;
  twitter: string;
  youtube: string;
  pinterest: string;
}

interface BusinessProfile {
  storeName: string;
  storeDescription: string;
  logo: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  socialLinks: SocialLinks;
}

const DEFAULT_SOCIAL: SocialLinks = {
  instagram: "",
  facebook: "",
  tiktok: "",
  twitter: "",
  youtube: "",
  pinterest: "",
};

const DEFAULT_PROFILE: BusinessProfile = {
  storeName: "",
  storeDescription: "",
  logo: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  city: "",
  country: "",
  postalCode: "",
  socialLinks: { ...DEFAULT_SOCIAL },
};

/* ──────────────── API helper ──────────────── */

const API = "/api/admin/profile";

async function apiFetch<T>(
  url: string,
  opts?: RequestInit,
): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...opts,
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error ?? "Erreur serveur." };
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, error: "Erreur réseau." };
  }
}

/* ──────────────── Social icons ──────────────── */

const SOCIAL_CONFIG: {
  key: keyof SocialLinks;
  label: string;
  placeholder: string;
  icon: JSX.Element;
}[] = [
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/...",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    key: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/...",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    key: "tiktok",
    label: "TikTok",
    placeholder: "https://tiktok.com/@...",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
  {
    key: "twitter",
    label: "X (Twitter)",
    placeholder: "https://x.com/...",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@...",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    key: "pinterest",
    label: "Pinterest",
    placeholder: "https://pinterest.com/...",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.174.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
      </svg>
    ),
  },
];

/* ──────────────── Page ──────────────── */

export default function AdminProfilePage() {
  const { user } = useAdminAuth();
  const { toasts, addToast, removeToast } = useToast();

  const [profile, setProfile] = useState<BusinessProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ── Fetch ── */
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const res = await apiFetch<{ user: { businessProfile: BusinessProfile } }>(
      API,
    );
    if (res.ok && res.data?.user?.businessProfile) {
      const bp = res.data.user.businessProfile;
      setProfile({
        ...DEFAULT_PROFILE,
        ...bp,
        socialLinks: { ...DEFAULT_SOCIAL, ...bp.socialLinks },
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile();
  }, [fetchProfile]);

  /* ── Handlers ── */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [name]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await apiFetch(API, {
      method: "PUT",
      body: JSON.stringify(profile),
    });
    if (res.ok) {
      addToast("success", "Profil business mis à jour avec succès.");
    } else {
      addToast("error", res.error ?? "Erreur lors de la mise à jour.");
    }
    setSaving(false);
  };

  /* ── Skeleton loader ── */
  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="bg-white rounded-xl p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profil Business</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gérez les informations de votre boutique et vos liens sociaux.
        </p>
      </div>

      {/* Admin info (read-only) */}
      {user && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Compte administrateur
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
              {user.firstName[0]}
              {user.lastName[0]}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <span className="ml-auto px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary capitalize">
              {user.role.replace("_", " ")}
            </span>
          </div>
        </div>
      )}

      {/* Store Information */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Informations de la boutique
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de la boutique
            </label>
            <input
              type="text"
              name="storeName"
              value={profile.storeName}
              onChange={handleChange}
              placeholder="Ma Boutique"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="storeDescription"
              value={profile.storeDescription}
              onChange={handleChange}
              rows={3}
              placeholder="Une courte description de votre boutique..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email de contact
            </label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              placeholder="contact@maboutique.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="tel"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
              placeholder="+212 6XX XXX XXX"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site web
            </label>
            <input
              type="url"
              name="website"
              value={profile.website}
              onChange={handleChange}
              placeholder="https://maboutique.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Adresse
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <input
              type="text"
              name="address"
              value={profile.address}
              onChange={handleChange}
              placeholder="123 Rue ..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ville
            </label>
            <input
              type="text"
              name="city"
              value={profile.city}
              onChange={handleChange}
              placeholder="Casablanca"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code postal
            </label>
            <input
              type="text"
              name="postalCode"
              value={profile.postalCode}
              onChange={handleChange}
              placeholder="20000"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pays
            </label>
            <input
              type="text"
              name="country"
              value={profile.country}
              onChange={handleChange}
              placeholder="Maroc"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Réseaux sociaux
        </h2>

        <div className="space-y-3">
          {SOCIAL_CONFIG.map(({ key, label, placeholder, icon }) => (
            <div key={key} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                {icon}
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-0.5">
                  {label}
                </label>
                <input
                  type="url"
                  name={key}
                  value={profile.socialLinks[key]}
                  onChange={handleSocialChange}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Enregistrement..." : "Enregistrer les modifications"}
        </button>
      </div>
    </div>
  );
}
