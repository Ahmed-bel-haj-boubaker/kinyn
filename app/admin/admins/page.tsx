"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import AdminsTable from "../component/admins/AdminsTable";
import AdminCard from "../component/admins/AdminCard";
import AdminModal from "../component/admins/AdminModal";
import DeleteAdminModal from "../component/admins/DeleteAdminModal";
import Toast from "../component/shared/Toast";
import { useToast } from "../hooks/useToast";
import { useAdminAuth } from "../context/AdminAuthContext";
import type {
  Admin,
  AdminRole,
  AdminStatus,
} from "../component/admins/AdminsTable";

/* ------------------------------------------------------------------ */
/*  Filter Types                                                       */
/* ------------------------------------------------------------------ */

type FilterRole = "all" | AdminRole;
type FilterStatus = "all" | AdminStatus;

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function AdminsPage() {
  const { isSuperAdmin, loading: authLoading } = useAdminAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);
  const [, setSaving] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  /* Stats from API */
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    superAdmin: 0,
  });

  /* Filters */
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<FilterRole>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  /* ── Fetch admins from API ── */
  const fetchAdmins = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (filterRole !== "all") params.set("role", filterRole);
      if (filterStatus !== "all") params.set("status", filterStatus);

      const res = await fetch(`/api/admin/admins?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          addToast("error", "Session expirée ou accès refusé.");
          return;
        }
        throw new Error("Erreur serveur");
      }

      const data = await res.json();

      /* Map API response to Admin type */
      const mapped: Admin[] = (data.admins ?? []).map(
        (a: Record<string, unknown>) => ({
          id: a.id as string,
          firstName: a.firstName as string,
          lastName: a.lastName as string,
          email: a.email as string,
          phone: (a.phone as string) ?? "",
          role: a.role as AdminRole,
          status: a.status as AdminStatus,
          avatar: (a.avatar as string) ?? "",
          createdAt: a.createdAt as string,
          lastLogin: (a.lastLogin as string) ?? "",
        }),
      );

      setAdmins(mapped);

      if (data.stats) {
        setStats(data.stats);
      }
    } catch {
      addToast("error", "Impossible de charger les administrateurs.");
    } finally {
      setLoadingData(false);
    }
  }, [search, filterRole, filterStatus, addToast]);

  /* Initial load + refetch on filter change */
  useEffect(() => {
    setLoadingData(true);
    const timer = setTimeout(() => {
      fetchAdmins();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchAdmins]);

  /* Filtered admins — client-side in case API search isn't enough */
  const filtered = useMemo(() => admins, [admins]);

  /* Stats */
  const totalCount = stats.total;
  const activeCount = stats.active;
  const inactiveCount = stats.inactive;
  const superAdminCount = stats.superAdmin;

  /* Handlers */
  const handleCreate = useCallback(() => {
    setEditingAdmin(null);
    setModalMode("create");
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((admin: Admin) => {
    setEditingAdmin(admin);
    setModalMode("edit");
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback((admin: Admin) => {
    setDeleteTarget(admin);
  }, []);

  const handleModalSave = useCallback(
    async (data: Omit<Admin, "id"> & { id?: string; password?: string }) => {
      setSaving(true);
      try {
        if (modalMode === "create") {
          const res = await fetch("/api/admin/admins", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firstName: data.firstName,
              lastName: data.lastName,
              email: data.email,
              phone: data.phone,
              password: (data as Record<string, unknown>).password ?? "",
              role: data.role,
              status: data.status,
              avatar: data.avatar,
            }),
          });

          const result = await res.json();

          if (!res.ok) {
            addToast("error", result.error ?? "Erreur lors de la création.");
            return;
          }

          addToast(
            "success",
            `Administrateur "${data.firstName} ${data.lastName}" créé avec succès`,
          );
        } else if (editingAdmin) {
          const body: Record<string, unknown> = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            role: data.role,
            status: data.status,
            avatar: data.avatar,
          };

          /* Only include password if it was provided */
          const pwd = (data as Record<string, unknown>).password;
          if (pwd) body.password = pwd;

          const res = await fetch(`/api/admin/admins/${editingAdmin.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          const result = await res.json();

          if (!res.ok) {
            addToast(
              "error",
              result.error ?? "Erreur lors de la modification.",
            );
            return;
          }

          addToast(
            "success",
            `Administrateur "${data.firstName} ${data.lastName}" modifié avec succès`,
          );
        }

        setModalOpen(false);
        setEditingAdmin(null);

        /* Refresh list */
        fetchAdmins();
      } catch {
        addToast("error", "Erreur de connexion au serveur.");
      } finally {
        setSaving(false);
      }
    },
    [modalMode, editingAdmin, addToast, fetchAdmins],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/admins/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        addToast("error", result.error ?? "Erreur lors de la suppression.");
        return;
      }

      addToast(
        "success",
        `Administrateur "${deleteTarget.firstName} ${deleteTarget.lastName}" supprimé`,
      );
      setDeleteTarget(null);

      /* Refresh list */
      fetchAdmins();
    } catch {
      addToast("error", "Erreur de connexion au serveur.");
    } finally {
      setSaving(false);
    }
  }, [deleteTarget, addToast, fetchAdmins]);

  const resetFilters = () => {
    setSearch("");
    setFilterRole("all");
    setFilterStatus("all");
  };

  const hasActiveFilters =
    search || filterRole !== "all" || filterStatus !== "all";

  const selectClass =
    "px-3 py-2 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200 appearance-none bg-no-repeat bg-position-[right_0.75rem_center] bg-size-[1rem] bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2317171a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E\")] pr-9";

  /* ── Access denied for non-super_admin ── */
  if (!authLoading && !isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <svg
          className="w-16 h-16 text-dark/20 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <h2 className="font-erotique text-2xl text-dark mb-2">Accès restreint</h2>
        <p className="font-poppins text-sm text-dark/50">
          Seul un Super Admin peut accéder à la gestion des administrateurs.
        </p>
      </div>
    );
  }

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-erotique text-3xl sm:text-4xl text-dark">
            Administrateurs
          </h1>
          <p className="font-poppins text-sm text-dark/50 mt-1">
            Gérez les comptes administrateurs et leurs permissions d&apos;accès.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-poppins text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 shrink-0 self-start sm:self-auto"
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
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          Ajouter un admin
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Total
          </p>
          <p className="font-poppins text-2xl font-bold text-dark">
            {totalCount}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Actifs
          </p>
          <p className="font-poppins text-2xl font-bold text-emerald-600">
            {activeCount}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Inactifs
          </p>
          <p className="font-poppins text-2xl font-bold text-gray-400">
            {inactiveCount}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Super Admins
          </p>
          <p className="font-poppins text-2xl font-bold text-purple-600">
            {superAdminCount}
          </p>
        </div>
      </div>

      {/* Filters — Desktop */}
      <div className="hidden md:flex items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un administrateur…"
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200"
          />
        </div>

        {/* Role filter */}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as FilterRole)}
          className={selectClass}
        >
          <option value="all">Tous les rôles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="moderator">Modérateur</option>
        </select>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className={selectClass}
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
        </select>

        {/* Reset */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-dark/40 hover:text-dark/60 hover:bg-dark/5 font-poppins text-sm transition-colors duration-150 focus:outline-none"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Réinitialiser
          </button>
        )}

        {/* Count badge */}
        <span className="ml-auto font-poppins text-xs text-dark/40">
          {filtered.length} administrateur{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Filters — Mobile */}
      <div className="md:hidden mb-6 space-y-3">
        {/* Search + toggle */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200"
            />
          </div>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className={`p-2 rounded-xl border transition-colors duration-150 focus:outline-none ${
              mobileFiltersOpen || hasActiveFilters
                ? "border-primary/30 bg-primary/5 text-primary"
                : "border-gray-200 bg-white text-dark/40"
            }`}
            aria-label="Filtres"
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
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </button>
        </div>

        {/* Collapsible filters */}
        {mobileFiltersOpen && (
          <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-50">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as FilterRole)}
              className={selectClass + " w-full"}
            >
              <option value="all">Tous les rôles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="moderator">Modérateur</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className={selectClass + " w-full"}
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-dark/40 hover:text-dark/60 bg-dark/5 font-poppins text-sm transition-colors duration-150 focus:outline-none"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}

        {/* Count badge mobile */}
        <p className="font-poppins text-xs text-dark/40">
          {filtered.length} administrateur{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Admin List — Desktop Table */}
      {loadingData ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <svg
              className="h-8 w-8 animate-spin text-primary"
              viewBox="0 0 24 24"
              fill="none"
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
            <p className="font-poppins text-sm text-dark/40">
              Chargement des administrateurs…
            </p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg
            className="h-12 w-12 text-dark/20 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </svg>
          <p className="font-poppins text-sm text-dark/40">
            Aucun administrateur trouvé.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-2 font-poppins text-xs text-primary hover:underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <>
          <AdminsTable
            admins={filtered}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          <AdminCard
            admins={filtered}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </>
      )}

      {/* Admin Modal */}
      <AdminModal
        isOpen={modalOpen}
        mode={modalMode}
        initialData={editingAdmin}
        onClose={() => {
          setModalOpen(false);
          setEditingAdmin(null);
        }}
        onSave={handleModalSave}
      />

      {/* Delete Confirm Modal */}
      <DeleteAdminModal
        isOpen={!!deleteTarget}
        adminName={
          deleteTarget
            ? `${deleteTarget.firstName} ${deleteTarget.lastName}`
            : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
