"use client";

import { useParams, notFound } from "next/navigation";
import { useState } from "react";

import { getCategoryBySlug, generateProducts } from "@/lib/categories";
import ProductsListing from "../component/shared/ProductsListing";

/* ──────────────────────────── Component ──────────────────────────── */

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const label = category.label;
  const description = category.description;

  /* Generate products once — all subcategories for this parent. */
  const [products] = useState(() => generateProducts(slug));

  return (
    <ProductsListing
      categorySlug={slug}
      title={label}
      subtitle={description}
      breadcrumbs={[{ label: "Accueil", href: "/" }, { label: label }]}
      subcategories={category.subcategories}
      products={products}
    />
  );
}
