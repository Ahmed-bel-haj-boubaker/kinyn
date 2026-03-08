"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Eye, X, Loader2, Package, ChevronUp } from "lucide-react";

/* ──────────────────── Types ──────────────────── */

interface OrderItem {
  product: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  postalCode: string;
}

interface Order {
  id: string;
  ref: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  status: string;
  shippingAddress: ShippingAddress;
  shippingMethod: string;
  paymentMethod: string;
  createdAt: string;
}

/* ──────────────────── Status helpers ──────────────────── */

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ──────────────────── Component ──────────────────── */

export default function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  /* ── Fetch orders ── */
  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) throw new Error("Erreur de chargement");
        const data = await res.json();
        setOrders(data.orders ?? []);
      } catch {
        setError("Impossible de charger vos commandes.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  /* ── Cancel order ── */
  const handleCancel = async (orderId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette commande ?")) return;

    setCancellingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Impossible d'annuler la commande.");
        return;
      }
      const data = await res.json();
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: data.order.status } : o,
        ),
      );
    } catch {
      alert("Erreur de connexion.");
    } finally {
      setCancellingId(null);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <section>
        <h3 className="font-erotique text-base sm:text-lg text-dark mb-4 sm:mb-6">
          Mes Commandes
        </h3>
        <div className="flex items-center justify-center py-12">
          <Loader2
            className="h-6 w-6 animate-spin text-dark/30"
            strokeWidth={1.5}
          />
        </div>
      </section>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <section>
        <h3 className="font-erotique text-base sm:text-lg text-dark mb-4 sm:mb-6">
          Mes Commandes
        </h3>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center">
          <p className="font-poppins text-sm text-red-600">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h3 className="font-erotique text-base sm:text-lg text-dark mb-4 sm:mb-6">
        Mes Commandes
      </h3>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
          <Package className="h-10 w-10 text-dark/20 mb-3" strokeWidth={1.2} />
          <p className="font-poppins text-[13px] sm:text-[14px] text-[#999]">
            Aucune commande pour le moment.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 sm:gap-3">
          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const totalItems = order.items.reduce(
              (sum, i) => sum + i.quantity,
              0,
            );
            const canCancel = ["pending", "confirmed"].includes(order.status);

            return (
              <div
                key={order.id}
                className="rounded-xl bg-white border border-[#EEECE7] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden transition-shadow duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
              >
                {/* Summary row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-5">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <span className="font-poppins text-[12.5px] sm:text-[13.5px] font-medium text-dark">
                        {order.ref}
                      </span>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 sm:px-2.5 font-poppins text-[9.5px] sm:text-[10.5px] font-medium ${
                          statusStyles[order.status] ?? statusStyles.pending
                        }`}
                      >
                        {statusLabels[order.status] ?? order.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 font-poppins text-[11px] sm:text-[12px] text-[#999]">
                      <span>{formatDate(order.createdAt)}</span>
                      <span className="text-[#DDD]">·</span>
                      <span>
                        {totalItems} article{totalItems > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6">
                    <span className="font-poppins text-[13px] sm:text-[14px] font-semibold text-dark">
                      {order.totalAmount.toFixed(2).replace(".", ",")} TND
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : order.id)
                      }
                      className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E0DED9] px-3 py-1.5 sm:px-4 sm:py-2 font-poppins text-[10.5px] sm:text-[11.5px] font-medium text-[#666] transition-all duration-200 hover:border-primary hover:text-primary active:scale-95"
                      aria-label={`Voir les détails de la commande ${order.ref}`}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp
                            className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                            strokeWidth={1.5}
                          />
                          <span>Fermer</span>
                        </>
                      ) : (
                        <>
                          <Eye
                            className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                            strokeWidth={1.5}
                          />
                          <span>Détails</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-[#EEECE7] px-4 sm:px-6 py-4 sm:py-6 bg-[#FAFAF8]">
                    {/* Items */}
                    <div className="space-y-3 mb-5">
                      {order.items.map((item, idx) => {
                        const variant = [item.color, item.size]
                          .filter(Boolean)
                          .join(" — ");
                        return (
                          <div key={idx} className="flex gap-3 items-center">
                            <div className="relative w-14 h-14 shrink-0 rounded-lg bg-gray-100 overflow-hidden">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  sizes="56px"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package
                                    className="h-5 w-5 text-gray-300"
                                    strokeWidth={1.2}
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-poppins text-xs font-semibold text-dark truncate">
                                {item.name}
                              </p>
                              {variant && (
                                <p className="font-poppins text-[10px] text-gray-400">
                                  {variant}
                                </p>
                              )}
                              <p className="font-poppins text-[10px] text-gray-400">
                                Qté : {item.quantity}
                              </p>
                            </div>
                            <span className="font-poppins text-xs font-medium text-dark shrink-0">
                              {(item.price * item.quantity)
                                .toFixed(2)
                                .replace(".", ",")}{" "}
                              TND
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pricing breakdown */}
                    <div className="border-t border-[#EEECE7] pt-3 space-y-1.5 mb-4">
                      <div className="flex justify-between font-poppins text-[11px]">
                        <span className="text-gray-400">Sous-total</span>
                        <span className="text-dark">
                          {order.subtotal.toFixed(2).replace(".", ",")} TND
                        </span>
                      </div>
                      <div className="flex justify-between font-poppins text-[11px]">
                        <span className="text-gray-400">Livraison</span>
                        <span className="text-dark">
                          {order.shippingCost.toFixed(2).replace(".", ",")} TND
                        </span>
                      </div>
                      <div className="flex justify-between font-poppins text-xs font-semibold pt-1.5 border-t border-[#EEECE7]">
                        <span className="text-dark">Total</span>
                        <span className="text-dark">
                          {order.totalAmount.toFixed(2).replace(".", ",")} TND
                        </span>
                      </div>
                    </div>

                    {/* Shipping info */}
                    <div className="border-t border-[#EEECE7] pt-3 mb-4">
                      <p className="font-poppins text-[10.5px] font-semibold text-dark mb-1.5">
                        Adresse de livraison
                      </p>
                      <p className="font-poppins text-[11px] text-gray-500 leading-relaxed">
                        {order.shippingAddress.firstName}{" "}
                        {order.shippingAddress.lastName}
                        <br />
                        {order.shippingAddress.address}
                        <br />
                        {order.shippingAddress.postalCode}{" "}
                        {order.shippingAddress.city},{" "}
                        {order.shippingAddress.country}
                        <br />
                        Tél : {order.shippingAddress.phone}
                      </p>
                    </div>

                    {/* Methods */}
                    <div className="flex flex-wrap gap-3 text-[10.5px] font-poppins text-gray-400">
                      <span>
                        Livraison :{" "}
                        {order.shippingMethod === "express"
                          ? "Express"
                          : "Standard"}
                      </span>
                      <span className="text-[#DDD]">·</span>
                      <span>
                        Paiement :{" "}
                        {order.paymentMethod === "card"
                          ? "Carte bancaire"
                          : "À la livraison"}
                      </span>
                    </div>

                    {/* Cancel button */}
                    {canCancel && (
                      <div className="mt-4 pt-3 border-t border-[#EEECE7]">
                        <button
                          type="button"
                          onClick={() => handleCancel(order.id)}
                          disabled={cancellingId === order.id}
                          className="flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-2 font-poppins text-[11px] font-medium text-red-500 transition-all duration-200 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 active:scale-95"
                        >
                          {cancellingId === order.id ? (
                            <Loader2
                              className="h-3 w-3 animate-spin"
                              strokeWidth={2}
                            />
                          ) : (
                            <X className="h-3 w-3" strokeWidth={2} />
                          )}
                          Annuler la commande
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
