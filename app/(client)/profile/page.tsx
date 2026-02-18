"use client";

import { useState, useCallback } from "react";
import {
  MapPin,
  Pencil,
  Trash2,
  Plus,
  Package,
  Heart,
  ShoppingBag,
} from "lucide-react";
import ProfileSidebar, { type ProfileSection } from "../component/profile/ProfileSidebar";
import ProfileInfo from "../component/profile/ProfileInfo";
import AddressModal from "../component/profile/AddressModal";
import OrdersList from "../component/profile/OrdersList";
import WishlistGrid from "../component/profile/WishlistGrid";

/* ─────────── Mock Addresses ─────────── */

interface Address {
  id: number;
  country: string;
  city: string;
  address: string;
  postalCode: string;
}

const initialAddresses: Address[] = [
  {
    id: 1,
    country: "Tunisie",
    city: "Tunis",
    address: "12 Rue de la Liberté, Les Berges du Lac",
    postalCode: "1053",
  },
  {
    id: 2,
    country: "Tunisie",
    city: "Sousse",
    address: "45 Avenue Habib Bourguiba",
    postalCode: "4000",
  },
];

/* ─────────── Overview Stats ─────────── */

const overviewStats = [
  { label: "Commandes", value: "12", icon: Package },
  { label: "Liste de Souhaits", value: "6", icon: Heart },
  { label: "Panier", value: "3", icon: ShoppingBag },
];

/* ─────────── Component ─────────── */

export default function ProfilePage() {
  const [section, setSection] = useState<ProfileSection>("overview");
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [modalKey, setModalKey] = useState(0);

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

  const deleteAddress = (id: number) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSaveAddress = useCallback(
    (form: {
      country: string;
      city: string;
      address: string;
      postalCode: string;
    }) => {
      if (editingAddress) {
        setAddresses((prev) =>
          prev.map((a) => (a.id === editingAddress.id ? { ...a, ...form } : a)),
        );
      } else {
        setAddresses((prev) => [...prev, { id: Date.now(), ...form }]);
      }
    },
    [editingAddress],
  );

  /* ─── Section renderers ─── */

  const renderOverview = () => (
    <section>
      {/* Welcome header */}
      <div className="mb-10">
        <h2 className="font-erotique text-2xl sm:text-3xl text-dark mb-2">
          Bienvenue, Amira
        </h2>
        <p className="font-poppins text-[13.5px] text-[#888] leading-relaxed">
          Gérez vos informations personnelles, vos adresses et suivez vos
          commandes.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {overviewStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-xl bg-white border border-[#EEECE7] shadow-[0_2px_12px_rgba(0,0,0,0.03)] px-6 py-5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/8 text-primary shrink-0">
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-poppins text-[22px] font-semibold text-dark leading-none mb-0.5">
                  {stat.value}
                </p>
                <p className="font-poppins text-[11.5px] text-[#999]">
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setSection("info")}
          className="cursor-pointer flex items-center gap-3 rounded-xl bg-white border border-[#EEECE7] shadow-[0_2px_12px_rgba(0,0,0,0.03)] px-6 py-5 text-left transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-primary/20"
        >
          <Pencil className="h-4 w-4 text-primary shrink-0" strokeWidth={1.5} />
          <div>
            <p className="font-poppins text-[13px] font-medium text-dark">
              Modifier le Profil
            </p>
            <p className="font-poppins text-[11.5px] text-[#999] mt-0.5">
              Mettre à jour vos informations personnelles
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setSection("orders")}
          className="cursor-pointer flex items-center gap-3 rounded-xl bg-white border border-[#EEECE7] shadow-[0_2px_12px_rgba(0,0,0,0.03)] px-6 py-5 text-left transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:border-primary/20"
        >
          <Package
            className="h-4 w-4 text-primary shrink-0"
            strokeWidth={1.5}
          />
          <div>
            <p className="font-poppins text-[13px] font-medium text-dark">
              Suivre mes Commandes
            </p>
            <p className="font-poppins text-[11.5px] text-[#999] mt-0.5">
              Voir l&apos;état de vos commandes récentes
            </p>
          </div>
        </button>
      </div>
    </section>
  );

  const renderAddresses = () => (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-erotique text-lg text-dark">Mes Adresses</h3>
        <button
          type="button"
          onClick={openAddModal}
          className="flex cursor-pointer items-center gap-2 rounded-full border border-primary px-4 py-2 font-poppins text-[12px] font-medium text-primary transition-all duration-200 hover:bg-primary hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>Ajouter</span>
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-white border border-[#EEECE7] shadow-[0_2px_12px_rgba(0,0,0,0.03)] px-5 sm:px-6 py-4 sm:py-5"
          >
            <div className="flex items-start gap-3 min-w-0">
              <MapPin
                className="h-4 w-4 text-primary shrink-0 mt-0.5"
                strokeWidth={1.5}
              />
              <div className="min-w-0">
                <p className="font-poppins text-[13.5px] text-dark leading-snug">
                  {addr.address}
                </p>
                <p className="font-poppins text-[12px] text-[#999] mt-0.5">
                  {addr.city}, {addr.postalCode} — {addr.country}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openEditModal(addr)}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E0DED9] px-3.5 py-1.5 font-poppins text-[11px] font-medium text-[#666] transition-all duration-200 hover:border-primary hover:text-primary"
                aria-label={`Modifier l'adresse ${addr.address}`}
              >
                <Pencil className="h-3 w-3" strokeWidth={1.5} />
                <span>Modifier</span>
              </button>
              <button
                type="button"
                onClick={() => deleteAddress(addr.id)}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E0DED9] px-3.5 py-1.5 font-poppins text-[11px] font-medium text-[#666] transition-all duration-200 hover:border-red-400 hover:text-red-500"
                aria-label={`Supprimer l'adresse ${addr.address}`}
              >
                <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        ))}

        {addresses.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#DDD] py-12 text-center">
            <MapPin className="h-6 w-6 text-[#CCC] mb-3" strokeWidth={1.5} />
            <p className="font-poppins text-[13px] text-[#999]">
              Aucune adresse enregistrée.
            </p>
          </div>
        )}
      </div>
    </section>
  );

  const sectionContent: Record<ProfileSection, React.ReactNode> = {
    overview: renderOverview(),
    info: <ProfileInfo />,
    addresses: renderAddresses(),
    orders: <OrdersList />,
    wishlist: <WishlistGrid />,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-12 py-12 sm:py-16 lg:py-20">
        {/* Page title */}
        <h1 className="font-erotique text-3xl sm:text-4xl text-dark mb-10 lg:mb-14">
          Mon Compte
        </h1>

        {/* Layout: sidebar + content */}
        <div className="flex gap-12">
          <ProfileSidebar active={section} onChange={setSection} />
          <div className="flex-1 min-w-0">{sectionContent[section]}</div>
        </div>
      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveAddress}
        initial={editingAddress}
        resetKey={modalKey}
      />
    </div>
  );
}
