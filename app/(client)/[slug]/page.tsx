import type { Metadata } from "next";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import CategoryPageClient from "./CategoryPageClient";
import JsonLd, { breadcrumbJsonLd } from "../component/shared/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kinyn.tn";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    await connectDB();
    const cat = await Category.findOne({
      slug,
      level: "mere",
      status: "active",
    })
      .select("name slug")
      .lean<{ name: string; slug: string }>();

    if (!cat) return { title: "Catégorie introuvable" };

    const title = `${cat.name} — Mode ${cat.name} en Tunisie`;
    const description = `Découvrez notre collection ${cat.name} chez KINYN. Vêtements élégants, qualité premium et livraison rapide partout en Tunisie.`;

    return {
      title,
      description,
      alternates: { canonical: `${SITE_URL}/${cat.slug}` },
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/${cat.slug}`,
        type: "website",
      },
    };
  } catch {
    return { title: "Catégorie" };
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", url: SITE_URL },
          { name: slug, url: `${SITE_URL}/${slug}` },
        ])}
      />
      <CategoryPageClient />
    </>
  );
}
