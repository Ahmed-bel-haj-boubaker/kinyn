"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import UserDropdown from "./UserDropdown";

/* ─────────────────────── Navigation Data ─────────────────────── */

interface SubCategory {
  label: string;
  href: string;
}

interface Category {
  label: string;
  items: SubCategory[];
}

interface ChildGroup {
  label: string;
  categories: Category[];
}

interface NavLink {
  label: string;
  href: string;
  categories?: Category[];
  childGroups?: ChildGroup[];
}

const femmeCategories: Category[] = [
  {
    label: "Hauts",
    items: [
      { label: "T-shirt", href: "/femme/t-shirt" },
      { label: "Chemise", href: "/femme/chemise" },
      { label: "Blouse", href: "/femme/blouse" },
      { label: "Pull / Sweater", href: "/femme/pull-sweater" },
      { label: "Sweat à capuche", href: "/femme/sweat-a-capuche-hoodie" },
      { label: "Gilet", href: "/femme/gilet" },
      { label: "Débardeur", href: "/femme/debardeur" },
      { label: "Polo", href: "/femme/polo" },
      { label: "Veste légère", href: "/femme/veste-legere" },
      { label: "Manteau / Parka", href: "/femme/manteau-parka" },
    ],
  },
  {
    label: "Bas",
    items: [
      { label: "Pantalon", href: "/femme/pantalon" },
      { label: "Jean", href: "/femme/jean" },
      { label: "Short", href: "/femme/short" },
      { label: "Jupe", href: "/femme/jupe" },
      { label: "Legging", href: "/femme/legging" },
      { label: "Chino", href: "/femme/chino" },
      { label: "Pantalon de jogging", href: "/femme/pantalon-de-jogging" },
    ],
  },
  {
    label: "Robes",
    items: [
      { label: "Robe courte", href: "/femme/robe-courte" },
      { label: "Robe longue", href: "/femme/robe-longue" },
      { label: "Robe de soirée", href: "/femme/robe-de-soiree" },
      { label: "Robe de cocktail", href: "/femme/robe-de-cocktail" },
    ],
  },
];

const enfantChildGroups: ChildGroup[] = [
  {
    label: "Bébé Fille",
    categories: [
      {
        label: "Hauts",
        items: [
          { label: "T-shirt", href: "/enfant/t-shirt" },
          { label: "Pull / Sweater", href: "/enfant/pull-sweater" },
          { label: "Sweat à capuche", href: "/enfant/sweat-a-capuche" },
          { label: "Gilet", href: "/enfant/gilet" },
        ],
      },
      {
        label: "Bas",
        items: [
          { label: "Pantalon", href: "/enfant/pantalon" },
          { label: "Legging", href: "/enfant/legging" },
          { label: "Jean", href: "/enfant/jean" },
          { label: "Short", href: "/enfant/short" },
        ],
      },
      {
        label: "Robes",
        items: [
          { label: "Robe courte", href: "/enfant/robe-courte" },
          { label: "Robe longue", href: "/enfant/robe-longue" },
        ],
      },
    ],
  },
  {
    label: "Bébé Garçon",
    categories: [
      {
        label: "Hauts",
        items: [
          { label: "T-shirt", href: "/enfant/t-shirt" },
          { label: "Pull / Sweater", href: "/enfant/pull-sweater" },
          { label: "Sweat à capuche", href: "/enfant/sweat-a-capuche" },
          { label: "Gilet", href: "/enfant/gilet" },
        ],
      },
      {
        label: "Bas",
        items: [
          { label: "Pantalon", href: "/enfant/pantalon" },
          { label: "Jean", href: "/enfant/jean" },
          { label: "Short", href: "/enfant/short" },
          { label: "Pantalon de jogging", href: "/enfant/pantalon-de-jogging" },
        ],
      },
    ],
  },
  {
    label: "Fille",
    categories: [
      {
        label: "Hauts",
        items: [
          { label: "T-shirt", href: "/enfant/t-shirt" },
          { label: "Chemise", href: "/enfant/chemise" },
          { label: "Blouse", href: "/enfant/blouse" },
          { label: "Pull / Sweater", href: "/enfant/pull-sweater" },
          { label: "Sweat à capuche", href: "/enfant/sweat-a-capuche" },
          { label: "Gilet", href: "/enfant/gilet" },
          { label: "Débardeur", href: "/enfant/debardeur" },
          { label: "Veste légère", href: "/enfant/veste-legere" },
          { label: "Manteau / Parka", href: "/enfant/manteau-parka" },
        ],
      },
      {
        label: "Bas",
        items: [
          { label: "Pantalon", href: "/enfant/pantalon" },
          { label: "Jean", href: "/enfant/jean" },
          { label: "Short", href: "/enfant/short" },
          { label: "Jupe", href: "/enfant/jupe" },
          { label: "Legging", href: "/enfant/legging" },
          { label: "Chino", href: "/enfant/chino" },
          { label: "Pantalon de jogging", href: "/enfant/pantalon-de-jogging" },
        ],
      },
      {
        label: "Robes",
        items: [
          { label: "Robe courte", href: "/enfant/robe-courte" },
          { label: "Robe longue", href: "/enfant/robe-longue" },
          { label: "Robe de soirée", href: "/enfant/robe-de-soiree" },
        ],
      },
    ],
  },
  {
    label: "Garçon",
    categories: [
      {
        label: "Hauts",
        items: [
          { label: "T-shirt", href: "/enfant/t-shirt" },
          { label: "Chemise", href: "/enfant/chemise" },
          { label: "Pull / Sweater", href: "/enfant/pull-sweater" },
          { label: "Sweat à capuche", href: "/enfant/sweat-a-capuche" },
          { label: "Gilet", href: "/enfant/gilet" },
          { label: "Débardeur", href: "/enfant/debardeur" },
          { label: "Polo", href: "/enfant/polo" },
          { label: "Veste légère", href: "/enfant/veste-legere" },
          { label: "Manteau / Parka", href: "/enfant/manteau-parka" },
        ],
      },
      {
        label: "Bas",
        items: [
          { label: "Pantalon", href: "/enfant/pantalon" },
          { label: "Jean", href: "/enfant/jean" },
          { label: "Short", href: "/enfant/short" },
          { label: "Chino", href: "/enfant/chino" },
          { label: "Pantalon de jogging", href: "/enfant/pantalon-de-jogging" },
        ],
      },
    ],
  },
];

const navLinks: NavLink[] = [
  { label: "Accueil", href: "/" },
  { label: "Femme", href: "/femme", categories: femmeCategories },
  { label: "Enfant", href: "/enfant", childGroups: enfantChildGroups },
  { label: "À propos de nous", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/* ─────────────────────── Props ─────────────────────── */

interface NavbarProps {
  onCartClick: () => void;
  onSearchClick: () => void;
}

/* ─────────────────────── Component ─────────────────────── */

export default function Navbar({ onCartClick, onSearchClick }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDesktop, setActiveDesktop] = useState<string | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const [expandedMobileChild, setExpandedMobileChild] = useState<string | null>(
    null,
  );
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    !!(link.categories || link.childGroups);

  /* ─────── Render flat mega menu (Femme) ─────── */
  const renderFlatMega = (categories: Category[]) => (
    <div className="grid grid-cols-3 gap-12 px-10 py-8">
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

  /* ─────── Render grouped mega menu (Enfant) ─────── */
  const renderGroupedMega = (groups: ChildGroup[]) => (
    <div className="flex gap-0 divide-x divide-[#EEECE7] px-2 py-8">
      {groups.map((group) => (
        <div key={group.label} className="flex-1 px-8 first:pl-10 last:pr-10">
          <h3 className="font-poppins text-[11.5px] font-bold uppercase tracking-[0.12em] text-[#2C2C2C] mb-5 pb-2 border-b border-[#E8E6E1]">
            {group.label}
          </h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            {group.categories.map((cat) => (
              <div key={cat.label}>
                <h4 className="font-poppins text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#888] mb-2.5">
                  {cat.label}
                </h4>
                <ul className="flex flex-col gap-1.5">
                  {cat.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setActiveDesktop(null)}
                        className="font-poppins text-[12px] text-[#555] transition-colors duration-200 hover:text-[#111]"
                      >
                        {item.label}
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
  );

  /* ─────── Mobile accordion helpers ─────── */
  const toggleMobileSection = (label: string) => {
    setExpandedMobile((prev) => (prev === label ? null : label));
    setExpandedMobileChild(null);
  };

  const toggleMobileChild = (label: string) => {
    setExpandedMobileChild((prev) => (prev === label ? null : label));
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
              width={80}
              height={80}
              className="object-contain w-20 h-20"
              priority
            />
          </Link>
        </div>

        {/* Mobile spacer — pushes icons to the right */}
        <div className="flex-1 lg:hidden" />

        {/* ─── Icon cluster — far right ─── */}
        <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
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
          <UserDropdown />
          <button
            type="button"
            onClick={onCartClick}
            aria-label="Shopping bag"
            className="cursor-pointer text-[#2C2C2C] transition-colors duration-200 hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-2 rounded-sm"
          >
            <ShoppingBag
              className="h-4 w-4 sm:h-[18px] sm:w-[18px]"
              strokeWidth={1.4}
            />
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
                {link.childGroups && renderGroupedMega(link.childGroups)}
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
            width={110}
            height={110}
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

                {/* Femme-style flat accordion */}
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

                {/* Enfant-style grouped accordion */}
                {link.childGroups && expandedMobile === link.label && (
                  <div className="pb-4 pl-2">
                    {link.childGroups.map((group) => (
                      <div key={group.label} className="mb-1">
                        <button
                          type="button"
                          onClick={() => toggleMobileChild(group.label)}
                          className="flex w-full items-center justify-between py-2.5 font-poppins text-[12px] font-semibold uppercase tracking-[0.08em] text-[#2C2C2C]/80 transition-colors duration-200 hover:text-[#111]"
                        >
                          <span>{group.label}</span>
                          <ChevronDown
                            className={`h-3.5 w-3.5 text-[#2C2C2C]/30 transition-transform duration-200 ${
                              expandedMobileChild === group.label
                                ? "rotate-180"
                                : ""
                            }`}
                            strokeWidth={1.8}
                          />
                        </button>

                        {expandedMobileChild === group.label && (
                          <div className="pb-3 pl-3">
                            {group.categories.map((cat) => (
                              <div key={cat.label} className="mb-3 last:mb-0">
                                <h4 className="font-poppins text-[10px] font-semibold uppercase tracking-[0.12em] text-[#999] mb-1.5">
                                  {cat.label}
                                </h4>
                                <ul className="flex flex-col gap-1 pl-1.5">
                                  {cat.items.map((item) => (
                                    <li key={item.href}>
                                      <Link
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="font-poppins text-[12px] text-[#555] transition-colors duration-200 hover:text-[#111]"
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
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Login button at bottom */}
        <div className="border-t border-[#E8E6E1] px-5 sm:px-7 py-4 sm:py-5">
          <Link
            href="/auth/sign-in"
            onClick={() => setMobileMenuOpen(false)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-poppins text-[13px] font-medium text-white transition-all duration-200 hover:bg-primary/90"
          >
            <span>Se Connecter</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
