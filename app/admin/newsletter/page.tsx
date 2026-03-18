/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useCallback, useEffect } from "react";
import DeleteConfirmModal from "../component/shared/DeleteConfirmModal";
import Toast from "../component/shared/Toast";
import { useToast } from "../hooks/useToast";
import { useAdminAuth } from "../context/AdminAuthContext";

/* ──────────────── Types ──────────────── */

interface Entry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isRegistered: boolean;
  newsletterStatus: "active" | "unsubscribed" | "not_subscribed";
  subscribedAt: string | null;
}

interface Stats {
  total: number;
  active: number;
  unsubscribed: number;
}

/* ──────────────── API helper ──────────────── */

const API_BASE = "/api/admin/newsletter";

async function apiFetch<T>(
  url: string,
  opts?: RequestInit,
): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...opts,
    });
    const json = await res.json();
    if (!res.ok) return { ok: false, error: json.error ?? "Erreur serveur." };
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, error: "Erreur réseau." };
  }
}

/* ──────────────── Page ──────────────── */

interface APIListResponse {
  entries: Entry[];
  total: number;
  stats: Stats | null;
}

export default function NewsletterPage() {
  const { canWrite } = useAdminAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  /* Filters */
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(1);
  const limit = 50;

  /* Modals */
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);

  const { toasts, addToast, removeToast } = useToast();

  /* ── Fetch ── */

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (filterStatus) params.set("status", filterStatus);
    params.set("page", String(page));
    params.set("limit", String(limit));

    const result = await apiFetch<APIListResponse>(
      `${API_BASE}?${params.toString()}`,
    );

    if (result.ok && result.data) {
      setEntries(result.data.entries);
      setTotal(result.data.total);
      setStats(result.data.stats);
    } else {
      addToast("error", result.error ?? "Impossible de charger les données.");
    }
    setLoading(false);
  }, [search, filterStatus, page, addToast]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  /* Reset page on filter change */
  useEffect(() => {
    setPage(1);
  }, [search, filterStatus]);

  /* ── Handlers ── */

  const handleToggleStatus = useCallback(
    async (entry: Entry) => {
      if (entry.newsletterStatus === "not_subscribed") return;
      const result = await apiFetch<{ subscriber: Entry }>(
        `${API_BASE}/${entry.id}`,
        { method: "PATCH" },
      );
      if (result.ok) {
        addToast("success", "Statut mis à jour.");
        await fetchEntries();
      } else {
        addToast("error", result.error ?? "Erreur.");
      }
    },
    [addToast, fetchEntries],
  );

  const handleDelete = useCallback((entry: Entry) => {
    if (entry.newsletterStatus === "not_subscribed") return;
    setDeleteTarget(entry);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const result = await apiFetch(`${API_BASE}/${deleteTarget.id}`, {
      method: "DELETE",
    });
    if (result.ok) {
      addToast("success", "Abonné supprimé de la newsletter.");
      await fetchEntries();
    } else {
      addToast("error", result.error ?? "Erreur lors de la suppression.");
    }
    setDeleteTarget(null);
  }, [deleteTarget, addToast, fetchEntries]);

  const handleExport = useCallback(async () => {
    const result = await apiFetch<{ emails: string[] }>(
      `${API_BASE}?export=emails`,
    );
    if (result.ok && result.data) {
      const csv = result.data.emails.join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `newsletter-emails-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addToast("success", `${result.data.emails.length} emails exportés.`);
    } else {
      addToast("error", result.error ?? "Erreur lors de l'export.");
    }
  }, [addToast]);

  /* ── Pagination ── */
  const totalPages = Math.ceil(total / limit);

  const formatDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  const statusLabel = (s: Entry["newsletterStatus"]) => {
    if (s === "active") return "Inscrit";
    if (s === "unsubscribed") return "Désinscrit";
    return "Non inscrit";
  };

  const statusClasses = (s: Entry["newsletterStatus"]) => {
    if (s === "active") return "bg-green-100 text-green-700";
    if (s === "unsubscribed") return "bg-orange-100 text-orange-700";
    return "bg-gray-100 text-gray-500";
  };

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-erotique text-3xl sm:text-4xl text-dark">
            Newsletter
          </h1>
          <p className="font-poppins text-sm text-dark/50 mt-1">
            Clients et abonnés à la newsletter
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Exporter les emails actifs
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Total clients
          </p>
          <p className="font-poppins text-2xl font-bold text-dark">{total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Inscrits
          </p>
          <p className="font-poppins text-2xl font-bold text-emerald-600">
            {stats?.active ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Désinscrits
          </p>
          <p className="font-poppins text-2xl font-bold text-orange-500">
            {stats?.unsubscribed ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="font-poppins text-xs font-semibold text-dark/40 uppercase tracking-wider mb-1">
            Non inscrits
          </p>
          <p className="font-poppins text-2xl font-bold text-gray-400">
            {total - (stats?.total ?? 0) > 0 ? total - (stats?.total ?? 0) : 0}
          </p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
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
            placeholder="Rechercher par email ou nom…"
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark placeholder:text-dark/30 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200"
          />
        </div>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 bg-white font-poppins text-sm text-dark focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all duration-200"
        >
          <option value="">Tous</option>
          <option value="active">Inscrits</option>
          <option value="unsubscribed">Désinscrits</option>
          <option value="not_subscribed">Non inscrits</option>
        </select>

        {/* Count badge */}
        <span className="ml-auto font-poppins text-xs text-dark/40">
          {total} entrée{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Table / List ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg
              className="w-8 h-8 animate-spin text-primary"
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
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-dark/40">
            <svg
              className="w-12 h-12 mb-4 opacity-30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
            <p className="font-poppins text-sm">Aucun résultat trouvé.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-5 py-3 text-left font-poppins text-xs font-semibold text-dark/50 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-5 py-3 text-left font-poppins text-xs font-semibold text-dark/50 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-5 py-3 text-left font-poppins text-xs font-semibold text-dark/50 uppercase tracking-wider">
                      Newsletter
                    </th>
                    <th className="px-5 py-3 text-left font-poppins text-xs font-semibold text-dark/50 uppercase tracking-wider">
                      Date inscription
                    </th>
                    <th className="px-5 py-3 text-right font-poppins text-xs font-semibold text-dark/50 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {entries.map((entry) => (
                    <tr
                      key={entry.id + entry.email}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      {/* Email */}
                      <td className="px-5 py-4">
                        <p className="font-poppins text-sm font-medium text-dark">
                          {entry.email}
                        </p>
                      </td>

                      {/* Client */}
                      <td className="px-5 py-4">
                        {entry.isRegistered ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-poppins text-xs font-semibold">
                            <svg
                              className="w-3 h-3"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                              />
                            </svg>
                            {entry.firstName} {entry.lastName}
                          </span>
                        ) : (
                          <span className="font-poppins text-xs text-dark/30 italic">
                            Visiteur
                          </span>
                        )}
                      </td>

                      {/* Newsletter status */}
                      <td className="px-5 py-4">
                        {canWrite &&
                        entry.newsletterStatus !== "not_subscribed" ? (
                          <button
                            onClick={() => handleToggleStatus(entry)}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-poppins text-xs font-medium transition-colors cursor-pointer hover:opacity-80 ${statusClasses(entry.newsletterStatus)}`}
                            title="Cliquer pour changer le statut"
                          >
                            {statusLabel(entry.newsletterStatus)}
                          </button>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-poppins text-xs font-medium ${statusClasses(entry.newsletterStatus)}`}
                          >
                            {statusLabel(entry.newsletterStatus)}
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 font-poppins text-sm text-dark/50">
                        {formatDate(entry.subscribedAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        {canWrite &&
                          entry.newsletterStatus !== "not_subscribed" && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleDelete(entry)}
                                className="p-1.5 rounded-lg text-dark/40 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Supprimer de la newsletter"
                              >
                                <svg
                                  className="w-4 h-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {entries.map((entry) => (
                <div key={entry.id + entry.email} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-poppins text-sm font-medium text-dark truncate">
                        {entry.email}
                      </p>
                      {entry.isRegistered && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full bg-primary/10 text-primary font-poppins text-xs font-semibold">
                          <svg
                            className="w-3 h-3"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {entry.firstName} {entry.lastName}
                        </span>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 font-poppins text-xs font-medium ${statusClasses(entry.newsletterStatus)}`}
                        >
                          {statusLabel(entry.newsletterStatus)}
                        </span>
                        <span className="font-poppins text-xs text-dark/40">
                          {formatDate(entry.subscribedAt)}
                        </span>
                      </div>
                    </div>
                    {canWrite &&
                      entry.newsletterStatus !== "not_subscribed" && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleToggleStatus(entry)}
                            className="p-1.5 rounded-lg text-dark/40 hover:text-dark hover:bg-gray-100 transition-colors"
                            title="Changer le statut"
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
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(entry)}
                            className="p-1.5 rounded-lg text-dark/40 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Supprimer"
                          >
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 font-poppins text-sm text-dark hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <span className="font-poppins text-sm text-dark/50">
                  Page {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 font-poppins text-sm text-dark hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        categoryName={deleteTarget?.email ?? ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
