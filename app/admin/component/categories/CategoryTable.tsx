"use client";

import type { CategoryLevel, CategoryStatus } from "./CategoryModal";

export interface Category {
  id: string;
  name: string;
  slug: string;
  level: CategoryLevel;
  parent: string | null;
  parentName: string;
  status: CategoryStatus;
  order: number;
}

interface CategoryTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

const LEVEL_LABELS: Record<CategoryLevel, string> = {
  mere: "Mère",
  sous: "Sous",
  finale: "Finale",
};

const LEVEL_COLORS: Record<CategoryLevel, string> = {
  mere: "bg-dark/10 text-dark",
  sous: "bg-primary/10 text-primary",
  finale: "bg-amber-100 text-amber-700",
};

function getIndent(level: CategoryLevel): string {
  if (level === "sous") return "pl-6 sm:pl-8";
  if (level === "finale") return "pl-12 sm:pl-14";
  return "";
}

export default function CategoryTable({
  categories,
  onEdit,
  onDelete,
}: CategoryTableProps) {
  if (categories.length === 0) {
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
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
        </div>
        <p className="font-poppins text-dark/50 text-sm">
          Aucune catégorie pour le moment.
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
                Catégorie
              </th>
              <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
                Niveau
              </th>
              <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
                Parent
              </th>
              <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
                Statut
              </th>
              <th className="text-right font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr
                key={cat.id}
                className="border-b border-gray-50 last:border-0 hover:bg-background/60 transition-colors duration-150"
              >
                <td className={`px-6 py-3.5 ${getIndent(cat.level)}`}>
                  <div className="flex items-center gap-2">
                    {cat.level !== "mere" && (
                      <span className="text-dark/20">
                        {cat.level === "sous" ? "├─" : "└──"}
                      </span>
                    )}
                    <span className="font-poppins text-sm font-medium text-dark">
                      {cat.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-3.5">
                  <span
                    className={`inline-block font-poppins text-xs font-medium px-2.5 py-1 rounded-full ${LEVEL_COLORS[cat.level]}`}
                  >
                    {LEVEL_LABELS[cat.level]}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <span className="font-poppins text-sm text-dark/50">
                    {cat.parentName || "—"}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1.5 font-poppins text-xs font-medium px-2.5 py-1 rounded-full ${
                      cat.status === "active"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-gray-100 text-dark/40"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        cat.status === "active"
                          ? "bg-emerald-500"
                          : "bg-dark/30"
                      }`}
                    />
                    {cat.status === "active" ? "Active" : "Masquée"}
                  </span>
                </td>
                <td className="px-6 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(cat)}
                      className="p-2 rounded-lg text-dark/40 hover:text-primary hover:bg-primary/5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label={`Modifier ${cat.name}`}
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
                      onClick={() => onDelete(cat)}
                      className="p-2 rounded-lg text-dark/40 hover:text-primary hover:bg-primary/5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label={`Supprimer ${cat.name}`}
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
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={`bg-white rounded-xl shadow-sm p-4 ${
              cat.level === "sous"
                ? "ml-4"
                : cat.level === "finale"
                  ? "ml-8"
                  : ""
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {cat.level !== "mere" && (
                  <span className="text-dark/20 text-sm">
                    {cat.level === "sous" ? "├" : "└"}
                  </span>
                )}
                <h3 className="font-poppins text-sm font-semibold text-dark">
                  {cat.name}
                </h3>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 font-poppins text-xs font-medium px-2 py-0.5 rounded-full ${
                  cat.status === "active"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-gray-100 text-dark/40"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    cat.status === "active" ? "bg-emerald-500" : "bg-dark/30"
                  }`}
                />
                {cat.status === "active" ? "Active" : "Masquée"}
              </span>
            </div>

            <div className="flex items-center gap-4 mb-3">
              <span
                className={`inline-block font-poppins text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[cat.level]}`}
              >
                {LEVEL_LABELS[cat.level]}
              </span>
              {cat.parentName && (
                <span className="font-poppins text-xs text-dark/40">
                  Parent : {cat.parentName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => onEdit(cat)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-poppins text-xs font-medium text-dark/60 hover:text-primary hover:bg-primary/5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label={`Modifier ${cat.name}`}
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
                onClick={() => onDelete(cat)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-poppins text-xs font-medium text-dark/60 hover:text-primary hover:bg-primary/5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
                aria-label={`Supprimer ${cat.name}`}
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
