"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { AdminCustomer } from "./CustomerTable";
import { CUSTOMER_STATUS_CONFIG } from "./CustomerTable";
import type { UserStatus } from "@/models/User";

/* ──────────────── Safe Order type (inline — from API) ──────────────── */

interface SafeOrder {
  id: string;
  ref: string;
  items: {
    product: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    size?: string;
    color?: string;
  }[];
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  status: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    phone: string;
    country: string;
    city: string;
    address: string;
    postalCode: string;
  };
  shippingMethod: string;
  paymentMethod: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/* Full detail from API */
interface CustomerDetail extends AdminCustomer {
  orders: SafeOrder[];
}

/* ──────────────── Props ──────────────── */

interface CustomerDetailModalProps {
  isOpen: boolean;
  customer: AdminCustomer | null;
  onClose: () => void;
  onUpdateStatus: (customerId: string, newStatus: UserStatus) => Promise<void>;
  saving: boolean;
}

/* ──────────────── Helpers ──────────────── */

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

const ORDER_STATUS_LABELS: Record<string, { label: string; badge: string }> = {
  pending: { label: "En attente", badge: "bg-amber-50 text-amber-600" },
  confirmed: { label: "Confirmée", badge: "bg-blue-50 text-blue-600" },
  processing: {
    label: "En traitement",
    badge: "bg-indigo-50 text-indigo-600",
  },
  shipped: { label: "Expédiée", badge: "bg-purple-50 text-purple-600" },
  delivered: { label: "Livrée", badge: "bg-emerald-50 text-emerald-600" },
  cancelled: { label: "Annulée", badge: "bg-red-50 text-red-600" },
  returned: { label: "Retournée", badge: "bg-gray-100 text-gray-600" },
};

/* ──────────────── Component ──────────────── */

export default function CustomerDetailModal({
  isOpen,
  customer,
  onClose,
  onUpdateStatus,
  saving,
}: CustomerDetailModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "addresses"
  >("overview");

  /* Fetch full detail when modal opens */
  const fetchDetail = useCallback(async (customerId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok && json.customer) {
        setDetail(json.customer);
      }
    } catch {
      /* silently fail — we still have the basic customer data */
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && customer) {
      fetchDetail(customer.id);
      setActiveTab("overview");
      scrollRef.current?.scrollTo(0, 0);
      document.body.style.overflow = "hidden";
    } else {
      setDetail(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, customer, fetchDetail]);

  /* Escape key */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!customer) return null;

  const c = detail ?? customer;
  const st = CUSTOMER_STATUS_CONFIG[c.status];
  const orders = detail?.orders ?? [];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-all duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Détails du client"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        className={`relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col transition-all duration-300 ${
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 sm:scale-95 opacity-0"
        }`}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {c.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.avatar}
                  alt={`${c.firstName} ${c.lastName}`}
                  className="w-11 h-11 rounded-full object-cover"
                />
              ) : (
                <span className="font-poppins text-sm font-bold text-primary">
                  {getInitials(c.firstName, c.lastName)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-poppins text-lg font-semibold text-dark truncate">
                {c.firstName} {c.lastName}
              </h2>
              <p className="font-poppins text-xs text-dark/40 truncate">
                {c.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-dark/40 hover:text-dark/60 hover:bg-dark/5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20 shrink-0"
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

        {/* ── Tabs ── */}
        <div className="flex border-b border-gray-100 px-5 sm:px-6 shrink-0">
          {(
            [
              { key: "overview", label: "Aperçu" },
              { key: "orders", label: `Commandes (${orders.length})` },
              { key: "addresses", label: `Adresses (${c.addresses.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 font-poppins text-sm font-medium border-b-2 transition-colors duration-150 focus:outline-none ${
                activeTab === tab.key
                  ? "text-primary border-primary"
                  : "text-dark/40 border-transparent hover:text-dark/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Scrollable content ── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 sm:px-6 py-5"
        >
          {loadingDetail && !detail && (
            <div className="flex items-center justify-center py-12">
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
          )}

          {/* ─── OVERVIEW Tab ─── */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Status + Quick Actions */}
              <div className="bg-background rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-poppins text-xs text-dark/40 mb-1">
                      Statut actuel
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 font-poppins text-sm font-medium px-3 py-1 rounded-full ${st.badge}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {(["active", "inactive", "suspended"] as UserStatus[]).map(
                      (s) => {
                        if (s === c.status) return null;
                        const cfg = CUSTOMER_STATUS_CONFIG[s];
                        return (
                          <button
                            key={s}
                            type="button"
                            disabled={saving}
                            onClick={() => onUpdateStatus(c.id, s)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-poppins text-xs font-medium border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 ${
                              s === "suspended"
                                ? "border-red-200 text-red-600 hover:bg-red-50"
                                : "border-gray-200 text-dark/60 hover:bg-white"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                            />
                            {cfg.label}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white border border-gray-100 rounded-xl p-3.5 text-center">
                  <p className="font-poppins text-2xl font-bold text-dark">
                    {c.totalOrders}
                  </p>
                  <p className="font-poppins text-xs text-dark/40 mt-0.5">
                    Commandes
                  </p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-3.5 text-center">
                  <p className="font-poppins text-2xl font-bold text-primary">
                    {c.totalSpent.toLocaleString("fr-FR", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className="font-poppins text-xs text-dark/40 mt-0.5">
                    TND Dépensé
                  </p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-3.5 text-center">
                  <p className="font-poppins text-2xl font-bold text-dark">
                    {c.addresses.length}
                  </p>
                  <p className="font-poppins text-xs text-dark/40 mt-0.5">
                    Adresses
                  </p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-3.5 text-center">
                  <p className="font-poppins text-sm font-semibold text-dark">
                    {c.isEmailVerified ? "Oui" : "Non"}
                  </p>
                  <p className="font-poppins text-xs text-dark/40 mt-0.5">
                    Email vérifié
                  </p>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow label="Email" value={c.email} />
                <InfoRow label="Téléphone" value={c.phone || "—"} />
                <InfoRow label="Inscrit le" value={formatDate(c.createdAt)} />
                <InfoRow
                  label="Dernière connexion"
                  value={c.lastLogin ? formatDate(c.lastLogin) : "Jamais"}
                />
                <InfoRow
                  label="Dernière commande"
                  value={
                    c.lastOrderDate ? formatDate(c.lastOrderDate) : "Aucune"
                  }
                />
                <InfoRow
                  label="Panier moyen"
                  value={
                    c.totalOrders > 0
                      ? `${(c.totalSpent / c.totalOrders).toLocaleString(
                          "fr-FR",
                          { minimumFractionDigits: 2 },
                        )} TND`
                      : "—"
                  }
                />
              </div>
            </div>
          )}

          {/* ─── ORDERS Tab ─── */}
          {activeTab === "orders" && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="text-center py-10">
                  <div className="mx-auto w-12 h-12 rounded-full bg-dark/5 flex items-center justify-center mb-3">
                    <svg
                      className="w-6 h-6 text-dark/30"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="font-poppins text-sm text-dark/40">
                    Aucune commande pour ce client.
                  </p>
                </div>
              ) : (
                orders.map((o) => {
                  const ostatus =
                    ORDER_STATUS_LABELS[o.status] ??
                    ORDER_STATUS_LABELS.pending;
                  const itemCount = o.items.reduce((a, i) => a + i.quantity, 0);
                  return (
                    <div
                      key={o.id}
                      className="bg-white border border-gray-100 rounded-xl p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div>
                          <p className="font-poppins text-sm font-semibold text-dark">
                            {o.ref}
                          </p>
                          <p className="font-poppins text-xs text-dark/40">
                            {formatDateShort(o.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 font-poppins text-xs font-medium px-2 py-0.5 rounded-full ${ostatus.badge}`}
                        >
                          {ostatus.label}
                        </span>
                      </div>

                      {/* Items preview */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex -space-x-2">
                          {o.items.slice(0, 3).map((item, i) => (
                            <div
                              key={i}
                              className="w-8 h-8 rounded-lg bg-dark/5 border-2 border-white shrink-0 overflow-hidden flex items-center justify-center"
                            >
                              {item.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <svg
                                  className="w-3.5 h-3.5 text-dark/20"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={1.5}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                  />
                                </svg>
                              )}
                            </div>
                          ))}
                        </div>
                        <span className="font-poppins text-xs text-dark/50">
                          {itemCount} article{itemCount > 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-3">
                          <span className="font-poppins text-xs text-dark/40">
                            {o.paymentMethod === "cod"
                              ? "Paiement à la livraison"
                              : "Carte bancaire"}
                          </span>
                          <span className="font-poppins text-xs text-dark/40">
                            •
                          </span>
                          <span className="font-poppins text-xs text-dark/40">
                            {o.shippingMethod === "express"
                              ? "Express"
                              : "Standard"}
                          </span>
                        </div>
                        <span className="font-poppins text-sm font-semibold text-dark">
                          {o.totalAmount.toFixed(2)} TND
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ─── ADDRESSES Tab ─── */}
          {activeTab === "addresses" && (
            <div className="space-y-3">
              {c.addresses.length === 0 ? (
                <div className="text-center py-10">
                  <div className="mx-auto w-12 h-12 rounded-full bg-dark/5 flex items-center justify-center mb-3">
                    <svg
                      className="w-6 h-6 text-dark/30"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <p className="font-poppins text-sm text-dark/40">
                    Aucune adresse enregistrée.
                  </p>
                </div>
              ) : (
                c.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`bg-white border rounded-xl p-4 ${
                      addr.isDefault
                        ? "border-primary/30 bg-primary/2"
                        : "border-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-dark/40"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span className="font-poppins text-sm font-medium text-dark">
                          {addr.label}
                        </span>
                      </div>
                      {addr.isDefault && (
                        <span className="font-poppins text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          Par défaut
                        </span>
                      )}
                    </div>
                    <p className="font-poppins text-sm text-dark/60">
                      {addr.address}
                    </p>
                    <p className="font-poppins text-sm text-dark/60">
                      {addr.postalCode} {addr.city}, {addr.country}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────── InfoRow sub-component ──────────────── */

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background rounded-lg p-3">
      <p className="font-poppins text-xs text-dark/40 mb-0.5">{label}</p>
      <p className="font-poppins text-sm font-medium text-dark">{value}</p>
    </div>
  );
}
