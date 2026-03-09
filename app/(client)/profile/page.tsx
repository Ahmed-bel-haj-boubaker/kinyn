"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MapPin,
  Pencil,
  Trash2,
  Plus,
  Package,
  Heart,
  ShoppingBag,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import ProfileSidebar, {
  type ProfileSection,
} from "../component/profile/ProfileSidebar";
import ProfileInfo from "../component/profile/ProfileInfo";
import AddressModal from "../component/profile/AddressModal";
import OrdersList from "../component/profile/OrdersList";
import WishlistGrid from "../component/profile/WishlistGrid";

/* ─────────── User type (matches SafeUser from API) ─────────── */

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  avatar: string;
  isEmailVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
}

/* ─────────── Address ─────────── */

interface Address {
  id: string;
  label: string;
  country: string;
  city: string;
  address: string;
  postalCode: string;
  isDefault: boolean;
}

/* ─────────── Overview Order (minimal shape) ─────────── */

interface OverviewOrder {
  id: string;
  ref: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  processing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  returned: "Retournée",
};

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  processing: "bg-indigo-50 text-indigo-700 border-indigo-200",
  shipped: "bg-cyan-50 text-cyan-700 border-cyan-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-600 border-red-200",
  returned: "bg-gray-50 text-gray-600 border-gray-200",
};

/* ─────────── Component ─────────── */

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { totalItems: cartCount } = useCart();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /* ── Overview stats (real data) ── */
  const [recentOrders, setRecentOrders] = useState<OverviewOrder[]>([]);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [wishlistCount, setWishlistCount] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const validSections: ProfileSection[] = [
    "overview",
    "info",
    "addresses",
    "orders",
    "wishlist",
  ];
  const [section, setSection] = useState<ProfileSection>("overview");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);

  /* ── Sync section from ?tab= URL param after hydration ── */
  useEffect(() => {
    const tabParam = searchParams.get("tab") as ProfileSection | null;
    if (tabParam && validSections.includes(tabParam)) {
      setSection(tabParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /* ── Fetch overview stats (orders + wishlist) ── */
  useEffect(() => {
    async function fetchStats() {
      setStatsLoading(true);
      try {
        const [ordersRes, wishlistRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/auth/me/wishlist"),
        ]);
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          const orders: OverviewOrder[] = data.orders ?? [];
          setOrderCount(orders.length);
          setRecentOrders(orders.slice(0, 2));
        }
        if (wishlistRes.ok) {
          const data = await wishlistRes.json();
          setWishlistCount((data.products ?? []).length);
        }
      } catch {
        /* silently fail */
      } finally {
        setStatsLoading(false);
      }
    }
    fetchStats();
  }, []);

  /* ── Fetch addresses from API ── */
  useEffect(() => {
    async function fetchAddresses() {
      setAddressesLoading(true);
      try {
        const res = await fetch("/api/auth/me/addresses");
        if (res.ok) {
          const data = await res.json();
          setAddresses(data.addresses ?? []);
        }
      } catch {
        /* silently fail – addresses will stay empty */
      } finally {
        setAddressesLoading(false);
      }
    }
    fetchAddresses();
  }, []);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [modalKey, setModalKey] = useState(0);

  /* ── Fetch connected user ── */

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/auth/sign-in");
          return;
        }
        const json = await res.json();
        setUser(json.user);
      } catch {
        router.push("/auth/sign-in");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  /* ── Handle user update from ProfileInfo ── */

  const handleUserUpdate = useCallback((updated: UserProfile) => {
    setUser(updated);
  }, []);

  /* ── Logout ── */

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
    } finally {
      router.push("/auth/sign-in");
    }
  }, [router]);

  const openAddModal = () => {
    setEditingAddress(null);
    setModalKey((k) => k + 1);
    setModalOpen(true);
  };

  const openEditModal = (addr: Address) => {
    setEditingAddress(addr);
    setModalKey((k) => k + 1);
    setModalOpen(true);
  };

  const deleteAddress = async (id: string) => {
    const res = await fetch(`/api/auth/me/addresses/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleSaveAddress = useCallback(
    async (form: {
      label: string;
      country: string;
      city: string;
      address: string;
      postalCode: string;
    }) => {
      if (editingAddress) {
        const res = await fetch(`/api/auth/me/addresses/${editingAddress.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const data = await res.json();
          setAddresses((prev) =>
            prev.map((a) => (a.id === editingAddress.id ? data.address : a)),
          );
        }
      } else {
        const res = await fetch("/api/auth/me/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const data = await res.json();
          setAddresses((prev) => [...prev, data.address]);
        }
      }
    },
    [editingAddress],
  );

  /* ─── Section renderers ─── */

  const renderOverview = () => (
    <section className="space-y-6 sm:space-y-10">
      {/* Welcome header */}
      <div>
        <h2 className="font-erotique text-xl sm:text-2xl lg:text-3xl text-dark mb-1.5 sm:mb-2">
          Bienvenue, {user?.firstName ?? ""}
        </h2>
        <p className="font-poppins text-[12.5px] sm:text-[13.5px] text-[#888] leading-relaxed">
          Gérez vos informations personnelles, vos adresses et suivez vos
          commandes.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {[
          { label: "Commandes", value: orderCount, icon: Package },
          { label: "Souhaits", value: wishlistCount, icon: Heart },
          { label: "Panier", value: cartCount, icon: ShoppingBag },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 rounded-xl bg-white border border-[#EEECE7] shadow-[0_2px_12px_rgba(0,0,0,0.03)] px-3 py-4 sm:px-6 sm:py-5"
          >
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-primary/8 text-primary shrink-0">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.5} />
            </div>
            <div className="text-center sm:text-left">
              {statsLoading && value === null ? (
                <Loader2
                  className="h-4 w-4 animate-spin text-dark/20 mx-auto sm:mx-0 mb-0.5"
                  strokeWidth={2}
                />
              ) : (
                <p className="font-poppins text-[18px] sm:text-[22px] font-semibold text-dark leading-none mb-0.5">
                  {value ?? 0}
                </p>
              )}
              <p className="font-poppins text-[10px] sm:text-[11.5px] text-[#999]">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="font-erotique text-base sm:text-lg text-dark">
            Commandes récentes
          </h3>
          <button
            type="button"
            onClick={() => setSection("orders")}
            className="flex items-center gap-1 font-poppins text-[11px] sm:text-[12px] text-primary transition-colors hover:text-primary/70"
          >
            Voir tout
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>

        {statsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2
              className="h-5 w-5 animate-spin text-dark/20"
              strokeWidth={1.5}
            />
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#DDD] py-8 text-center">
            <Package className="h-5 w-5 text-[#CCC] mb-2" strokeWidth={1.5} />
            <p className="font-poppins text-[12px] sm:text-[13px] text-[#999]">
              Aucune commande passée.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 sm:gap-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-white border border-[#EEECE7] shadow-[0_2px_12px_rgba(0,0,0,0.03)] px-4 sm:px-6 py-3.5 sm:py-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-primary/8 text-primary shrink-0">
                    <Package
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-poppins text-[12px] sm:text-[12.5px] font-medium text-dark truncate">
                      #{order.ref}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock
                        className="h-3 w-3 text-[#999] shrink-0"
                        strokeWidth={1.5}
                      />
                      <p className="font-poppins text-[10.5px] sm:text-[11px] text-[#999]">
                        {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 font-poppins text-[9.5px] sm:text-[10.5px] font-medium ${
                      statusStyles[order.status] ??
                      "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {statusLabels[order.status] ?? order.status}
                  </span>
                  <p className="font-poppins text-[12px] sm:text-[13px] font-semibold text-dark">
                    {order.totalAmount.toFixed(2)} TND
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Default address */}
      {addresses.length > 0 &&
        (() => {
          const def = addresses.find((a) => a.isDefault) ?? addresses[0];
          return (
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="font-erotique text-base sm:text-lg text-dark">
                  Adresse par défaut
                </h3>
                <button
                  type="button"
                  onClick={() => setSection("addresses")}
                  className="flex items-center gap-1 font-poppins text-[11px] sm:text-[12px] text-primary transition-colors hover:text-primary/70"
                >
                  Gérer
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-white border border-[#EEECE7] shadow-[0_2px_12px_rgba(0,0,0,0.03)] px-4 sm:px-6 py-4 sm:py-5">
                <MapPin
                  className="h-4 w-4 text-primary shrink-0 mt-0.5"
                  strokeWidth={1.5}
                />
                <div className="min-w-0">
                  <p className="font-poppins text-[12.5px] sm:text-[13px] font-medium text-dark">
                    {def.label}
                  </p>
                  <p className="font-poppins text-[12.5px] sm:text-[13.5px] text-dark mt-0.5">
                    {def.address}
                  </p>
                  <p className="font-poppins text-[11px] sm:text-[12px] text-[#999] mt-0.5">
                    {def.city}, {def.postalCode} — {def.country}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setSection("info")}
          className="cursor-pointer flex items-center gap-3 rounded-xl bg-white border border-[#EEECE7] shadow-[0_2px_12px_rgba(0,0,0,0.03)] px-4 py-4 sm:px-6 sm:py-5 text-left transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-primary/20 active:scale-[0.98]"
        >
          <Pencil className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
          <div className="min-w-0">
            <p className="font-poppins text-[12.5px] sm:text-[13px] font-medium text-dark">
              Modifier le Profil
            </p>
            <p className="font-poppins text-[11px] sm:text-[11.5px] text-[#999] mt-0.5">
              Mettre à jour vos informations personnelles
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setSection("orders")}
          className="cursor-pointer flex items-center gap-3 rounded-xl bg-white border border-[#EEECE7] shadow-[0_2px_12px_rgba(0,0,0,0.03)] px-4 py-4 sm:px-6 sm:py-5 text-left transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-primary/20 active:scale-[0.98]"
        >
          <Package
            className="h-4 w-4 text-primary shrink-0"
            strokeWidth={1.5}
          />
          <div className="min-w-0">
            <p className="font-poppins text-[12.5px] sm:text-[13px] font-medium text-dark">
              Suivre mes Commandes
            </p>
            <p className="font-poppins text-[11px] sm:text-[11.5px] text-[#999] mt-0.5">
              Voir l&apos;état de vos commandes récentes
            </p>
          </div>
        </button>
      </div>
    </section>
  );

  const renderAddresses = () => (
    <section>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="font-erotique text-base sm:text-lg text-dark">
          Mes Adresses
        </h3>
        <button
          type="button"
          onClick={openAddModal}
          className="flex cursor-pointer items-center gap-1.5 sm:gap-2 rounded-full border border-primary px-3 py-1.5 sm:px-4 sm:py-2 font-poppins text-[11px] sm:text-[12px] font-medium text-primary transition-all duration-200 hover:bg-primary hover:text-white active:scale-95"
        >
          <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={1.5} />
          <span>Ajouter</span>
        </button>
      </div>

      {addressesLoading ? (
        <div className="flex items-center justify-center py-10">
          <svg
            className="w-6 h-6 text-primary animate-spin"
            fill="none"
            viewBox="0 0 24 24"
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
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 sm:gap-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-white border border-[#EEECE7] shadow-[0_2px_12px_rgba(0,0,0,0.03)] px-4 sm:px-6 py-3.5 sm:py-5"
            >
              <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                <MapPin
                  className="h-4 w-4 text-primary shrink-0 mt-0.5"
                  strokeWidth={1.5}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-poppins text-[12.5px] sm:text-[13px] font-medium text-dark">
                      {addr.label}
                    </p>
                    {addr.isDefault && (
                      <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 font-poppins text-[9.5px] font-medium text-primary">
                        Par défaut
                      </span>
                    )}
                  </div>
                  <p className="font-poppins text-[12.5px] sm:text-[13.5px] text-dark leading-snug">
                    {addr.address}
                  </p>
                  <p className="font-poppins text-[11px] sm:text-[12px] text-[#999] mt-0.5">
                    {addr.city}, {addr.postalCode} — {addr.country}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-6.5 sm:ml-0">
                <button
                  type="button"
                  onClick={() => openEditModal(addr)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E0DED9] px-3 py-1.5 sm:px-3.5 font-poppins text-[10.5px] sm:text-[11px] font-medium text-[#666] transition-all duration-200 hover:border-primary hover:text-primary active:scale-95"
                  aria-label={`Modifier l'adresse ${addr.address}`}
                >
                  <Pencil className="h-3 w-3" strokeWidth={1.5} />
                  <span>Modifier</span>
                </button>
                <button
                  type="button"
                  onClick={() => deleteAddress(addr.id)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E0DED9] px-3 py-1.5 sm:px-3.5 font-poppins text-[10.5px] sm:text-[11px] font-medium text-[#666] transition-all duration-200 hover:border-red-400 hover:text-red-500 active:scale-95"
                  aria-label={`Supprimer l'adresse ${addr.address}`}
                >
                  <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                  <span>Supprimer</span>
                </button>
              </div>
            </div>
          ))}

          {addresses.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#DDD] py-10 sm:py-12 text-center">
              <MapPin
                className="h-5 w-5 sm:h-6 sm:w-6 text-[#CCC] mb-2.5 sm:mb-3"
                strokeWidth={1.5}
              />
              <p className="font-poppins text-[12px] sm:text-[13px] text-[#999]">
                Aucune adresse enregistrée.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );

  const sectionContent: Record<ProfileSection, React.ReactNode> = {
    overview: renderOverview(),
    info: <ProfileInfo user={user} onUpdate={handleUserUpdate} />,
    addresses: renderAddresses(),
    orders: <OrdersList />,
    wishlist: <WishlistGrid />,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-12 py-8 sm:py-12 lg:py-20">
        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <svg
                className="w-8 h-8 text-primary animate-spin"
                fill="none"
                viewBox="0 0 24 24"
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
              <p className="font-poppins text-sm text-dark/40">Chargement…</p>
            </div>
          </div>
        ) : (
          <>
            {/* Page title */}
            <h1 className="font-erotique text-2xl sm:text-3xl lg:text-4xl text-dark mb-6 sm:mb-10 lg:mb-14">
              Mon Compte
            </h1>

            {/* Layout: sidebar + content */}
            <div className="flex flex-col lg:flex-row lg:gap-12">
              <ProfileSidebar
                active={section}
                onChange={setSection}
                onLogout={handleLogout}
              />
              <div className="flex-1 min-w-0">{sectionContent[section]}</div>
            </div>
          </>
        )}
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveAddress}
        initial={
          editingAddress
            ? {
                label: editingAddress.label,
                country: editingAddress.country,
                city: editingAddress.city,
                address: editingAddress.address,
                postalCode: editingAddress.postalCode,
              }
            : null
        }
        resetKey={modalKey}
      />
    </div>
  );
}
