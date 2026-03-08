"use client";

import { useParams, notFound } from "next/navigation";
import { useEffect, useState } from "react";

import ProductsListing from "../component/shared/ProductsListing";
import type {
  ClientProduct,
  ClientSubCategory,
} from "../component/shared/ProductsListing";

/* ──────────────────────────── Types ──────────────────────────── */

interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  subcategories: ClientSubCategory[];
}

/* ──────────────────────────── Component ──────────────────────────── */

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [category, setCategory] = useState<ApiCategory | null>(null);
  const [products, setProducts] = useState<ClientProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch(`/api/categories/${slug}`),
          fetch(`/api/products?mere=${slug}`),
        ]);

        if (!catRes.ok) {
          if (!cancelled) setNotFoundFlag(true);
          return;
        }

        const catData = await catRes.json();
        const prodData = await prodRes.json();

        if (!cancelled) {
          setCategory(catData.category);
          setProducts(prodData.products ?? []);
        }
      } catch {
        if (!cancelled) setNotFoundFlag(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (notFoundFlag) {
    notFound();
  }

  if (loading || !category) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <ProductsListing
      categorySlug={slug}
      title={category.name}
      subtitle=""
      breadcrumbs={[{ label: "Accueil", href: "/" }, { label: category.name }]}
      subcategories={category.subcategories}
      products={products}
    />
  );
}
