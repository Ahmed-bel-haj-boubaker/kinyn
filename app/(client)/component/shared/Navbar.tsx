/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  X,
  ChevronDown,
  User,
  Package,
  LogOut,
} from "lucide-react";
import UserDropdown from "./UserDropdown";
import { useCart } from "@/lib/cart";

/* ─────────────────────── Types ─────────────────────── */

interface SubCategoryItem {
  label: string;
  href: string;
}

interface MegaCategory {
  label: string;
  items: SubCategoryItem[];
}

interface NavLink {
  label: string;
  href: string;
  categories?: MegaCategory[];
}

/* ─────────── Static links that always appear ─────────── */

const staticBefore: NavLink[] = [{ label: "Accueil", href: "/" }];
const staticAfter: NavLink[] = [
  { label: "À propos de nous", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/* ─────────── API response shapes ─────────── */

interface ApiFinale {
  id: string;
  name: string;
  slug: string;
}

interface ApiSous {
  id: string;
  name: string;
  slug: string;
  items: ApiFinale[];
}

interface ApiMere {
  id: string;
  name: string;
  slug: string;
  subcategories: ApiSous[];
}

interface ApiCollection {
  id: string;
  name: string;
  slug: string;
  categoryId: string | null;
  categorySlug: string | null;
}

/* ─────────────────────── Props ─────────────────────── */

interface NavbarProps {
  onCartClick: () => void;
  onSearchClick: () => void;
}

/* ─────────────────────── Component ─────────────────────── */

interface MobileUser {
  firstName: string;
  lastName: string;
  email: string;
}

export default function Navbar({ onCartClick, onSearchClick }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDesktop, setActiveDesktop] = useState<string | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const [rawCategories, setRawCategories] = useState<ApiMere[]>([]);
  const [collections, setCollections] = useState<ApiCollection[]>([]);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { totalItems } = useCart();
  const [mounted, setMounted] = useState(false);
  const [mobileUser, setMobileUser] = useState<MobileUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ── Fetch user for mobile menu ── */
  useEffect(() => {
    let cancelled = false;
    async function fetchMe() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.user) {
          setMobileUser({
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            email: data.user.email,
          });
        }
      } catch {
        /* keep guest state */
      }
    }
    fetchMe();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleMobileLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/sign-out", {
        method: "POST",
        credentials: "include",
      });
      setMobileUser(null);
      setMobileMenuOpen(false);
      router.push("/");
      router.refresh();
    } catch {
      /* silently fail */
    } finally {
      setLoggingOut(false);
    }
  };

  /* ── Fetch collections ── */
  useEffect(() => {
    let cancelled = false;
    async function fetchCollections() {
      try {
        const res = await fetch("/api/collections");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.collections) {
          setCollections(data.collections);
        }
      } catch {
        /* keep empty */
      }
    }
    fetchCollections();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Build nav links reactively from categories + collections ── */
  const navLinks = useMemo<NavLink[]>(() => {
    const dynamic: NavLink[] = rawCategories.map((mere) => {
      const cats: MegaCategory[] = mere.subcategories.map((sous) => ({
        label: sous.name,
        items: sous.items.map((fin) => ({
          label: fin.name,
          href: `/${mere.slug}/${fin.slug}`,
        })),
      }));

      // Attach collections that belong to this parent category
      const relatedCollections = collections.filter(
        (c) => c.categorySlug === mere.slug,
      );
      if (relatedCollections.length > 0) {
        cats.push({
          label: "Collections",
          items: relatedCollections.map((c) => ({
            label: c.name,
            href: `/collections/${c.slug}`,
          })),
        });
      }

      return {
        label: mere.name,
        href: `/${mere.slug}`,
        ...(cats.length > 0 ? { categories: cats } : {}),
      };
    });

    return [...staticBefore, ...dynamic, ...staticAfter];
  }, [rawCategories, collections]);

  useEffect(() => {
    let cancelled = false;

    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.categories) {
          setRawCategories(data.categories);
        }
      } catch {
        /* keep static fallback */
      }
    }

    fetchCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  /* Lock body scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  /* Desktop hover helpers with delay to avoid flicker */
  const showDropdown = (label: string) => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    setActiveDesktop(label);
  };

  const hideDropdown = () => {
    hideTimeoutRef.current = setTimeout(() => setActiveDesktop(null), 120);
  };

  const hasDropdown = (link: NavLink) =>
    !!(link.categories && link.categories.length > 0);

  /* ─────── Render flat mega menu ─────── */
  const renderFlatMega = (categories: MegaCategory[]) => (
    <div
      className="grid gap-12 px-10 py-8"
      style={{
        gridTemplateColumns: `repeat(${Math.min(categories.length, 4)}, minmax(0, 1fr))`,
      }}
    >
      {categories.map((cat) => (
        <div key={cat.label}>
          <h4 className="font-poppins text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2C2C2C] mb-4">
            {cat.label}
          </h4>
          <ul className="flex flex-col gap-2">
            {cat.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setActiveDesktop(null)}
                  className="font-poppins text-[12.5px] text-[#555] transition-colors duration-200 hover:text-[#111]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  /* ─────── Mobile accordion helpers ─────── */
  const toggleMobileSection = (label: string) => {
    setExpandedMobile((prev) => (prev === label ? null : label));
  };

  return (
    <nav className="relative w-full bg-[#FAF9F6] overflow-y-visible overflow-x-clip">
      {/* ─── Main bar ─── */}
      <div className="relative z-30 mx-auto flex h-[56px] sm:h-[64px] md:h-[68px] lg:h-[72px] max-w-7xl items-center px-4 sm:px-6 lg:px-12">
        {/* Mobile hamburger — far left */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden -ml-1 p-2 text-[#2C2C2C] transition-colors duration-200 hover:text-[#111]"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </button>

        {/* ─── Desktop navigation ─── */}
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <ul className="flex items-center gap-6 xl:gap-10">
            {navLinks.map((link) => (
              <li
                key={link.label}
                className="relative"
                onMouseEnter={() =>
                  hasDropdown(link) && showDropdown(link.label)
                }
                onMouseLeave={hasDropdown(link) ? hideDropdown : undefined}
              >
                <Link
                  href={link.href}
                  className="group relative flex items-center gap-1.5 font-poppins text-[11px] xl:text-[12.5px] font-medium uppercase tracking-[0.1em] text-[#2C2C2C] transition-colors duration-200 hover:text-[#111]"
                >
                  <span>{link.label}</span>
                  {hasDropdown(link) && (
                    <ChevronDown
                      className={`h-3 w-3 text-[#2C2C2C]/50 transition-transform duration-200 ${
                        activeDesktop === link.label ? "rotate-180" : ""
                      }`}
                      strokeWidth={2}
                    />
                  )}
                  <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-[#2C2C2C] transition-all duration-300 ease-out group-hover:w-full" />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile center logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:hidden">
          <Link href="/" aria-label="Home">
            <Image
              src="/images/logo.png"
              alt="Kinyn"
              width={400}
              height={400}
              className="object-contain w-20 h-20"
              priority
            />
          </Link>
        </div>

        {/* Mobile spacer — pushes icons to the right */}
        <div className="flex-1 lg:hidden" />

        {/* ─── Icon cluster — far right ─── */}
        <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
          <UserDropdown />
          <button
            type="button"
            onClick={onSearchClick}
            aria-label="Search"
            className="cursor-pointer text-[#2C2C2C] transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-2 rounded-sm"
          >
            <Search
              className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
              strokeWidth={1.4}
            />
          </button>
          <Link
            href="/profile?tab=wishlist"
            aria-label="Wishlist"
            className="cursor-pointer text-[#2C2C2C] transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-2 rounded-sm"
          >
            <Heart
              className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
              strokeWidth={1.4}
            />
          </Link>
          <button
            type="button"
            onClick={onCartClick}
            aria-label="Shopping bag"
            className="relative cursor-pointer text-[#2C2C2C] transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-2 rounded-sm"
          >
            <ShoppingBag
              className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
              strokeWidth={1.4}
            />
            {mounted && totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold font-poppins text-white leading-none">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Ultra-subtle bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 z-30 h-px bg-[#E8E6E1]" />

      {/* ─── Desktop Mega Menu Dropdowns ─── */}
      {navLinks.map(
        (link) =>
          hasDropdown(link) && (
            <div
              key={link.label}
              className={`absolute left-0 right-0 top-full z-20 bg-[#FAF9F6] shadow-[0_8px_30px_rgba(0,0,0,0.08)] border-t border-[#EEECE7] transition-all duration-250 ease-out ${
                activeDesktop === link.label
                  ? "opacity-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 -translate-y-1 pointer-events-none"
              }`}
              onMouseEnter={() => showDropdown(link.label)}
              onMouseLeave={hideDropdown}
            >
              <div className="mx-auto max-w-6xl">
                {link.categories && renderFlatMega(link.categories)}
              </div>
            </div>
          ),
      )}

      {/* ─── Logo half-circle — fixed to bottom of navbar (desktop only) ─── */}
      <Link
        href="/"
        className="hidden lg:block absolute left-1/2 top-full  -translate-x-1/2 overflow-hidden
          lg:w-[250px] lg:h-[100px]"
        aria-label="Home"
      >
        <div
          className="absolute left-1/2 z-9999 -translate-x-1/2 flex items-center justify-center rounded-b-full border border-[#E5E3DE] bg-[#FAF9F6] shadow-[0_6px_20px_rgba(0,0,0,0.08)]
          lg:-top-[120px] lg:h-[180px] lg:w-[230px]"
        >
          <Image
            src="/images/logo.png"
            alt="Kinyn"
            width={400}
            height={400}
            className="object-contain
              lg:translate-y-[60px]
              lg:w-[110px] lg:h-[110px]"
            priority
          />
        </div>
      </Link>

      {/* ─── Mobile overlay ─── */}
      <div
        className={`fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* ─── Mobile slide-in panel ─── */}
      <div
        className={`fixed left-0 top-0 z-50 flex h-full w-[280px] sm:w-[320px] flex-col bg-[#FAF9F6] shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between border-b border-[#E8E6E1] px-5 sm:px-7 py-4 sm:py-5">
          <span className="font-poppins text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2C2C2C]">
            Menu
          </span>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
            className="p-1 text-[#2C2C2C] transition-colors duration-200 hover:text-[#111]"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Panel links — scrollable */}
        <div className="flex-1 overflow-y-auto ">
          <ul className="flex flex-col px-5 sm:px-7 pt-5 sm:pt-6 pb-10">
            {navLinks.map((link) => (
              <li
                key={link.label}
                className="border-b border-[#EEECE7] last:border-b-0"
              >
                {hasDropdown(link) ? (
                  <button
                    type="button"
                    onClick={() => toggleMobileSection(link.label)}
                    className="flex w-full items-center justify-between py-4 font-poppins text-[13px] font-medium uppercase tracking-[0.08em] text-[#2C2C2C] transition-colors duration-200 hover:text-[#111]"
                  >
                    <span>{link.label}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-[#2C2C2C]/40 transition-transform duration-200 ${
                        expandedMobile === link.label ? "rotate-180" : ""
                      }`}
                      strokeWidth={1.8}
                    />
                  </button>
                ) : (
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center py-4 font-poppins text-[13px] font-medium uppercase tracking-[0.08em] text-[#2C2C2C] transition-colors duration-200 hover:text-[#111]"
                  >
                    {link.label}
                  </Link>
                )}

                {/* Flat accordion */}
                {link.categories && expandedMobile === link.label && (
                  <div className="pb-4 pl-3 ">
                    {link.categories.map((cat) => (
                      <div key={cat.label} className="mb-4 last:mb-0 ">
                        <h4 className="font-poppins text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#888] mb-2">
                          {cat.label}
                        </h4>
                        <ul className="flex flex-col gap-1.5 pl-2">
                          {cat.items.map((item) => (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className="font-poppins text-[12.5px] text-[#555] transition-colors duration-200 hover:text-[#111]"
                              >
                                {item.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom section — connected or guest */}
        <div className="border-t border-[#E8E6E1] px-5 sm:px-7 py-4 sm:py-5">
          {mobileUser ? (
            <div className="space-y-3">
              {/* User info */}
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold font-poppins text-white leading-none select-none">
                  {mobileUser.firstName.charAt(0)}
                  {mobileUser.lastName.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-poppins text-[13px] font-semibold text-[#2C2C2C] truncate">
                    {mobileUser.firstName} {mobileUser.lastName}
                  </p>
                  <p className="font-poppins text-[11px] text-[#999] truncate">
                    {mobileUser.email}
                  </p>
                </div>
              </div>

              {/* Quick links */}
              <div className="flex gap-2">
                <Link
                  href="/profile?tab=overview"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#E8E6E1] py-2.5 font-poppins text-[12px] font-medium text-[#2C2C2C] transition-colors hover:bg-[#F0EFEB]"
                >
                  <User className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Profil
                </Link>
                <Link
                  href="/profile?tab=orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#E8E6E1] py-2.5 font-poppins text-[12px] font-medium text-[#2C2C2C] transition-colors hover:bg-[#F0EFEB]"
                >
                  <Package className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Commandes
                </Link>
              </div>

              {/* Logout */}
              <button
                type="button"
                onClick={handleMobileLogout}
                disabled={loggingOut}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-red-200 py-2.5 font-poppins text-[13px] font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
                {loggingOut ? "Déconnexion…" : "Se Déconnecter"}
              </button>
            </div>
          ) : (
            <Link
              href="/auth/sign-in"
              onClick={() => setMobileMenuOpen(false)}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-poppins text-[13px] font-medium text-white transition-all duration-200 hover:bg-primary/90"
            >
              <span>Se Connecter</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
