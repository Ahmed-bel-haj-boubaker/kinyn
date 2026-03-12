"use client";

import { useState } from "react";
import { useNotifications, type Notification } from "../hooks/useNotifications";
import { useToast } from "../hooks/useToast";
import Toast from "../component/shared/Toast";

/* ================================================================
   /admin/notifications — Full Notification Center
   ================================================================ */

const TYPE_LABELS: Record<string, string> = {
  order: "Commande",
  system: "Système",
  delivery: "Livraison",
  stock: "Stock",
  user: "Utilisateur",
};

const TYPE_COLORS: Record<string, string> = {
  order: "bg-primary/10 text-primary border-primary/20",
  system: "bg-blue-50 text-blue-600 border-blue-200",
  delivery: "bg-green-50 text-green-600 border-green-200",
  stock: "bg-amber-50 text-amber-600 border-amber-200",
  user: "bg-purple-50 text-purple-600 border-purple-200",
};

const TYPE_ICONS: Record<string, string> = {
  order: "🛒",
  system: "⚙️",
  delivery: "📦",
  stock: "📊",
  user: "👤",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type FilterType =
  | "all"
  | "unread"
  | "order"
  | "system"
  | "delivery"
  | "stock"
  | "user";

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const { toasts, addToast, removeToast } = useToast();
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.isRead;
    return n.type === filter;
  });

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    addToast("success", "Toutes les notifications marquées comme lues.");
  };

  const handleDelete = async (id: string) => {
    await deleteNotification(id);
    addToast("info", "Notification supprimée.");
  };

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "Toutes" },
    { key: "unread", label: `Non lues (${unreadCount})` },
    { key: "order", label: "Commandes" },
    { key: "system", label: "Système" },
    { key: "delivery", label: "Livraison" },
    { key: "stock", label: "Stock" },
    { key: "user", label: "Utilisateurs" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Toast */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-poppins text-2xl font-bold text-dark">
            Notifications
          </h1>
          <p className="font-poppins text-sm text-gray-500 mt-1">
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
              : "Aucune notification non lue"}
            {isConnected && (
              <span className="inline-flex items-center gap-1 ml-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[11px] text-green-600">En direct</span>
              </span>
            )}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="font-poppins text-sm font-medium text-primary hover:text-primary/80 border border-primary/20 hover:bg-primary/5 px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`font-poppins text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors duration-200 ${
              filter === f.key
                ? "bg-dark text-white border-dark"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-dark"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3 mb-1" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 px-6 py-16 text-center">
          <svg
            className="w-14 h-14 mx-auto text-gray-300 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <p className="font-poppins text-base font-medium text-gray-400">
            Aucune notification
          </p>
          <p className="font-poppins text-sm text-gray-300 mt-1">
            {filter !== "all"
              ? "Essayez un autre filtre."
              : "Les nouvelles notifications apparaîtront ici."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────── Notification Card ──────────── */

function NotificationCard({
  notification,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`group relative bg-white rounded-xl border transition-all duration-200 hover:shadow-sm ${
        !notification.isRead
          ? "border-primary/15 bg-primary/1"
          : "border-gray-100"
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div
          className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-base border ${
            TYPE_COLORS[notification.type] ||
            "bg-gray-50 text-gray-500 border-gray-200"
          }`}
        >
          {TYPE_ICONS[notification.type] || "📌"}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3
              className={`font-poppins text-sm ${
                !notification.isRead
                  ? "font-semibold text-dark"
                  : "font-medium text-gray-700"
              }`}
            >
              {notification.title}
            </h3>
            {!notification.isRead && (
              <span className="shrink-0 w-2 h-2 bg-primary rounded-full" />
            )}
            <span
              className={`font-poppins text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded ${
                TYPE_COLORS[notification.type] || "bg-gray-100 text-gray-500"
              }`}
            >
              {TYPE_LABELS[notification.type] || notification.type}
            </span>
          </div>
          <p className="font-poppins text-sm text-gray-500 leading-relaxed">
            {notification.message}
          </p>
          <p className="font-poppins text-xs text-gray-400 mt-1.5">
            {timeAgo(notification.createdAt)}
          </p>
        </div>

        {/* Actions */}
        <div
          className={`flex items-center gap-1 transition-opacity duration-200 ${
            showActions ? "opacity-100" : "opacity-0"
          }`}
        >
          {!notification.isRead && (
            <button
              type="button"
              onClick={() => onMarkRead(notification._id)}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors duration-150"
              title="Marquer comme lu"
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(notification._id)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors duration-150"
            title="Supprimer"
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
      </div>
    </div>
  );
}
