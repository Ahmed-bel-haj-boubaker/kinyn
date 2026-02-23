"use client";

import Image from "next/image";
import type { Admin, AdminStatus } from "./AdminsTable";

interface AdminCardProps {
  admins: Admin[];
  onEdit: (admin: Admin) => void;
  onDelete: (admin: Admin) => void;
}

const ROLE_CONFIG = {
  super_admin: { label: "Super Admin", badge: "bg-purple-50 text-purple-600" },
  admin: { label: "Admin", badge: "bg-blue-50 text-blue-600" },
  moderator: { label: "Modérateur", badge: "bg-amber-50 text-amber-600" },
};

const STATUS_CONFIG: Record<
  AdminStatus,
  { label: string; dot: string; badge: string }
> = {
  active: {
    label: "Actif",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-600",
  },
  inactive: {
    label: "Inactif",
    dot: "bg-gray-400",
    badge: "bg-gray-100 text-gray-500",
  },
};

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminCard({
  admins,
  onEdit,
  onDelete,
}: AdminCardProps) {
  if (admins.length === 0) {
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <p className="font-poppins text-dark/50 text-sm">
          Aucun administrateur trouvé.
        </p>
      </div>
    );
  }

  return (
    <div className="md:hidden flex flex-col gap-3">
      {admins.map((a) => {
        const role = ROLE_CONFIG[a.role];
        const st = STATUS_CONFIG[a.status];
        return (
          <div
            key={a.id}
            className="bg-white rounded-2xl shadow-sm p-4 border border-gray-50"
          >
            {/* Header row */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 shrink-0 flex items-center justify-center overflow-hidden">
                {a.avatar ? (
                  <Image
                    src={a.avatar}
                    alt={`${a.firstName} ${a.lastName}`}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-poppins text-sm font-bold text-primary">
                    {getInitials(a.firstName, a.lastName)}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-poppins text-sm font-semibold text-dark truncate">
                  {a.firstName} {a.lastName}
                </p>
                <p className="font-poppins text-xs text-dark/40 mt-0.5 truncate">
                  {a.email}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className={`inline-flex items-center font-poppins text-xs font-medium px-2 py-0.5 rounded-full ${role.badge}`}
                  >
                    {role.label}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 font-poppins text-xs font-medium px-2 py-0.5 rounded-full ${st.badge}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    {st.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3 border-t border-gray-50 pt-3">
              <div>
                <p className="font-poppins text-xs text-dark/40">Téléphone</p>
                <p className="font-poppins text-sm text-dark/70 mt-0.5">
                  {a.phone || "—"}
                </p>
              </div>
              <div>
                <p className="font-poppins text-xs text-dark/40">Créé le</p>
                <p className="font-poppins text-sm text-dark/70 mt-0.5">
                  {formatDate(a.createdAt)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="font-poppins text-xs text-dark/40">
                  Dernière connexion
                </p>
                <p className="font-poppins text-sm text-dark/70 mt-0.5">
                  {formatDate(a.lastLogin)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 border-t border-gray-50 pt-3">
              <button
                type="button"
                onClick={() => onEdit(a)}
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
                onClick={() => onDelete(a)}
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
