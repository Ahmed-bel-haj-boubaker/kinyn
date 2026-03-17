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
}

interface BusinessProfile {
  logo: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  socialLinks: SocialLinks;
}

const DEFAULT_SOCIAL: SocialLinks = {
  instagram: "",
  facebook: "",
};

const DEFAULT_PROFILE: BusinessProfile = {
  logo: "",
  phone: "",
  email: "",
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-poppins">
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
              placeholder="+216 70 XXX XXX"
              className="w-full font-poppins rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
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
              className="w-full rounded-lg  font-poppins border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
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
              className="w-full rounded-lg border font-poppins border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
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
