import type { Metadata } from "next";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import SubSlugPageClient from "./SubSlugPageClient";
import JsonLd, {
  productJsonLd,
  breadcrumbJsonLd,
} from "../../component/shared/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kinyn.tn";

interface PageProps {
  params: Promise<{ slug: string; subslug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug, subslug } = await params;

  try {
    await connectDB();

    const product = await Product.findOne({ slug: subslug, status: "active" })
      .select("name slug description price promoPrice images categoryMere")
      .populate("categoryMere", "name slug")
      .lean<{
        name: string;
        slug: string;
        description: string;
        price: number;
        promoPrice: number | null;
        images: { url: string }[];
        categoryMere: { name: string; slug: string } | null;
      }>();

    if (product) {
      const price = product.promoPrice ?? product.price;
      const image = product.images?.[0]?.url
        ? `${SITE_URL}${product.images[0].url}`
        : undefined;
      const catName = product.categoryMere?.name ?? "";
      const title = product.name;
      const description =
        product.description?.slice(0, 160) ||
        `Achetez ${product.name} chez KINYN. ${catName}, livraison rapide en Tunisie. ${price.toFixed(2)} TND.`;

      return {
        title,
        description,
        alternates: { canonical: `${SITE_URL}/${slug}/${product.slug}` },
        openGraph: {
          title,
          description,
          url: `${SITE_URL}/${slug}/${product.slug}`,
          type: "website",
          ...(image && {
            images: [
              { url: image, width: 800, height: 800, alt: product.name },
            ],
          }),
        },
      };
    }

    const category = await Category.findOne({
      slug: subslug,
      level: "finale",
      status: "active",
    })
      .select("name slug parent")
      .populate("parent", "name slug")
      .lean<{
        name: string;
        slug: string;
        parent: { name: string; slug: string } | null;
      }>();

    if (category) {
      const parentName = category.parent?.name ?? "";
      const title = `${category.name} \u2014 ${parentName}`;
      const description = `Notre s\u00e9lection ${category.name} chez KINYN. V\u00eatements \u00e9l\u00e9gants et qualit\u00e9 premium, livraison rapide en Tunisie.`;

      return {
        title,
        description,
        alternates: { canonical: `${SITE_URL}/${slug}/${category.slug}` },
        openGraph: {
          title,
          description,
          url: `${SITE_URL}/${slug}/${category.slug}`,
          type: "website",
        },
      };
    }

    return { title: "Page introuvable" };
  } catch {
    return { title: "Produit" };
  }
}

export default async function SubSlugPage({ params }: PageProps) {
  const { slug, subslug } = await params;

  let jsonLdData: Record<string, unknown> | null = null;

  try {
    await connectDB();
    const product = await Product.findOne({ slug: subslug, status: "active" })
      .select(
        "name slug description price promoPrice sku sizeStock images categoryMere",
      )
      .populate("categoryMere", "name slug")
      .lean<{
        name: string;
        slug: string;
        description: string;
        price: number;
        promoPrice: number | null;
        sku: string;
        sizeStock: { size: string; stock: number }[];
        images: { url: string }[];
        categoryMere: { name: string; slug: string } | null;
      }>();

    if (product) {
      const totalStock =
        product.sizeStock?.reduce((s, e) => s + e.stock, 0) ?? 0;
      const image = product.images?.[0]?.url
        ? `${SITE_URL}${product.images[0].url}`
        : undefined;

      jsonLdData = productJsonLd({
        name: product.name,
        description: product.description || `${product.name} - KINYN`,
        url: `${SITE_URL}/${slug}/${product.slug}`,
        image,
        price: product.promoPrice ?? product.price,
        sku: product.sku,
        inStock: totalStock > 0,
      });
    }
  } catch {
    /* silent */
  }

  return (
    <>
      {jsonLdData && <JsonLd data={jsonLdData} />}
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Accueil", url: SITE_URL },
          { name: slug, url: `${SITE_URL}/${slug}` },
          { name: subslug, url: `${SITE_URL}/${slug}/${subslug}` },
        ])}
      />
      <SubSlugPageClient />
    </>
  );
}
