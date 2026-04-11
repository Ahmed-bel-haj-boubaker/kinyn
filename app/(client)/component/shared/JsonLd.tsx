interface JsonLdProps {
  data: Record<string, unknown>;
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/* ── Organization schema (homepage) ── */
export function organizationJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "KINYN",
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    description:
      "Marque tunisienne de mode premium pour femme et enfant. Vêtements élégants, qualité premium, livraison rapide en Tunisie.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "TN",
    },
    sameAs: [],
  };
}

/* ── WebSite schema with search (homepage) ── */
export function webSiteJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "KINYN",
    url: siteUrl,
    inLanguage: "fr",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/* ── Product schema ── */
export function productJsonLd(opts: {
  name: string;
  description: string;
  url: string;
  image?: string;
  price: number;
  currency?: string;
  sku: string;
  inStock: boolean;
  brand?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    ...(opts.image && { image: opts.image }),
    sku: opts.sku,
    brand: {
      "@type": "Brand",
      name: opts.brand ?? "KINYN",
    },
    offers: {
      "@type": "Offer",
      price: opts.price.toFixed(2),
      priceCurrency: opts.currency ?? "TND",
      availability: opts.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: opts.url,
    },
  };
}

/* ── BreadcrumbList schema ── */
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/* ── FAQPage schema ── */
export function faqJsonLd(questions: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}
