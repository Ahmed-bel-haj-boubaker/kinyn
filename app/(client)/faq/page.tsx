import Link from "next/link";
import { getPublishedFAQs } from "@/lib/services/faq.service";
import FAQAccordion from "../component/faq/FAQAccordion";

/* ──────────── Fallback data (shown if DB returns nothing) ──────────── */

const FALLBACK_FAQS = [
  {
    question: "Quels sont les délais de livraison ?",
    answer:
      "La livraison standard en Tunisie est effectuée sous 2 à 5 jours ouvrables. Pour les commandes internationales, comptez entre 7 et 14 jours selon la destination. Vous recevrez un numéro de suivi dès l'expédition de votre colis.",
    category: "Livraison",
  },
  {
    question: "Puis-je retourner ou échanger un article ?",
    answer:
      "Bien sûr. Vous disposez de 14 jours après réception pour retourner ou échanger tout article non porté, dans son emballage d'origine et avec ses étiquettes. Les frais de retour sont à la charge du client, sauf en cas de défaut ou d'erreur de notre part.",
    category: "Retours",
  },
  {
    question: "Les matières utilisées sont-elles de qualité ?",
    answer:
      "Absolument. Kinyn sélectionne rigoureusement ses matières premières : coton peigné, lin européen, viscose certifiée et cuir véritable. Chaque tissu est choisi pour sa durabilité, son confort et son rendu esthétique, reflétant notre engagement envers l'excellence.",
    category: "Produits",
  },
  {
    question: "Proposez-vous la livraison gratuite ?",
    answer:
      "Oui, la livraison est offerte pour toute commande supérieure à 200 TND en Tunisie. Pour les commandes internationales, les frais de port sont calculés selon le poids et la destination lors du passage en caisse.",
    category: "Livraison",
  },
  {
    question: "Comment entretenir mes vêtements Kinyn ?",
    answer:
      "Pour préserver la qualité de vos pièces Kinyn, nous recommandons un lavage à 30°C, un séchage à plat et un repassage à température modérée. Les instructions d'entretien spécifiques sont indiquées sur l'étiquette de chaque vêtement.",
    category: "Produits",
  },
  {
    question: "Puis-je passer une commande par téléphone ?",
    answer:
      "Oui, notre service client est disponible du lundi au samedi de 9h à 18h pour vous accompagner dans votre commande. Vous pouvez nous joindre par téléphone, WhatsApp ou e-mail. Nous serons ravis de vous assister.",
    category: "Service client",
  },
];

/* ──────────── Page (Server Component) ──────────── */

export default async function FAQPage() {
  const result = await getPublishedFAQs();
  const allFaqs =
    result.success && result.data && result.data.length > 0
      ? result.data.map((f) => ({
          question: f.question,
          answer: f.answer,
          category: f.category,
        }))
      : FALLBACK_FAQS;

  /* Group by category */
  const grouped = allFaqs.reduce<Record<string, typeof allFaqs>>(
    (acc, faq) => {
      const key = faq.category || "Général";
      if (!acc[key]) acc[key] = [];
      acc[key].push(faq);
      return acc;
    },
    {},
  );

  const categories = Object.keys(grouped);
  const hasMultipleCategories = categories.length > 1;

  return (
    <>
      {/* ════════ 1. Hero ════════ */}
      <section className="relative w-full overflow-hidden bg-dark">
        <div className="relative h-[55vh] min-h-96 sm:h-[60vh] md:h-[65vh]">
          {/* background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,_rgba(122,12,28,0.25)_0%,_transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,_rgba(122,12,28,0.12)_0%,_transparent_55%)]" />

          {/* decorative lines */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/[0.03]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/[0.04]" />
          </div>

          <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
            <div className="max-w-2xl space-y-5">
              <p className="font-poppins text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-primary/80">
                Aide &amp; Support
              </p>
              <h1 className="font-erotique text-4xl leading-tight text-background sm:text-5xl md:text-6xl lg:text-7xl">
                Questions Fréquentes
              </h1>
              <p className="mx-auto max-w-md font-poppins text-[0.9rem] leading-relaxed text-background/50">
                Tout ce que vous devez savoir avant de passer commande chez
                Kinyn.
              </p>
              <span className="block mx-auto w-12 h-px bg-primary/60" />
            </div>
          </div>
        </div>
      </section>

      {/* ════════ 2. Category nav (only if multiple categories) ════════ */}
      {hasMultipleCategories && (
        <section className="bg-white border-b border-dark/5 sticky top-0 z-30">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 overflow-x-auto">
            <div className="flex items-center gap-1 py-3 min-w-max sm:min-w-0 sm:justify-center">
              {categories.map((cat) => (
                <a
                  key={cat}
                  href={`#cat-${cat.replace(/\s+/g, "-").toLowerCase()}`}
                  className="px-4 py-1.5 rounded-full font-poppins text-xs font-medium text-dark/50 hover:text-dark hover:bg-background transition-all duration-200 whitespace-nowrap"
                >
                  {cat}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════════ 3. FAQ Content ════════ */}
      <section className="bg-background py-20 md:py-28 px-4 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl">
          {hasMultipleCategories ? (
            /* ─── Grouped by category ─── */
            <div className="space-y-16">
              {categories.map((cat) => (
                <div key={cat} id={`cat-${cat.replace(/\s+/g, "-").toLowerCase()}`}>
                  {/* Category header */}
                  <div className="mb-8 pb-4 border-b border-dark/8">
                    <span className="font-poppins text-[0.68rem] font-semibold uppercase tracking-[0.25em] text-primary">
                      {cat}
                    </span>
                    <h2 className="mt-2 font-erotique text-2xl text-dark sm:text-3xl">
                      {getCategoryTitle(cat)}
                    </h2>
                  </div>
                  <FAQAccordion faqs={grouped[cat]} />
                </div>
              ))}
            </div>
          ) : (
            /* ─── Single list (no category grouping) ─── */
            <>
              {/* Section heading */}
              <div className="text-center mb-14">
                <p className="font-poppins text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-primary">
                  Vos questions
                </p>
                <h2 className="mt-3 font-erotique text-3xl text-dark sm:text-4xl md:text-5xl">
                  Nous avons les réponses
                </h2>
                <p className="mt-4 font-poppins text-[0.88rem] leading-relaxed text-dark/50 max-w-md mx-auto">
                  Si vous ne trouvez pas ce que vous cherchez, notre équipe est
                  là pour vous.
                </p>
                <span className="block mx-auto mt-6 w-12 h-px bg-primary/40" />
              </div>
              <FAQAccordion faqs={allFaqs} />
            </>
          )}
        </div>
      </section>

      {/* ════════ 4. Dark quote strip ════════ */}
      <section className="bg-dark px-6 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-erotique text-xl leading-snug text-background/80 sm:text-2xl md:text-3xl">
            &ldquo;L&apos;excellence se cache dans chaque détail.&rdquo;
          </p>
          <cite className="mt-6 block font-poppins text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-background/35 not-italic">
            — La Maison Kinyn
          </cite>
        </div>
      </section>

      {/* ════════ 5. Still have questions ════════ */}
      <section className="bg-background px-6 py-20 md:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-10 md:grid-cols-2 md:gap-8">
            {/* Contact card */}
            <div className="group rounded-2xl border border-dark/5 bg-white px-8 py-9 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/8">
                <svg
                  className="h-5 w-5 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <h3 className="font-erotique text-xl text-dark sm:text-2xl">
                Écrivez-nous
              </h3>
              <p className="mt-3 font-poppins text-[0.83rem] leading-relaxed text-dark/50">
                Notre équipe répond sous 24h ouvrables. Décrivez votre demande
                et nous vous accompagnerons avec plaisir.
              </p>
              <Link
                href="/contact"
                className="mt-6 inline-flex items-center gap-2 font-poppins text-[0.82rem] font-semibold tracking-wide text-primary transition-all duration-200 hover:gap-3"
              >
                Nous contacter
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            {/* Shop CTA card */}
            <div className="group rounded-2xl border border-dark/5 bg-white px-8 py-9 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/8">
                <svg
                  className="h-5 w-5 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                </svg>
              </div>
              <h3 className="font-erotique text-xl text-dark sm:text-2xl">
                Découvrir la collection
              </h3>
              <p className="mt-3 font-poppins text-[0.83rem] leading-relaxed text-dark/50">
                Explorez nos pièces pensées pour sublimer chaque silhouette —
                du quotidien aux occasions les plus précieuses.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex items-center gap-2 font-poppins text-[0.82rem] font-semibold tracking-wide text-primary transition-all duration-200 hover:gap-3"
              >
                Explorer
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ──────────── Helper: human-readable category titles ──────────── */

function getCategoryTitle(category: string): string {
  const MAP: Record<string, string> = {
    Livraison: "Expédition & Délais",
    Retours: "Retours & Échanges",
    Paiement: "Paiement & Sécurité",
    Produits: "Nos Créations",
    "Service client": "Notre Équipe",
    Général: "Questions Générales",
    Commandes: "Vos Commandes",
  };
  return MAP[category] ?? category;
}
