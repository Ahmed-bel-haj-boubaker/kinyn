"use client";

import Image from "next/image";

export type AdminRole = "super_admin" | "admin" | "moderator";
export type AdminStatus = "active" | "inactive";

export interface Admin {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: AdminRole;
  status: AdminStatus;
  avatar: string;
  createdAt: string;
  lastLogin: string;
}

interface AdminsTableProps {
  admins: Admin[];
  onEdit: (admin: Admin) => void;
  onDelete: (admin: Admin) => void;
}

const ROLE_CONFIG: Record<AdminRole, { label: string; badge: string }> = {
  super_admin: {
    label: "Super Admin",
    badge: "bg-purple-50 text-purple-600",
  },
  admin: {
    label: "Admin",
    badge: "bg-blue-50 text-blue-600",
  },
  moderator: {
    label: "Modérateur",
    badge: "bg-amber-50 text-amber-600",
  },
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

export default function AdminsTable({
  admins,
  onEdit,
  onDelete,
}: AdminsTableProps) {
  if (admins.length === 0) {
    return (
      <div className="hidden md:block bg-white rounded-2xl shadow-sm p-12 text-center">
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
    <div className="hidden md:block bg-white rounded-2xl shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
              Administrateur
            </th>
            <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-4 py-4">
              Rôle
            </th>
            <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-4 py-4">
              Statut
            </th>
            <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-4 py-4">
              Créé le
            </th>
            <th className="text-left font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-4 py-4">
              Dernière connexion
            </th>
            <th className="text-right font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider px-6 py-4">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {admins.map((a) => {
            const role = ROLE_CONFIG[a.role];
            const st = STATUS_CONFIG[a.status];
            return (
              <tr
                key={a.id}
                className="border-b border-gray-50 last:border-0 hover:bg-background/60 transition-colors duration-150"
              >
                {/* Admin Info */}
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 shrink-0 flex items-center justify-center overflow-hidden">
                      {a.avatar ? (
                        <Image
                          src={a.avatar}
                          alt={`${a.firstName} ${a.lastName}`}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-poppins text-xs font-bold text-primary">
                          {getInitials(a.firstName, a.lastName)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-poppins text-sm font-medium text-dark truncate max-w-48">
                        {a.firstName} {a.lastName}
                      </p>
                      <p className="font-poppins text-xs text-dark/40 truncate max-w-48">
                        {a.email}
                      </p>
                    </div>
                  </div>
                </td>
                {/* Role */}
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center font-poppins text-xs font-medium px-2.5 py-1 rounded-full ${role.badge}`}
                  >
                    {role.label}
                  </span>
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
                {/* Created At */}
                <td className="px-4 py-3.5">
                  <span className="font-poppins text-sm text-dark/60">
                    {formatDate(a.createdAt)}
                  </span>
                </td>
                {/* Last Login */}
                <td className="px-4 py-3.5">
                  <span className="font-poppins text-sm text-dark/60">
                    {formatDate(a.lastLogin)}
                  </span>
                </td>
                {/* Actions */}
                <td className="px-6 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(a)}
                      className="p-2 rounded-lg text-dark/40 hover:text-primary hover:bg-primary/5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label={`Modifier ${a.firstName} ${a.lastName}`}
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
                      onClick={() => onDelete(a)}
                      className="p-2 rounded-lg text-dark/40 hover:text-primary hover:bg-primary/5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label={`Supprimer ${a.firstName} ${a.lastName}`}
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
