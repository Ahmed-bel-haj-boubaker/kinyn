"use client";

import type { Product, ProductStatus } from "./ProductTable";

interface ProductCardProps {
  products: Product[];
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onView: (product: Product) => void;
}

const STATUS_CONFIG: Record<
  ProductStatus,
  { label: string; dot: string; badge: string }
> = {
  active: {
    label: "Actif",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-600",
  },
  draft: {
    label: "Brouillon",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-600",
  },
  outofstock: {
    label: "Rupture",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-600",
  },
};

export default function ProductCard({
  products,
  onEdit,
  onDelete,
  onView,
}: ProductCardProps) {
  if (products.length === 0) {
    return (
      <div className="md:hidden bg-white rounded-2xl shadow-sm p-10 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-dark/5 flex items-center justify-center mb-3">
          <svg
            className="w-7 h-7 text-dark/30"
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
        </div>
        <p className="font-poppins text-dark/50 text-sm">
          Aucun produit trouvé.
        </p>
      </div>
    );
  }

  return (
    <div className="md:hidden flex flex-col gap-3">
      {products.map((p) => {
        const st = STATUS_CONFIG[p.status];
        return (
          <div
            key={p.id}
            className="bg-white rounded-2xl shadow-sm p-4 border border-gray-50"
          >
            {/* Header row */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-14 h-14 rounded-xl bg-dark/5 shrink-0 flex items-center justify-center overflow-hidden">
                {p.images[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.images[0].url}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    className="w-6 h-6 text-dark/20"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-poppins text-sm font-semibold text-dark truncate">
                  {p.name}
                </p>
                <p className="font-poppins text-xs text-dark/40 mt-0.5">
                  {p.sku}
                </p>
                <span
                  className={`inline-flex items-center gap-1.5 font-poppins text-xs font-medium px-2 py-0.5 rounded-full mt-1.5 ${st.badge}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                  {st.label}
                </span>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3 border-t border-gray-50 pt-3">
              <div>
                <p className="font-poppins text-xs text-dark/40">Catégorie</p>
                <p className="font-poppins text-sm text-dark/70 mt-0.5">
                  {p.categoryMereName}
                  {p.categorySousName && (
                    <span className="text-dark/40">
                      {" "}
                      / {p.categorySousName}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="font-poppins text-xs text-dark/40">Prix</p>
                <p className="font-poppins text-sm font-medium text-dark mt-0.5">
                  {p.promoPrice ? (
                    <>
                      <span className="text-primary">{p.promoPrice}TND</span>
                      <span className="ml-1 text-xs text-dark/30 line-through">
                        {p.price}TND
                      </span>
                    </>
                  ) : (
                    <span>{p.price}TND</span>
                  )}
                </p>
              </div>
              <div>
                <p className="font-poppins text-xs text-dark/40">Stock</p>
                <p
                  className={`font-poppins text-sm font-medium mt-0.5 ${p.stock === 0 ? "text-red-500" : p.stock < 5 ? "text-amber-500" : "text-dark"}`}
                >
                  {p.stock}
                  {p.stock === 0 ? (
                    <span className="ml-1 text-[10px] text-red-500">
                      Hors stock
                    </span>
                  ) : p.stock < 5 ? (
                    <span className="ml-1 text-[10px] text-amber-500">
                      Stock faible
                    </span>
                  ) : null}
                </p>
              </div>
              {p.sizes.length > 0 && (
                <div>
                  <p className="font-poppins text-xs text-dark/40">Tailles</p>
                  <p className="font-poppins text-xs text-dark/60 mt-0.5">
                    {p.sizes.join(", ")}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 border-t border-gray-50 pt-3">
              <button
                type="button"
                onClick={() => onView(p)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-dark/5 text-dark/60 hover:bg-dark/10 font-poppins text-xs font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                Voir
              </button>
              <button
                type="button"
                onClick={() => onEdit?.(p)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-dark/5 text-dark/60 hover:bg-dark/10 font-poppins text-xs font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Modifier
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(p)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/5 text-primary/70 hover:bg-primary/10 font-poppins text-xs font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Supprimer
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
