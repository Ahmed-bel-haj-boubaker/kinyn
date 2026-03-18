/* eslint-disable @next/next/no-html-link-for-pages */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import NotificationBell from "./NotificationBell";
import { useNotifications } from "../../hooks/useNotifications";
import { useAdminAuth } from "../../context/AdminAuthContext";

interface AdminNavbarProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

export default function AdminNavbar({
  onMenuToggle,
  isSidebarOpen,
}: AdminNavbarProps) {
  const { user } = useAdminAuth();
  const router = useRouter();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

  const initials = user
    ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
    : "A";

  const roleLabel =
    user?.role === "super_admin"
      ? "Super Admin"
      : user?.role === "admin"
        ? "Admin"
        : "Modérateur";

  const handleSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
    } catch {
      /* ignore */
    }
    router.replace("/auth/sign-in");
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsProfileOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-16 bg-background border-b border-gray-200/60 shadow-sm"
      aria-label="Admin navigation"
    >
      <div className="h-full px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Hamburger + Brand */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-dark hover:bg-dark/5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-label={isSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={isSidebarOpen}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {isSidebarOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          <span className="font-erotique text-xl sm:text-2xl text-dark select-none tracking-wide">
            Kinyn <span className="text-primary">Admin</span>
          </span>
        </div>

        {/* Right: Search + Notifications + Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Search */}
          <div className="hidden sm:block relative">
            <label htmlFor="admin-search" className="sr-only">
              Rechercher
            </label>
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400"
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
            </div>
            <input
              id="admin-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Produits, commandes, clients..."
              className="font-poppins w-52 lg:w-72 pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300/60 bg-white text-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
            />
          </div>

          {/* Mobile Search Toggle */}
          <button
            type="button"
            className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg text-dark hover:bg-dark/5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="Rechercher"
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          {/* Notifications */}
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
          />

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-dark/5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Menu profil"
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="font-poppins text-xs font-semibold text-white">
                  {initials}
                </span>
              </div>
              <span className="hidden sm:block font-poppins text-sm font-medium text-dark max-w-30 truncate">
                {user?.firstName}
              </span>
              <svg
                className={`hidden sm:block w-4 h-4 text-dark transition-transform duration-200 ${
                  isProfileOpen ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            <div
              className={`absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 transition-all duration-200 origin-top-right ${
                isProfileOpen
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-95 pointer-events-none"
              }`}
              role="menu"
              aria-label="Options du profil"
            >
              {/* User info header */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-poppins text-sm font-medium text-dark truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="font-poppins text-xs text-gray-400 truncate">
                  {user?.email}
                </p>
                <span className="mt-1.5 inline-block px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider rounded-full bg-primary/10 text-primary">
                  {roleLabel}
                </span>
              </div>

              <a
                href="/admin/profile"
                className="flex items-center gap-3 px-4 py-2.5 font-poppins text-sm text-dark hover:bg-primary/5 hover:text-primary transition-colors duration-150"
                role="menuitem"
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Profil
              </a>
              <div className="my-1 border-t border-gray-100" />
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 font-poppins text-sm text-red-600 hover:bg-red-50 transition-colors duration-150 disabled:opacity-50"
                role="menuitem"
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                {signingOut ? "Déconnexion..." : "Déconnexion"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
