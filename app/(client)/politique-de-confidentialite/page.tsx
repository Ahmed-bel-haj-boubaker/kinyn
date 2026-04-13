import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de Confidentialité",
  description:
    "Découvrez comment KINYN collecte, utilise et protège vos données personnelles conformément à la législation tunisienne.",
  alternates: { canonical: "https://kinyn.tn/politique-de-confidentialite" },
  openGraph: {
    title: "Politique de Confidentialité — KINYN",
    description:
      "Protection des données personnelles, cookies et droits des utilisateurs chez KINYN Tunisie.",
    url: "https://kinyn.tn/politique-de-confidentialite",
    type: "website",
  },
};

export default function PolitiqueConfidentialitePage() {
  return (
    <>
      {/* ════════ 1. Hero ════════ */}
      <section className="relative w-full overflow-hidden bg-dark">
        <div className="relative h-[55vh] min-h-96 sm:h-[60vh] md:h-[65vh]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,rgba(122,12,28,0.25)_0%,transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_80%,rgba(122,12,28,0.12)_0%,transparent_55%)]" />
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full border border-white/3" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-100 h-100 rounded-full border border-white/4" />
          </div>
          <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
            <div className="max-w-2xl space-y-5">
              <p className="font-poppins text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-primary/80">
                Informations légales
              </p>
              <h1 className="font-erotique text-4xl leading-tight text-background sm:text-5xl md:text-6xl lg:text-7xl">
                Politique de Confidentialité
              </h1>
              <p className="mx-auto max-w-md font-poppins text-[0.9rem] leading-relaxed text-background/50">
                Comment nous collectons, utilisons et protégeons vos données
                personnelles.
              </p>
              <span className="block mx-auto w-12 h-px bg-primary/60" />
            </div>
          </div>
        </div>
      </section>

      {/* ════════ 2. Content ════════ */}
      <section className="bg-background py-20 md:py-28 px-4 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-3xl space-y-20">
          {/* ── Collecte des données ── */}
          <div>
            <div className="mb-8 pb-4 border-b border-dark/8">
              <span className="font-poppins text-[0.68rem] font-semibold uppercase tracking-[0.25em] text-primary">
                Données personnelles
              </span>
              <h2 className="mt-2 font-erotique text-2xl text-dark sm:text-3xl">
                Collecte des Données
              </h2>
            </div>
            <div className="space-y-5 font-poppins text-[0.88rem] leading-[1.9] text-dark/60">
              <p>
                Dans le cadre de votre utilisation du site{" "}
                <span className="font-semibold text-dark">kinyn.tn</span> et de
                nos services, nous sommes amenés à collecter certaines données
                vous concernant. Ces données sont collectées de manière loyale
                et transparente, uniquement pour des finalités déterminées et
                légitimes.
              </p>
              <p>
                Lors de la création d&apos;un compte ou du passage d&apos;une
                commande, nous collectons les informations que vous nous
                fournissez directement&nbsp;:{" "}
                <span className="font-semibold text-dark">
                  nom, prénom, adresse e-mail, numéro de téléphone et adresse de
                  livraison
                </span>
                . Ces informations sont indispensables au traitement et à la
                livraison de vos commandes.
              </p>
              <p>
                Lors de votre navigation sur notre site, nous collectons
                automatiquement certaines données techniques telles que votre
                adresse IP, le type de navigateur utilisé, les pages visitées et
                la durée de votre visite. Ces données sont utilisées uniquement
                à des fins statistiques et d&apos;amélioration de
                l&apos;expérience utilisateur.
              </p>
              <p>
                Nous ne collectons jamais de données sensibles au sens de la
                législation tunisienne sur la protection des données
                personnelles, ni de données relatives aux mineurs de moins de 18
                ans sans le consentement préalable d&apos;un parent ou tuteur
                légal.
              </p>
            </div>
          </div>

          {/* ── Utilisation des données ── */}
          <div>
            <div className="mb-8 pb-4 border-b border-dark/8">
              <span className="font-poppins text-[0.68rem] font-semibold uppercase tracking-[0.25em] text-primary">
                Finalités
              </span>
              <h2 className="mt-2 font-erotique text-2xl text-dark sm:text-3xl">
                Utilisation des Données
              </h2>
            </div>
            <div className="space-y-5 font-poppins text-[0.88rem] leading-[1.9] text-dark/60">
              <p>
                Les données collectées sont utilisées exclusivement pour les
                finalités suivantes, dans le cadre de notre relation commerciale
                avec vous.
              </p>

              <div className="rounded-xl border border-dark/5 bg-white px-6 py-5 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
                <p className="font-poppins text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-dark mb-3">
                  Finalités de traitement
                </p>
                <ul className="space-y-2">
                  {[
                    "Traitement, confirmation et livraison de vos commandes",
                    "Gestion de votre compte client et de votre historique d'achats",
                    "Envoi de notifications relatives à l'état de vos commandes",
                    "Réponse à vos demandes via notre service client",
                    "Envoi de notre newsletter (uniquement avec votre consentement)",
                    "Amélioration de nos produits, services et de l'expérience sur le site",
                    "Analyse statistique anonymisée de la navigation",
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

              <p>
                Vos données ne sont jamais utilisées à des fins de prospection
                commerciale par des tiers ni revendues à des partenaires
                publicitaires.
              </p>
            </div>
          </div>

          {/* ── Partage des données ── */}
          <div>
            <div className="mb-8 pb-4 border-b border-dark/8">
              <span className="font-poppins text-[0.68rem] font-semibold uppercase tracking-[0.25em] text-primary">
                Tiers
              </span>
              <h2 className="mt-2 font-erotique text-2xl text-dark sm:text-3xl">
                Partage des Données
              </h2>
            </div>
            <div className="space-y-5 font-poppins text-[0.88rem] leading-[1.9] text-dark/60">
              <p>
                KINYN ne vend, ne loue et ne cède jamais vos données
                personnelles à des tiers à des fins commerciales. Certaines
                données peuvent toutefois être partagées avec des prestataires
                de services dans la stricte mesure nécessaire à l&apos;exécution
                de nos obligations.
              </p>
              <p>
                Nos{" "}
                <span className="font-semibold text-dark">
                  partenaires de livraison
                </span>{" "}
                reçoivent vos nom, prénom, numéro de téléphone et adresse de
                livraison afin d&apos;assurer l&apos;acheminement de vos colis.
                Ces prestataires sont soumis à des obligations contractuelles
                strictes de confidentialité et ne peuvent utiliser vos données
                qu&apos;à cette seule fin.
              </p>
              <p>
                Dans certains cas prévus par la loi tunisienne, nous pouvons
                être tenus de communiquer vos données aux autorités compétentes
                sur réquisition judiciaire ou administrative. Dans ce cas
                uniquement, nous nous conformons à nos obligations légales.
              </p>
            </div>
          </div>

          {/* ── Cookies ── */}
          <div>
            <div className="mb-8 pb-4 border-b border-dark/8">
              <span className="font-poppins text-[0.68rem] font-semibold uppercase tracking-[0.25em] text-primary">
                Traçabilité
              </span>
              <h2 className="mt-2 font-erotique text-2xl text-dark sm:text-3xl">
                Cookies &amp; Stockage Local
              </h2>
            </div>
            <div className="space-y-5 font-poppins text-[0.88rem] leading-[1.9] text-dark/60">
              <p>
                Notre site utilise des cookies et des mécanismes de stockage
                local (localStorage) pour améliorer votre expérience de
                navigation et assurer le bon fonctionnement de certaines
                fonctionnalités.
              </p>
              <p>
                Les{" "}
                <span className="font-semibold text-dark">
                  cookies essentiels
                </span>{" "}
                sont indispensables au fonctionnement du site&nbsp;: gestion de
                votre session, maintien de votre panier d&apos;achat et de votre
                liste de souhaits. Ils ne peuvent pas être désactivés sans
                impacter l&apos;utilisation normale du site.
              </p>
              <p>
                Les{" "}
                <span className="font-semibold text-dark">
                  cookies analytiques
                </span>{" "}
                nous permettent de comprendre comment les visiteurs utilisent
                notre site afin d&apos;en améliorer le contenu et les
                performances. Ces données sont collectées de façon anonymisée et
                agrégée.
              </p>
              <p>
                Vous pouvez à tout moment configurer votre navigateur pour
                refuser les cookies ou être averti lorsqu&apos;un cookie est
                déposé. Le refus des cookies essentiels peut toutefois entraîner
                un dysfonctionnement de certaines fonctionnalités du site.
              </p>
            </div>
          </div>

          {/* ── Droits des utilisateurs ── */}
          <div>
            <div className="mb-8 pb-4 border-b border-dark/8">
              <span className="font-poppins text-[0.68rem] font-semibold uppercase tracking-[0.25em] text-primary">
                Vos droits
              </span>
              <h2 className="mt-2 font-erotique text-2xl text-dark sm:text-3xl">
                Droits des Utilisateurs
              </h2>
            </div>
            <div className="space-y-5 font-poppins text-[0.88rem] leading-[1.9] text-dark/60">
              <p>
                Conformément à la loi organique tunisienne n°2004-63 du 27
                juillet 2004 portant sur la protection des données à caractère
                personnel, vous disposez des droits suivants sur vos données.
              </p>

              <div className="rounded-xl border border-dark/5 bg-white px-6 py-5 shadow-[0_2px_16px_rgba(0,0,0,0.03)]">
                <p className="font-poppins text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-dark mb-3">
                  Vos droits
                </p>
                <ul className="space-y-2">
                  {[
                    "Droit d'accès : obtenir une copie de vos données personnelles détenues par KINYN",
                    "Droit de rectification : corriger des données inexactes ou incomplètes",
                    "Droit de suppression : demander l'effacement de vos données sous conditions",
                    "Droit d'opposition : vous opposer au traitement de vos données à des fins de prospection",
                    "Droit de retrait du consentement : vous désabonner de la newsletter à tout moment",
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

              <p>
                Pour exercer l&apos;un de ces droits, adressez votre demande à
                notre service client via la page{" "}
                <Link
                  href="/contact"
                  className="text-primary underline underline-offset-2 hover:text-primary/70 transition-colors"
                >
                  contact
                </Link>
                , en précisant votre identité et la nature de votre demande.
                Nous nous engageons à y répondre dans un délai de{" "}
                <span className="font-semibold text-dark">30 jours</span>.
              </p>
            </div>
          </div>

          {/* ── Conservation & Sécurité ── */}
          <div>
            <div className="mb-8 pb-4 border-b border-dark/8">
              <span className="font-poppins text-[0.68rem] font-semibold uppercase tracking-[0.25em] text-primary">
                Sécurité
              </span>
              <h2 className="mt-2 font-erotique text-2xl text-dark sm:text-3xl">
                Conservation &amp; Sécurité
              </h2>
            </div>
            <div className="space-y-5 font-poppins text-[0.88rem] leading-[1.9] text-dark/60">
              <p>
                Vos données sont conservées pendant la durée nécessaire à
                l&apos;exécution du contrat et au respect de nos obligations
                légales. Les données de votre compte client sont conservées tant
                que votre compte est actif. En cas de suppression de compte, vos
                données sont effacées dans un délai de{" "}
                <span className="font-semibold text-dark">30 jours</span>, à
                l&apos;exception des données nécessaires au respect
                d&apos;obligations légales (données de facturation conservées{" "}
                <span className="font-semibold text-dark">5 ans</span> à des
                fins fiscales).
              </p>
              <p>
                KINYN met en œuvre des mesures techniques et organisationnelles
                appropriées pour protéger vos données contre tout accès non
                autorisé, perte, altération ou divulgation. Notre site utilise
                le protocole{" "}
                <span className="font-semibold text-dark">HTTPS</span> pour
                chiffrer les échanges entre votre navigateur et nos serveurs.
                L&apos;accès aux données personnelles est strictement restreint
                aux membres de notre équipe habilités.
              </p>
              <p>
                En cas de violation de données susceptible d&apos;engendrer un
                risque élevé pour vos droits et libertés, nous nous engageons à
                vous en informer dans les meilleurs délais conformément à la
                réglementation applicable.
              </p>
            </div>
          </div>

          {/* ── Mise à jour ── */}
          <div>
            <div className="mb-8 pb-4 border-b border-dark/8">
              <span className="font-poppins text-[0.68rem] font-semibold uppercase tracking-[0.25em] text-primary">
                Évolution
              </span>
              <h2 className="mt-2 font-erotique text-2xl text-dark sm:text-3xl">
                Mise à Jour de la Politique
              </h2>
            </div>
            <div className="space-y-5 font-poppins text-[0.88rem] leading-[1.9] text-dark/60">
              <p>
                La présente politique de confidentialité peut être mise à jour à
                tout moment afin de refléter des changements dans nos pratiques
                ou pour se conformer à de nouvelles obligations légales. La date
                de dernière mise à jour est indiquée en bas de cette page.
              </p>
              <p>
                En cas de modification substantielle, nous vous en informerons
                par e-mail ou via une notification visible sur le site. Nous
                vous encourageons à consulter régulièrement cette page pour
                rester informé de la façon dont nous protégeons vos données.
              </p>
              <p className="font-poppins text-[0.8rem] text-dark/35">
                Dernière mise à jour&nbsp;: avril 2026
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ 3. Dark quote strip ════════ */}
      <section className="bg-dark px-6 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-erotique text-xl leading-snug text-background/80 sm:text-2xl md:text-3xl">
            &ldquo;Votre confiance est notre responsabilité la plus
            précieuse.&rdquo;
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
                Pour toute demande relative à vos données personnelles ou à
                l&apos;exercice de vos droits, notre équipe est à votre
                disposition.
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
                  <path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <h3 className="font-erotique text-xl text-dark sm:text-2xl">
                Livraison &amp; Retours
              </h3>
              <p className="mt-3 font-poppins text-[0.83rem] leading-relaxed text-dark/50">
                Consultez nos conditions de livraison, de retour et notre
                politique de remboursement.
              </p>
              <Link
                href="/livraison-retours"
                className="mt-6 inline-flex items-center gap-2 font-poppins text-[0.82rem] font-semibold tracking-wide text-primary transition-all duration-200 hover:gap-3"
              >
                En savoir plus
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
