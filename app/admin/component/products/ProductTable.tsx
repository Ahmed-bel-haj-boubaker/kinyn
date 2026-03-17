"use client";

export type ProductStatus = "active" | "draft" | "outofstock";

export interface ProductImage {
  url: string;
  color: string;
  colorHex: string;
}

export interface ProductSizeStock {
  size: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  categoryMere: string;
  categoryMereName: string;
  categorySous: string | null;
  categorySousName: string | null;
  categoryFinale: string | null;
  categoryFinaleName: string | null;
  price: number;
  promoPrice?: number;
  sizeStock: ProductSizeStock[];
  stock: number;
  status: ProductStatus;
  images: ProductImage[];
  sizes: string[];
  colors: string[];
}

interface ProductTableProps {
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

export default function ProductTable({
  products,
  onEdit,
  onDelete,
  onView,
}: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-dark/5 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-dark/30"
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
    <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
              Produit
            </th>
            <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-4 py-4">
              Catégorie
            </th>
            <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-4 py-4">
              Prix
            </th>
            <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-4 py-4">
              Stock
            </th>
            <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-4 py-4">
              Statut
            </th>
            <th className="text-right font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const st = STATUS_CONFIG[p.status];
            return (
              <tr
                key={p.id}
                className="border-b border-gray-50 last:border-0 hover:bg-background/60 transition-colors duration-150"
              >
                {/* Product */}
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-dark/5 shrink-0 flex items-center justify-center overflow-hidden">
                      {p.images[0]?.url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={p.images[0].url}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg
                          className="w-5 h-5 text-dark/20"
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
                    <div className="min-w-0">
                      <p className="font-poppins text-sm font-medium text-dark truncate max-w-48">
                        {p.name}
                      </p>
                      <p className="font-poppins text-xs text-dark/40">
                        {p.sku}
                      </p>
                    </div>
                  </div>
                </td>
                {/* Category */}
                <td className="px-4 py-3.5">
                  <div className="font-poppins text-sm text-dark/70">
                    <span>{p.categoryMereName}</span>
                    {p.categorySousName && (
                      <span className="text-dark/30">
                        {" "}
                        / {p.categorySousName}
                      </span>
                    )}
                  </div>
                  {p.categoryFinaleName && (
                    <p className="font-poppins text-xs text-dark/40 mt-0.5">
                      {p.categoryFinaleName}
                    </p>
                  )}
                </td>
                {/* Price */}
                <td className="px-4 py-3.5">
                  <div className="font-poppins text-sm font-medium text-dark">
                    {p.promoPrice ? (
                      <>
                        <span className="text-primary">{p.promoPrice} TND</span>
                        <span className="ml-1.5 text-xs text-dark/30 line-through">
                          {p.price} TND
                        </span>
                      </>
                    ) : (
                      <span>{p.price} TND</span>
                    )}
                  </div>
                </td>
                {/* Stock */}
                <td className="px-4 py-3.5">
                  <div className="flex flex-col">
                    <span
                      className={`font-poppins text-sm font-medium ${p.stock === 0 ? "text-red-500" : p.stock < 5 ? "text-amber-500" : "text-dark"}`}
                    >
                      {p.stock}
                    </span>
                    {p.stock === 0 ? (
                      <span className="font-poppins text-[10px] font-medium text-red-500">
                        Hors stock
                      </span>
                    ) : p.stock < 5 ? (
                      <span className="font-poppins text-[10px] font-medium text-amber-500">
                        Stock faible
                      </span>
                    ) : null}
                  </div>
                </td>
                {/* Status */}
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 font-poppins text-xs font-medium px-2.5 py-1 rounded-full ${st.badge}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                </td>
                {/* Actions */}
                <td className="px-6 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onView(p)}
                      className="p-2 rounded-lg text-dark/40 hover:text-primary hover:bg-primary/5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label={`Voir ${p.name}`}
                    >
                      <svg
                        className="w-4 h-4"
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
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit?.(p)}
                      className="p-2 rounded-lg text-dark/40 hover:text-primary hover:bg-primary/5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label={`Modifier ${p.name}`}
                    >
                      <svg
                        className="w-4 h-4"
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
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete?.(p)}
                      className="p-2 rounded-lg text-dark/40 hover:text-primary hover:bg-primary/5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label={`Supprimer ${p.name}`}
                    >
                      <svg
                        className="w-4 h-4"
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
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
