"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import ProductsListing from "../../component/shared/ProductsListing";
import type { ClientProduct } from "../../component/shared/ProductsListing";

interface CollectionData {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  products: ClientProduct[];
}

export default function CollectionPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const res = await fetch(`/api/collections/${slug}`);
        if (res.status === 404) {
          if (!cancelled) setNotFoundFlag(true);
          return;
        }
        if (!res.ok) throw new Error("fetch error");
        const data = await res.json();
        if (!cancelled && data.collection) {
          setCollection(data.collection);
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

  if (notFoundFlag) return notFound();

  if (loading || !collection) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <ProductsListing
      categorySlug="collections"
      title={collection.name}
      subtitle={collection.description}
      breadcrumbs={[
        { label: "Accueil", href: "/" },
        { label: collection.name },
      ]}
      subcategories={[]}
      products={collection.products}
    />
  );
}
