"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  User,
  LogIn,
  UserPlus,
  Heart,
  Package,
  Settings,
  LogOut,
} from "lucide-react";

const menuItems = [
  { label: "Mon Compte", href: "/profile", icon: LogIn },
  { label: "Créer un Compte", href: "/auth/sign-up", icon: UserPlus },
  { divider: true },
  { label: "Mes Commandes", href: "/orders", icon: Package },
  { label: "Liste de Souhaits", href: "/wishlist", icon: Heart },
  { divider: true },
  { label: "Paramètres", href: "/settings", icon: Settings },
  { label: "Déconnexion", href: "#", icon: LogOut },
] as const;

type MenuItem =
  | {
      label: string;
      href: string;
      icon: React.ComponentType<
        React.SVGProps<SVGSVGElement> & { strokeWidth?: number }
      >;
      divider?: undefined;
    }
  | { divider: true; label?: undefined; href?: undefined; icon?: undefined };

export default function UserDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

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

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Account"
        aria-expanded={open}
        aria-haspopup="menu"
        className="hidden sm:flex items-center justify-center cursor-pointer text-[#2C2C2C] transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-2 rounded-sm"
      >
        <User className="h-4 w-4 sm:h-4.5 sm:w-4.5" strokeWidth={1.4} />
      </button>

      <div
        role="menu"
        aria-orientation="vertical"
        className={`absolute right-0 mt-3 w-52 origin-top-right rounded-lg border border-[#EEECE7] bg-white py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-200 ease-in-out ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-1.5 pointer-events-none"
        }`}
      >
        {(menuItems as readonly MenuItem[]).map((item, idx) => {
          if (item.divider) {
            return (
              <div key={`divider-${idx}`} className="my-1 h-px bg-[#F0EFEB]" />
            );
          }

          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              role="menuitem"
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 font-poppins text-[12.5px] text-[#444] transition-colors duration-150 hover:bg-[#FAF9F6] hover:text-[#111] focus-visible:outline-none focus-visible:bg-[#FAF9F6]"
            >
              <Icon
                className="h-3.5 w-3.5 text-[#999] shrink-0"
                strokeWidth={1.5}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
