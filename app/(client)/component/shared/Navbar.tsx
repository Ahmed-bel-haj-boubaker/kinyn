"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, Menu, ShoppingBag, User, X } from "lucide-react";

/* ──────────────────────────── Types ──────────────────────────── */

interface SubCategory {
  title: string;
  items: string[];
}

interface MegaMenuColumn {
  heading: string;
  subcategories: SubCategory[];
}

interface NavCategory {
  label: string;
  href: string;
  columns: MegaMenuColumn[];
}

/* ──────────────────────────── Data ──────────────────────────── */

const NAV_CATEGORIES: NavCategory[] = [
  {
    label: "Femme",
    href: "/femme",
    columns: [
      {
        heading: "Femme",
        subcategories: [
          {
            title: "Hauts",
            items: [
              "T-shirt",
              "Chemise",
              "Blouse",
              "Pull / Sweater",
              "Sweat à capuche (Hoodie)",
              "Gilet",
              "Débardeur",
              "Polo",
              "Veste légère",
              "Manteau / Parka",
            ],
          },
        ],
      },
      {
        heading: "",
        subcategories: [
          {
            title: "Bas",
            items: [
              "Pantalon",
              "Jean",
              "Short",
              "Jupe",
              "Legging",
              "Chino",
              "Pantalon de jogging",
            ],
          },
        ],
      },
      {
        heading: "",
        subcategories: [
          {
            title: "Robes",
            items: [
              "Robe courte",
              "Robe longue",
              "Robe de soirée",
              "Robe de cocktail",
            ],
          },
        ],
      },
    ],
  },
  {
    label: "Enfant",
    href: "/enfant",
    columns: [
      {
        heading: "Bébé Fille",
        subcategories: [
          {
            title: "Hauts",
            items: ["T-shirt", "Pull / Sweater", "Sweat à capuche", "Gilet"],
          },
          { title: "Bas", items: ["Pantalon", "Legging", "Jean", "Short"] },
          { title: "Robes", items: ["Robe courte", "Robe longue"] },
        ],
      },
      {
        heading: "Bébé Garçon",
        subcategories: [
          {
            title: "Hauts",
            items: ["T-shirt", "Pull / Sweater", "Sweat à capuche", "Gilet"],
          },
          {
            title: "Bas",
            items: ["Pantalon", "Jean", "Short", "Pantalon de jogging"],
          },
        ],
      },
      {
        heading: "Fille",
        subcategories: [
          {
            title: "Hauts",
            items: [
              "T-shirt",
              "Chemise",
              "Blouse",
              "Pull / Sweater",
              "Sweat à capuche",
              "Gilet",
              "Débardeur",
              "Veste légère",
              "Manteau / Parka",
            ],
          },
          {
            title: "Bas",
            items: [
              "Pantalon",
              "Jean",
              "Short",
              "Jupe",
              "Legging",
              "Chino",
              "Pantalon de jogging",
            ],
          },
          {
            title: "Robes",
            items: [
              "Robe courte",
              "Robe longue",
              "Robe de soirée",
              "Robe de cocktail",
            ],
          },
        ],
      },
      {
        heading: "Garçon",
        subcategories: [
          {
            title: "Hauts",
            items: [
              "T-shirt",
              "Chemise",
              "Pull / Sweater",
              "Sweat à capuche",
              "Gilet",
              "Débardeur",
              "Polo",
              "Veste légère",
              "Manteau / Parka",
            ],
          },
          {
            title: "Bas",
            items: [
              "Pantalon",
              "Jean",
              "Short",
              "Chino",
              "Pantalon de jogging",
            ],
          },
        ],
      },
    ],
  },
];

const CART_COUNT = 2;
const WISHLIST_COUNT = 5;

/* ──────────────────────────── Component ──────────────────────── */

interface NavbarProps {
  onCartClick: () => void;
}

export default function Navbar({ onCartClick }: NavbarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const [mobileSubAccordion, setMobileSubAccordion] = useState<string | null>(
    null,
  );

  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);

  /* ── Keyboard: ESC closes everything ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMenu(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  /* ── Lock body scroll when mobile menu is open ── */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  /* ── Desktop hover handlers (with grace period) ── */
  const handleMouseEnter = useCallback((label: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setActiveMenu(label);
  }, []);

  const handleMouseLeave = useCallback(() => {
    closeTimeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  }, []);

  /* ── Mobile accordion toggle ── */
  const toggleMobileAccordion = useCallback((label: string) => {
    setMobileAccordion((prev) => {
      if (prev !== label) setMobileSubAccordion(null);
      return prev === label ? null : label;
    });
  }, []);

  const toggleMobileSubAccordion = useCallback((key: string) => {
    setMobileSubAccordion((prev) => (prev === key ? null : key));
  }, []);

  /* ── Slug helper ── */
  const toSlug = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  return (
    <>
      <nav
        ref={navRef}
        role="navigation"
        aria-label="Main navigation"
        className="bg-background font-poppins"
      >
        <div className="border-b border-dark/10 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
            <div className="flex h-[76px] items-center justify-between">
              {/* ────────── Left: Logo ────────── */}
              <Link
                href="/"
                className="group relative flex items-center"
                aria-label="KINYN – Accueil"
              >
                <Image
                  src="/images/logo.png"
                  alt="KINYN"
                  width={400}
                  height={400}
                  className="h-14 w-auto object-contain transition-opacity duration-200 group-hover:opacity-80"
                  priority
                />
              </Link>

              {/* ────────── Center: Desktop categories ────────── */}
              <div className="hidden lg:flex items-center gap-10">
                {NAV_CATEGORIES.map((cat) => (
                  <div
                    key={cat.label}
                    className="relative"
                    onMouseEnter={() => handleMouseEnter(cat.label)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <Link
                      href={cat.href}
                      className={`group relative flex items-center gap-1 text-[0.8rem] font-medium uppercase tracking-[0.14em] transition-colors duration-200 py-7 ${
                        activeMenu === cat.label
                          ? "text-primary"
                          : "text-dark hover:text-primary"
                      }`}
                      aria-expanded={activeMenu === cat.label}
                      aria-haspopup="true"
                    >
                      {cat.label}
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          activeMenu === cat.label ? "rotate-180" : ""
                        }`}
                        strokeWidth={2}
                      />
                      <span
                        className={`absolute bottom-5 left-0 h-[1.5px] bg-primary transition-all duration-300 ease-out ${
                          activeMenu === cat.label ? "w-full" : "w-0"
                        }`}
                      />
                    </Link>
                  </div>
                ))}
              </div>

              {/* ────────── Right: Actions ────────── */}
              <div className="flex items-center gap-3">
                {/* Se connecter */}
                <Link
                  href="/login"
                  className="hidden lg:flex items-center gap-2 rounded-full border border-dark/20 px-5 py-2 text-[0.78rem] font-medium tracking-wide text-dark transition-all duration-200 hover:border-primary hover:text-primary"
                >
                  <User className="h-4 w-4" strokeWidth={1.8} />
                  <span>Se connecter</span>
                </Link>

                {/* Wishlist */}
                <Link
                  href="/wishlist"
                  className="relative flex items-center justify-center h-10 w-10 rounded-full text-dark transition-colors duration-200 hover:text-primary"
                  aria-label={`Favoris${WISHLIST_COUNT > 0 ? `, ${WISHLIST_COUNT} articles` : ""}`}
                >
                  <Heart className="h-5 w-5" strokeWidth={1.8} />
                  {WISHLIST_COUNT > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[0.6rem] font-semibold leading-none text-background">
                      {WISHLIST_COUNT}
                    </span>
                  )}
                </Link>

                {/* Cart */}
                <button
                  type="button"
                  onClick={onCartClick}
                  className="relative flex items-center justify-center h-10 w-10 rounded-full text-dark transition-colors duration-200 hover:text-primary"
                  aria-label={`Panier${CART_COUNT > 0 ? `, ${CART_COUNT} articles` : ""}`}
                >
                  <ShoppingBag className="h-5 w-5" strokeWidth={1.8} />
                  {CART_COUNT > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[0.6rem] font-semibold leading-none text-background">
                      {CART_COUNT}
                    </span>
                  )}
                </button>

                {/* Mobile hamburger / close */}
                <button
                  type="button"
                  className="flex lg:hidden items-center justify-center h-10 w-10 rounded-full text-dark transition-colors duration-200 hover:text-primary"
                  onClick={() => setMobileOpen(!mobileOpen)}
                  aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
                  aria-expanded={mobileOpen}
                >
                  {mobileOpen ? (
                    <X className="h-5 w-5" strokeWidth={1.8} />
                  ) : (
                    <Menu className="h-5 w-5" strokeWidth={1.8} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ────────── Desktop Mega Menus ────────── */}
        {NAV_CATEGORIES.map((cat) => (
          <div
            key={cat.label}
            className={`absolute left-0 right-0 top-full z-40 overflow-hidden bg-background transition-all duration-300 ease-out ${
              activeMenu === cat.label
                ? "pointer-events-auto max-h-[600px] opacity-100 translate-y-0"
                : "pointer-events-none max-h-0 opacity-0 -translate-y-2"
            }`}
            onMouseEnter={() => handleMouseEnter(cat.label)}
            onMouseLeave={handleMouseLeave}
            role="region"
            aria-label={`${cat.label} sous-menu`}
          >
            <div className="hidden lg:block bg-background rounded-b-xl shadow-[0_8px_24px_rgba(0,0,0,0.06)] border-t border-dark/5">
              <div className="mx-auto max-w-[1440px] px-10 py-10">
                <div
                  className={`grid gap-10 ${
                    cat.columns.length === 1
                      ? "grid-cols-2"
                      : cat.columns.length === 2
                        ? "grid-cols-2"
                        : cat.columns.length === 3
                          ? "grid-cols-3"
                          : "grid-cols-4"
                  }`}
                >
                  {cat.columns.map((col, colIdx) => (
                    <div key={`${cat.label}-col-${colIdx}`}>
                      {col.heading && (
                        <h3 className="mb-5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-dark">
                          {col.heading}
                        </h3>
                      )}
                      <div className="space-y-6">
                        {col.subcategories.map((sub) => (
                          <div key={sub.title}>
                            <h4 className="mb-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-dark/60">
                              {sub.title}
                            </h4>
                            <ul className="space-y-1.5">
                              {sub.items.map((item) => (
                                <li key={item}>
                                  <Link
                                    href={`${cat.href}/${toSlug(item)}`}
                                    className="group/item inline-flex items-center text-[0.8rem] text-dark/80 transition-all duration-200 hover:text-primary hover:translate-x-1"
                                  >
                                    <span>{item}</span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* ────────── Mobile Dropdown Menu ────────── */}
        <div
          className={`lg:hidden overflow-hidden bg-background border-b border-dark/10 shadow-lg transition-all duration-300 ease-out ${
            mobileOpen
              ? "max-h-[calc(100vh-76px)] opacity-100"
              : "max-h-0 opacity-0 pointer-events-none"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navigation"
        >
          <div className="overflow-y-auto max-h-[calc(100vh-76px)]">
            {/* Mobile navigation */}
            <div className="px-6 py-6 space-y-1">
              {NAV_CATEGORIES.map((cat) => (
                <div
                  key={cat.label}
                  className="border-b border-dark/5 last:border-b-0"
                >
                  {/* Category toggle */}
                  <button
                    type="button"
                    onClick={() => toggleMobileAccordion(cat.label)}
                    className="flex w-full items-center justify-between py-4 text-[0.85rem] font-medium uppercase tracking-[0.12em] text-dark transition-colors duration-200 hover:text-primary"
                    aria-expanded={mobileAccordion === cat.label}
                  >
                    <span>{cat.label}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-300 ${
                        mobileAccordion === cat.label ? "rotate-180" : ""
                      }`}
                      strokeWidth={2}
                    />
                  </button>

                  {/* Category accordion content */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-out ${
                      mobileAccordion === cat.label
                        ? "max-h-[2000px] opacity-100 pb-4"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    {cat.columns.map((col, colIdx) => {
                      const colKey = `${cat.label}-${col.heading || colIdx}`;

                      return (
                        <div key={colKey} className="mb-2">
                          {/* Column heading (only Enfant has sub-headings) */}
                          {col.heading && cat.label === "Enfant" && (
                            <button
                              type="button"
                              onClick={() => toggleMobileSubAccordion(colKey)}
                              className="flex w-full items-center justify-between py-3 pl-3 text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-dark/70 transition-colors duration-200 hover:text-primary"
                              aria-expanded={mobileSubAccordion === colKey}
                            >
                              <span>{col.heading}</span>
                              <ChevronDown
                                className={`h-3.5 w-3.5 transition-transform duration-300 ${
                                  mobileSubAccordion === colKey
                                    ? "rotate-180"
                                    : ""
                                }`}
                                strokeWidth={2}
                              />
                            </button>
                          )}

                          <div
                            className={`overflow-hidden transition-all duration-300 ease-out ${
                              cat.label === "Enfant"
                                ? mobileSubAccordion === colKey
                                  ? "max-h-[1400px] opacity-100"
                                  : "max-h-0 opacity-0"
                                : "max-h-[1400px] opacity-100"
                            }`}
                          >
                            {col.subcategories.map((sub) => (
                              <div key={sub.title} className="mb-3 pl-3">
                                <h4 className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-dark/50">
                                  {sub.title}
                                </h4>
                                <ul className="space-y-1">
                                  {sub.items.map((item) => (
                                    <li key={item}>
                                      <Link
                                        href={`${cat.href}/${toSlug(item)}`}
                                        onClick={() => setMobileOpen(false)}
                                        className="block py-1.5 pl-2 text-[0.82rem] text-dark/75 transition-all duration-200 hover:text-primary hover:translate-x-1"
                                      >
                                        {item}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile actions */}
            <div className="border-t border-dark/10 px-6 py-6 space-y-3">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-full border border-dark/20 py-3 text-[0.82rem] font-medium tracking-wide text-dark transition-all duration-200 hover:border-primary hover:text-primary"
              >
                <User className="h-4 w-4" strokeWidth={1.8} />
                <span>Se connecter</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
