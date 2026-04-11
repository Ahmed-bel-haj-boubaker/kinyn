import type { Metadata } from "next";
import connectDB from "@/lib/mongodb";
import Collection from "@/models/Collection";
import CollectionPageClient from "./CollectionPageClient";

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
    const col = await Collection.findOne({ slug, status: "active" })
      .select("name slug description image")
      .lean<{
        name: string;
        slug: string;
        description: string;
        image: string;
      }>();

    if (!col) return { title: "Collection introuvable" };

    const title = `${col.name} — Collection`;
    const description =
      col.description?.slice(0, 160) ||
      `Découvrez la collection ${col.name} chez KINYN. Pièces sélectionnées, qualité premium, livraison rapide en Tunisie.`;

    return {
      title,
      description,
      alternates: { canonical: `${SITE_URL}/collections/${col.slug}` },
      openGraph: {
        title,
        description,
        url: `${SITE_URL}/collections/${col.slug}`,
        type: "website",
        ...(col.image && {
          images: [
            {
              url: `${SITE_URL}${col.image}`,
              width: 1200,
              height: 630,
              alt: col.name,
            },
          ],
        }),
      },
    };
  } catch {
    return { title: "Collection" };
  }
}

export default function CollectionPage() {
  return <CollectionPageClient />;
}
