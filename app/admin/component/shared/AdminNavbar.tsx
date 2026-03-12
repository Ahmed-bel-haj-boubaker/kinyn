"use client";

import { useState, useRef, useEffect } from "react";
import NotificationBell from "./NotificationBell";
import { useNotifications } from "../../hooks/useNotifications";

interface AdminNavbarProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

export default function AdminNavbar({
  onMenuToggle,
  isSidebarOpen,
}: AdminNavbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();

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
              <div className="w-8 h-8 rounded-full bg-dark flex items-center justify-center">
                <span className="font-poppins text-xs font-semibold text-white">
                  A
                </span>
              </div>
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
              <a
                href="#"
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
              <a
                href="#"
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Paramètres
              </a>
              <div className="my-1 border-t border-gray-100" />
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-2.5 font-poppins text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
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
                Déconnexion
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
