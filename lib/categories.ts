/* ════════════════════════════════════════════════════════════════
   Single source of truth for category hierarchy, product types,
   constants, and helpers shared across the entire storefront.
   ════════════════════════════════════════════════════════════════ */

/* ──────────────────────────── Types ──────────────────────────── */

export interface SubCategory {
  title: string;
  slug: string;
  items: string[];
}

export interface CategoryData {
  label: string;
  slug: string;
  description: string;
  subcategories: SubCategory[];
}

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  subcategory: string;
  size: string[];
  color: string;
  createdAt: number;
  popularity: number;
}

/* ──────────────────────────── Helpers ──────────────────────────── */

export const slugify = (str: string): string =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/* ──────────────────────────── Constants ──────────────────────────── */

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export const COLORS: { name: string; hex: string }[] = [
  { name: "Noir", hex: "#1a1a1a" },
  { name: "Blanc", hex: "#f5f5f5" },
  { name: "Beige", hex: "#d4b896" },
  { name: "Bleu", hex: "#3b5998" },
  { name: "Rouge", hex: "#b31b21" },
  { name: "Vert", hex: "#4a7c59" },
  { name: "Rose", hex: "#d4a0a0" },
  { name: "Gris", hex: "#8e8e8e" },
];

export const SORT_OPTIONS = [
  { value: "newest", label: "Nouveautés" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "popular", label: "Popularité" },
];

/* ──────────────────────────── Category Hierarchy ──────────────────────────── */

export const CATEGORY_DATA: CategoryData[] = [
  {
    label: "Femme",
    slug: "femme",
    description:
      "Des pièces raffinées pour sublimer chaque silhouette avec élégance.",
    subcategories: [
      {
        title: "Hauts",
        slug: "hauts",
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
      {
        title: "Bas",
        slug: "bas",
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
        slug: "robes",
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
    label: "Enfant",
    slug: "enfant",
    description:
      "Des tenues confortables et stylées pour accompagner chaque aventure.",
    subcategories: [
      {
        title: "Hauts",
        slug: "hauts",
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
        slug: "bas",
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
        slug: "robes",
        items: ["Robe courte", "Robe longue", "Robe de soirée"],
      },
    ],
  },
];

/* ──────────────────────────── Lookup Helpers ──────────────────────────── */

/** Find a parent category by its slug (e.g. "femme"). */
export function getCategoryBySlug(slug: string): CategoryData | undefined {
  return CATEGORY_DATA.find((c) => c.slug === slug);
}

/** Find a subcategory within a parent (e.g. "femme" → "robes"). */
export function getSubcategoryBySlug(
  parentSlug: string,
  subSlug: string,
): SubCategory | undefined {
  const cat = getCategoryBySlug(parentSlug);
  if (!cat) return undefined;
  return cat.subcategories.find((sc) => sc.slug === subSlug);
}

/** Check whether the slug identifies a known subcategory under a parent. */
export function isSubcategorySlug(
  parentSlug: string,
  subSlug: string,
): boolean {
  return !!getSubcategoryBySlug(parentSlug, subSlug);
}

/** Result returned when an individual item is matched by slug. */
export interface ItemMatch {
  itemName: string;
  subcategory: SubCategory;
}

/**
 * Find an individual item within a parent category by its slugified name.
 * E.g. getItemBySlug("femme", "jean") → { itemName: "Jean", subcategory: <Bas> }
 */
export function getItemBySlug(
  parentSlug: string,
  itemSlug: string,
): ItemMatch | undefined {
  const cat = getCategoryBySlug(parentSlug);
  if (!cat) return undefined;

  for (const sub of cat.subcategories) {
    for (const item of sub.items) {
      if (slugify(item) === itemSlug) {
        return { itemName: item, subcategory: sub };
      }
    }
  }
  return undefined;
}

/* ──────────────────────────── Product Generation ──────────────────────────── */

const PRODUCT_IMAGES = [
  "https://images.unsplash.com/photo-1434389677669-e08b4cda3a98?w=600&q=80",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&q=80",
  "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=600&q=80",
  "https://images.unsplash.com/photo-1495385794356-15371f348c31?w=600&q=80",
  "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&q=80",
];

/**
 * Generate sample products for a category.
 * - If `subcategorySlug` is provided, only items in that subcategory are generated.
 * - If `itemName` is also provided, multiple color variants of that single item are generated.
 */
export function generateProducts(
  categorySlug: string,
  subcategorySlug?: string,
  itemName?: string,
): Product[] {
  const cat = getCategoryBySlug(categorySlug);
  if (!cat) return [];

  const subs = subcategorySlug
    ? cat.subcategories.filter((sc) => sc.slug === subcategorySlug)
    : cat.subcategories;

  const products: Product[] = [];
  let id = 1;

  subs.forEach((sub) => {
    const itemsToGenerate = itemName
      ? sub.items.filter((it) => it === itemName)
      : sub.items;

    itemsToGenerate.forEach((item, i) => {
      if (itemName) {
        /* Generate multiple color variants for a single item type */
        COLORS.forEach((c, ci) => {
          products.push({
            id: id++,
            name: `${item} ${c.name} ${cat.label}`,
            price: Math.round((29 + Math.random() * 170) * 100) / 100,
            image: PRODUCT_IMAGES[(id - 1) % PRODUCT_IMAGES.length],
            category: categorySlug,
            subcategory: sub.title,
            size: SIZES.slice(
              Math.floor(Math.random() * 2),
              2 + Math.floor(Math.random() * 4),
            ),
            color: c.name,
            createdAt: Date.now() - Math.floor(Math.random() * 30) * 86400000,
            popularity: Math.floor(Math.random() * 100),
          });
        });
      } else {
        products.push({
          id: id++,
          name: `${item} ${cat.label}`,
          price: Math.round((29 + Math.random() * 170) * 100) / 100,
          image: PRODUCT_IMAGES[(id - 1) % PRODUCT_IMAGES.length],
          category: categorySlug,
          subcategory: sub.title,
          size: SIZES.slice(
            Math.floor(Math.random() * 2),
            2 + Math.floor(Math.random() * 4),
          ),
          color: COLORS[i % COLORS.length].name,
          createdAt: Date.now() - Math.floor(Math.random() * 30) * 86400000,
          popularity: Math.floor(Math.random() * 100),
        });
      }
    });
  });

  return products;
}
