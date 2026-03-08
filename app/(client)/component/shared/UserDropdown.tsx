"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  LogIn,
  UserPlus,
  Heart,
  Package,
  LogOut,
  ChevronRight,
} from "lucide-react";

/* ─────────────── User shape from /api/auth/me ─────────────── */

interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

export default function UserDropdown() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  /* ── Fetch current user on mount ── */
  useEffect(() => {
    let cancelled = false;
    async function fetchMe() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          if (!cancelled) setUser(null);
          return;
        }
        const data = await res.json();
        if (!cancelled && data.user) {
          setUser({
            id: data.user.id,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            email: data.user.email,
            avatar: data.user.avatar,
          });
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchMe();
    return () => {
      cancelled = true;
    };
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  /* ── Close on Escape / outside click ── */
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };

    document.addEventListener("keydown", handleEsc);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, close]);

  /* ── Logout handler ── */
  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      setOpen(false);
      router.push("/");
      router.refresh();
    } catch {
      /* silently fail */
    } finally {
      setLoggingOut(false);
    }
  };

  /* ── Initials helper ── */
  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "";

  const fullName = user ? `${user.firstName} ${user.lastName}` : "";

  return (
    <div ref={containerRef} className="relative">
      {/* ─── Trigger button ─── */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Account"
        aria-expanded={open}
        aria-haspopup="menu"
        className="hidden sm:flex items-center justify-center cursor-pointer text-[#2C2C2C] transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-2 rounded-sm"
      >
        {!loading && user ? (
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-bold font-poppins text-white leading-none select-none">
            {initials}
          </span>
        ) : (
          <User className="h-4 w-4 sm:h-4.5 sm:w-4.5" strokeWidth={1.4} />
        )}
      </button>

      {/* ─── Dropdown panel ─── */}
      <div
        role="menu"
        aria-orientation="vertical"
        className={`absolute right-0 mt-3 w-60 origin-top-right rounded-lg border border-[#EEECE7] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-200 ease-in-out ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-1.5 pointer-events-none"
        }`}
      >
        {user ? (
          /* ══════════ Authenticated menu ══════════ */
          <>
            {/* User header */}
            <div className="px-4 pt-4 pb-3 border-b border-[#F0EFEB]">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold font-poppins text-white leading-none select-none">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-poppins text-[13px] font-semibold text-[#2C2C2C] truncate">
                    {fullName}
                  </p>
                  <p className="font-poppins text-[11px] text-[#999] truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Nav items */}
            <div className="py-1.5">
              <Link
                href="/profile"
                role="menuitem"
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 font-poppins text-[12.5px] text-[#444] transition-colors duration-150 hover:bg-[#FAF9F6] hover:text-[#111] focus-visible:outline-none focus-visible:bg-[#FAF9F6]"
              >
                <User
                  className="h-3.5 w-3.5 text-[#999] shrink-0"
                  strokeWidth={1.5}
                />
                <span>Mon Profil</span>
                <ChevronRight
                  className="ml-auto h-3 w-3 text-[#ccc]"
                  strokeWidth={1.5}
                />
              </Link>

              <Link
                href="/profile?tab=orders"
                role="menuitem"
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 font-poppins text-[12.5px] text-[#444] transition-colors duration-150 hover:bg-[#FAF9F6] hover:text-[#111] focus-visible:outline-none focus-visible:bg-[#FAF9F6]"
              >
                <Package
                  className="h-3.5 w-3.5 text-[#999] shrink-0"
                  strokeWidth={1.5}
                />
                <span>Mes Commandes</span>
                <ChevronRight
                  className="ml-auto h-3 w-3 text-[#ccc]"
                  strokeWidth={1.5}
                />
              </Link>

              <Link
                href="/profile?tab=wishlist"
                role="menuitem"
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 font-poppins text-[12.5px] text-[#444] transition-colors duration-150 hover:bg-[#FAF9F6] hover:text-[#111] focus-visible:outline-none focus-visible:bg-[#FAF9F6]"
              >
                <Heart
                  className="h-3.5 w-3.5 text-[#999] shrink-0"
                  strokeWidth={1.5}
                />
                <span>Liste de Souhaits</span>
                <ChevronRight
                  className="ml-auto h-3 w-3 text-[#ccc]"
                  strokeWidth={1.5}
                />
              </Link>
            </div>

            {/* Logout */}
            <div className="border-t border-[#F0EFEB] py-1.5">
              <button
                type="button"
                role="menuitem"
                tabIndex={open ? 0 : -1}
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 font-poppins text-[12.5px] text-red-500 transition-colors duration-150 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:bg-red-50 disabled:opacity-50 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                <span>{loggingOut ? "Déconnexion…" : "Se Déconnecter"}</span>
              </button>
            </div>
          </>
        ) : (
          /* ══════════ Guest menu ══════════ */
          <div className="py-1.5">
            <Link
              href="/auth/sign-in"
              role="menuitem"
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 font-poppins text-[12.5px] text-[#444] transition-colors duration-150 hover:bg-[#FAF9F6] hover:text-[#111] focus-visible:outline-none focus-visible:bg-[#FAF9F6]"
            >
              <LogIn
                className="h-3.5 w-3.5 text-[#999] shrink-0"
                strokeWidth={1.5}
              />
              <span>Se Connecter</span>
            </Link>

            <Link
              href="/auth/sign-up"
              role="menuitem"
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 font-poppins text-[12.5px] text-[#444] transition-colors duration-150 hover:bg-[#FAF9F6] hover:text-[#111] focus-visible:outline-none focus-visible:bg-[#FAF9F6]"
            >
              <UserPlus
                className="h-3.5 w-3.5 text-[#999] shrink-0"
                strokeWidth={1.5}
              />
              <span>Créer un Compte</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
