"use client";

import { Eye } from "lucide-react";

interface Order {
  id: string;
  date: string;
  status: "Livré" | "En cours" | "Annulé";
  total: string;
  items: number;
}

const mockOrders: Order[] = [
  {
    id: "KNY-20260128",
    date: "28 Janvier 2026",
    status: "Livré",
    total: "289.00 DT",
    items: 3,
  },
  {
    id: "KNY-20260115",
    date: "15 Janvier 2026",
    status: "En cours",
    total: "145.00 DT",
    items: 1,
  },
  {
    id: "KNY-20251220",
    date: "20 Décembre 2025",
    status: "Livré",
    total: "520.00 DT",
    items: 4,
  },
  {
    id: "KNY-20251205",
    date: "5 Décembre 2025",
    status: "Annulé",
    total: "89.00 DT",
    items: 1,
  },
  {
    id: "KNY-20251118",
    date: "18 Novembre 2025",
    status: "Livré",
    total: "367.00 DT",
    items: 2,
  },
];

const statusStyles: Record<Order["status"], string> = {
  Livré: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "En cours": "bg-amber-50 text-amber-700 border-amber-200",
  Annulé: "bg-red-50 text-red-600 border-red-200",
};

export default function OrdersList() {
  return (
    <section>
      <h3 className="font-erotique text-base sm:text-lg text-dark mb-4 sm:mb-6">
        Mes Commandes
      </h3>

      <div className="flex flex-col gap-2.5 sm:gap-3">
        {mockOrders.map((order) => (
          <div
            key={order.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-xl bg-white border border-[#EEECE7] shadow-[0_2px_12px_rgba(0,0,0,0.03)] px-4 sm:px-6 py-3.5 sm:py-5 transition-shadow duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
          >
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="font-poppins text-[12.5px] sm:text-[13.5px] font-medium text-dark">
                  {order.id}
                </span>
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 sm:px-2.5 font-poppins text-[9.5px] sm:text-[10.5px] font-medium ${statusStyles[order.status]}`}
                >
                  {order.status}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 font-poppins text-[11px] sm:text-[12px] text-[#999]">
                <span>{order.date}</span>
                <span className="text-[#DDD]">·</span>
                <span>
                  {order.items} article{order.items > 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6">
              <span className="font-poppins text-[13px] sm:text-[14px] font-semibold text-dark">
                {order.total}
              </span>
              <button
                type="button"
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E0DED9] px-3 py-1.5 sm:px-4 sm:py-2 font-poppins text-[10.5px] sm:text-[11.5px] font-medium text-[#666] transition-all duration-200 hover:border-primary hover:text-primary active:scale-95"
                aria-label={`Voir les détails de la commande ${order.id}`}
              >
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={1.5} />
                <span>Détails</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {mockOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
          <p className="font-poppins text-[13px] sm:text-[14px] text-[#999]">
            Aucune commande pour le moment.
          </p>
        </div>
      )}
    </section>
  );
}
