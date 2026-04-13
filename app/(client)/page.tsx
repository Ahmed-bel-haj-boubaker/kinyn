import HeroSection from "./component/home/HeroSection";
import ProductSlider from "./component/home/ProductSlider";
import FeaturedCollection from "./component/home/FeaturedCollection";
import Newsletter from "./component/home/Newsletter";
import KinynSection from "./component/home/KinynSection";
import LogoMarquee from "./component/home/LogoMarquee";
import ContactSection from "./component/home/ContactSection";
import connectDB from "@/lib/mongodb";
import Collection from "@/models/Collection";

import JsonLd, {
  organizationJsonLd,
  webSiteJsonLd,
} from "./component/shared/JsonLd";

interface LeanCollection {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  products: string[];
}

async function getCollections() {
  try {
    await connectDB();
    const collections = await Collection.find({ status: "active" })
      .select("name slug description image products order")
      .sort({ order: 1, createdAt: -1 })
      .lean<LeanCollection[]>();

    return collections.slice(0, 3).map((c) => ({
      id: String(c._id),
      title: c.name,
      description: c.description,
      image: c.image,
      href: `/collections/${c.slug}`,
    }));
  } catch {
    return [];
  }
}

export default async function Page() {
  const collections = await getCollections();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kinyn.tn";

  return (
    <>
      <JsonLd data={organizationJsonLd(siteUrl)} />
      <JsonLd data={webSiteJsonLd(siteUrl)} />
      <HeroSection />
      <LogoMarquee />
      <ProductSlider />
      <FeaturedCollection initialCollections={collections} />

      <KinynSection />

      <Newsletter />
      <ContactSection />
    </>
  );
}
