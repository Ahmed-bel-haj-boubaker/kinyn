/* eslint-disable @next/next/no-img-element */
"use client";

export type CollectionStatus = "active" | "hidden";

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  products: string[];
  productCount: number;
  status: CollectionStatus;
  order: number;
}

interface CollectionTableProps {
  collections: Collection[];
  onEdit?: (collection: Collection) => void;
  onDelete?: (collection: Collection) => void;
}

export default function CollectionTable({
  collections,
  onEdit,
  onDelete,
}: CollectionTableProps) {
  if (collections.length === 0) {
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <p className="font-poppins text-dark/50 text-sm">
          Aucune collection pour le moment.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
                Collection
              </th>
              <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
                Produits
              </th>
              <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
                Statut
              </th>
              <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
                Ordre
              </th>
              <th className="text-right font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {collections.map((col) => (
              <tr
                key={col.id}
                className="border-b border-gray-50 last:border-0 hover:bg-background/60 transition-colors duration-150"
              >
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    {col.image ? (
                      <img
                        src={col.image}
                        alt={col.name}
                        className="w-10 h-10 rounded-lg object-cover bg-dark/5"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-dark/5 flex items-center justify-center">
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
                      </div>
                    )}
                    <div>
                      <span className="font-poppins text-sm font-medium text-dark">
                        {col.name}
                      </span>
                      {col.description && (
                        <p className="font-poppins text-xs text-dark/40 mt-0.5 line-clamp-1 max-w-[300px]">
                          {col.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3.5">
                  <span className="inline-block font-poppins text-xs font-medium px-2.5 py-1 rounded-full bg-dark/5 text-dark/60">
                    {col.productCount} produit
                    {col.productCount !== 1 ? "s" : ""}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 font-poppins text-xs font-medium px-2.5 py-1 rounded-full ${
                      col.status === "active"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-gray-100 text-dark/40"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        col.status === "active"
                          ? "bg-emerald-500"
                          : "bg-dark/30"
                      }`}
                    />
                    {col.status === "active" ? "Active" : "Masquée"}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <span className="font-poppins text-sm text-dark/50">
                    {col.order}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit?.(col)}
                      className="p-2 rounded-lg text-dark/40 hover:text-primary hover:bg-primary/5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label={`Modifier ${col.name}`}
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
                      onClick={() => onDelete?.(col)}
                      className="p-2 rounded-lg text-dark/40 hover:text-primary hover:bg-primary/5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label={`Supprimer ${col.name}`}
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
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {collections.map((col) => (
          <div key={col.id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {col.image ? (
                  <img
                    src={col.image}
                    alt={col.name}
                    className="w-10 h-10 rounded-lg object-cover bg-dark/5"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-dark/5 flex items-center justify-center">
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
                  </div>
                )}
                <div>
                  <h3 className="font-poppins text-sm font-semibold text-dark">
                    {col.name}
                  </h3>
                  <span className="font-poppins text-xs text-dark/40">
                    {col.productCount} produit
                    {col.productCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 font-poppins text-xs font-medium px-2 py-0.5 rounded-full ${
                  col.status === "active"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-gray-100 text-dark/40"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    col.status === "active" ? "bg-emerald-500" : "bg-dark/30"
                  }`}
                />
                {col.status === "active" ? "Active" : "Masquée"}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => onEdit?.(col)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-poppins text-xs font-medium text-dark/60 hover:text-primary hover:bg-primary/5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label={`Modifier ${col.name}`}
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
                onClick={() => onDelete?.(col)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-poppins text-xs font-medium text-dark/60 hover:text-primary hover:bg-primary/5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label={`Supprimer ${col.name}`}
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
        ))}
      </div>
    </>
  );
}
