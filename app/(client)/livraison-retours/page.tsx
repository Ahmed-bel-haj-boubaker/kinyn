import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Livraison & Retours",
  description:
    "Tout savoir sur la livraison en Tunisie et notre politique de retours et d'échanges chez KINYN.",
  alternates: { canonical: "https://kinyn.tn/livraison-retours" },
  openGraph: {
    title: "Livraison & Retours — KINYN",
    description:
      "Délais, frais de port, zones de livraison et conditions de retour chez KINYN Tunisie.",
    url: "https://kinyn.tn/livraison-retours",
    type: "website",
  },
};

export default function LivraisonRetoursPage() {
  return (
    <>
      {/* ════════ 1. Hero ════════ */}
      <section className="relative w-full overflow-hidden bg-dark">
        <div className="relative h-[55vh] min-h-96 sm:h-[60vh] md:h-[65vh]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,_rgba(122,12,28,0.25)_0%,_transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,_rgba(122,12,28,0.12)_0%,_transparent_55%)]" />
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/[0.03]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/[0.04]" />
          </div>
          <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
            <div className="max-w-2xl space-y-5">
              <p className="font-poppins text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-primary/80">
                Information client
              </p>
              <h1 className="font-erotique text-4xl leading-tight text-background sm:text-5xl md:text-6xl lg:text-7xl">
                Livraison &amp; Retours
              </h1>
              <p className="mx-auto max-w-md font-poppins text-[0.9rem] leading-relaxed text-background/50">
                Tout ce que vous devez savoir sur la livraison en Tunisie et
                notre politique de retours.
              </p>
              <span className="block mx-auto w-12 h-px bg-primary/60" />
            </div>
          </div>
        </div>
      </section>

      {/* ════════ 2. Content ════════ */}
      <section className="bg-background py-20 md:py-28 px-4 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl space-y-20">
          {/* ── Livraison ── */}
          <div>
            <div className="mb-8 pb-4 border-b border-dark/8">
              <span className="font-poppins text-[0.68rem] font-semibold uppercase tracking-[0.25em] text-primary">
                Expédition
              </span>
              <h2 className="mt-2 font-erotique text-2xl text-dark sm:text-3xl">
                Livraison en Tunisie
              </h2>
            </div>
            <div className="space-y-5 font-poppins text-[0.88rem] leading-[1.9] text-dark/60">
              <p>
                Nous livrons sur l&apos;ensemble du territoire tunisien, du
                Grand Tunis aux gouvernorats les plus éloignés, via nos
                partenaires transporteurs agréés.
              </p>
              <p>
                Pour les gouvernorats du{" "}
                <span className="font-semibold text-dark">Grand Tunis</span>{" "}
                (Tunis, Ariana, Ben Arous, Manouba), comptez{" "}
                <span className="font-semibold text-dark">
                  1 à 2 jours ouvrables
                </span>
                . Pour le reste du pays, la livraison est effectuée sous{" "}
                <span className="font-semibold text-dark">
                  2 à 4 jours ouvrables
                </span>{" "}
                après confirmation de commande. Ces délais s&apos;entendent hors
                week-ends et jours fériés.
              </p>
              <p>
                Les frais de port sont de{" "}
                <span className="font-semibold text-dark">8 TND</span> pour tout
                le territoire national. La livraison est offerte pour toute
                commande dépassant{" "}
                <span className="font-semibold text-dark">200 TND</span>.
              </p>
              <p>
                Une option{" "}
                <span className="font-semibold text-dark">
                  express sous 24h
                </span>{" "}
                est disponible pour le Grand Tunis, sous réserve de
                disponibilité et pour les commandes passées avant 12h00. Les
                frais express sont indiqués au moment du passage en caisse.
              </p>
              <p>
                Dès l&apos;expédition de votre colis, vous recevrez un e-mail
                contenant votre numéro de suivi. Vous pouvez également consulter
                l&apos;état de vos commandes depuis votre{" "}
                <Link
                  href="/profile?tab=orders"
                  className="text-primary underline underline-offset-2 hover:text-primary/70 transition-colors"
                >
                  espace personnel
                </Link>
                .
              </p>
              <p>
                En cas d&apos;absence lors de la livraison, le livreur tentera
                une seconde livraison le jour ouvrable suivant. Si la livraison
                échoue à nouveau, votre colis sera conservé au dépôt pendant{" "}
                <span className="font-semibold text-dark">5 jours</span> avant
                d&apos;être retourné à notre entrepôt. Notre équipe vous
                contactera alors pour reprogrammer la livraison.
              </p>
            </div>
          </div>

          {/* ── Retours ── */}
          <div>
            <div className="mb-8 pb-4 border-b border-dark/8">
              <span className="font-poppins text-[0.68rem] font-semibold uppercase tracking-[0.25em] text-primary">
                Retours
              </span>
              <h2 className="mt-2 font-erotique text-2xl text-dark sm:text-3xl">
                Retours &amp; Échanges
              </h2>
            </div>
            <div className="space-y-5 font-poppins text-[0.88rem] leading-[1.9] text-dark/60">
              <p>
                Vous disposez de{" "}
                <span className="font-semibold text-dark">14 jours</span> à
                compter de la date de réception pour retourner ou échanger tout
                article. Passé ce délai, aucun retour ne pourra être accepté.
              </p>
              <p>
                Pour être accepté, l&apos;article retourné doit être non porté,
                non lavé et non modifié, avec ses étiquettes d&apos;origine
                intactes et son emballage d&apos;origine ou équivalent. Il doit
                être accompagné de la référence ou du bon de commande.
              </p>
              <p>
                Pour initier un retour, contactez notre service client via la
                page{" "}
                <Link
                  href="/contact"
                  className="text-primary underline underline-offset-2 hover:text-primary/70 transition-colors"
                >
                  contact
                </Link>{" "}
                en indiquant votre numéro de commande et le(s) article(s)
                concerné(s). Nous vous transmettrons les instructions sous 24h
                ouvrables.
              </p>
              <p>
                Les frais de retour sont à la charge du client. Ils sont
                toutefois pris en charge par KINYN en cas d&apos;
                <span className="font-semibold text-dark">
                  article défectueux, endommagé ou d&apos;erreur de notre part
                </span>{" "}
                (mauvaise taille ou référence expédiée).
              </p>
              <p>
                Les échanges de taille sont traités dans la limite des stocks
                disponibles. Si la taille souhaitée n&apos;est plus disponible,
                un avoir ou un remboursement vous sera proposé. Le traitement
                prend{" "}
                <span className="font-semibold text-dark">
                  3 à 5 jours ouvrables
                </span>{" "}
                suivant la réception de l&apos;article retourné.
              </p>
              <p>
                Une fois le retour reçu et validé, le remboursement est effectué
                sous{" "}
                <span className="font-semibold text-dark">
                  5 à 7 jours ouvrables
                </span>
                , sur le même moyen de paiement utilisé lors de la commande.
              </p>

              {/* Non-returnable */}
              <div className="rounded-xl border border-dark/5 bg-white px-6 py-5 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
                <p className="font-poppins text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-dark mb-3">
                  Articles non retournables
                </p>
                <ul className="space-y-2">
                  {[
                    "Articles portés, lavés ou altérés",
                    "Pièces en promotion ou soldées (sauf défaut avéré)",
                    "Articles personnalisés ou sur-mesure",
                    "Articles retournés sans leurs étiquettes d'origine",
                  ].map((txt) => (
                    <li
                      key={txt}
                      className="flex items-start gap-2.5 font-poppins text-[0.84rem] text-dark/60"
                    >
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      {txt}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ── Paiement ── */}
          <div>
            <div className="mb-8 pb-4 border-b border-dark/8">
              <span className="font-poppins text-[0.68rem] font-semibold uppercase tracking-[0.25em] text-primary">
                Paiement
              </span>
              <h2 className="mt-2 font-erotique text-2xl text-dark sm:text-3xl">
                Mode de Paiement
              </h2>
            </div>
            <div className="space-y-5 font-poppins text-[0.88rem] leading-[1.9] text-dark/60">
              <p>
                Nous proposons exclusivement le{" "}
                <span className="font-semibold text-dark">
                  paiement à la livraison
                </span>
                , en espèces, disponible partout en Tunisie. Aucun paiement
                n&apos;est requis à la commande — vous réglez uniquement au
                moment de la réception de votre colis.
              </p>
              <p>
                Votre commande est confirmée par e-mail ou SMS sous quelques
                heures ouvrables après sa validation. Notre équipe peut
                également vous rappeler pour finaliser la confirmation si
                nécessaire.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ 3. Dark quote strip ════════ */}
      <section className="bg-dark px-6 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-erotique text-xl leading-snug text-background/80 sm:text-2xl md:text-3xl">
            &ldquo;Chaque commande est une promesse que nous tenons.&rdquo;
          </p>
          <cite className="mt-6 block font-poppins text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-background/35 not-italic">
            — La Maison Kinyn
          </cite>
        </div>
      </section>

      {/* ════════ 4. CTA ════════ */}
      <section className="bg-background px-6 py-20 md:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-10 md:grid-cols-2 md:gap-8">
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
                Une question ?
              </h3>
              <p className="mt-3 font-poppins text-[0.83rem] leading-relaxed text-dark/50">
                Notre équipe est disponible du lundi au samedi de 9h à 18h pour
                répondre à toutes vos demandes concernant vos commandes.
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
                  <path d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="font-erotique text-xl text-dark sm:text-2xl">
                Questions fréquentes
              </h3>
              <p className="mt-3 font-poppins text-[0.83rem] leading-relaxed text-dark/50">
                Consultez notre FAQ pour des réponses rapides sur les tailles,
                les matières et bien plus encore.
              </p>
              <Link
                href="/faq"
                className="mt-6 inline-flex items-center gap-2 font-poppins text-[0.82rem] font-semibold tracking-wide text-primary transition-all duration-200 hover:gap-3"
              >
                Voir la FAQ
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
