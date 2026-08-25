import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Gem, Leaf, Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Découvrez KINYN, marque tunisienne de mode premium pour femme et enfant. Notre histoire, nos valeurs d'excellence, de durabilité et d'authenticité.",
  alternates: { canonical: "https://kinyn.tn/about" },
  openGraph: {
    title: "À propos de KINYN",
    description:
      "Découvrez KINYN, marque tunisienne de mode premium pour femme et enfant.",
    url: "https://kinyn.tn/about",
    type: "website",
  },
};

const VALUES = [
  {
    icon: Gem,
    title: "Excellence",
    description:
      "Chaque pièce est le fruit d\u2019un savoir-faire minutieux, où la qualité prime sur la quantité.",
  },
  {
    icon: Leaf,
    title: "Durabilité",
    description:
      "Nous croyons en une mode responsable, pensée pour traverser les saisons sans compromettre l\u2019élégance.",
  },
  {
    icon: Heart,
    title: "Authenticité",
    description:
      "Notre identité repose sur une vision sincère du luxe — accessible, épurée et profondément humaine.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* ════════ 1. Hero ════════ */}
      <section className="relative w-full overflow-hidden bg-dark">
        <div className="relative h-[70vh] min-h-120 sm:h-[75vh] md:h-[80vh]">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src="/video/hero.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-linear-to-t from-dark/70 via-dark/30 to-dark/10" />

          <div className="relative z-10 flex h-full items-center justify-center px-6 text-center">
            <div className="max-w-2xl space-y-5">
              <p className="font-poppins text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-background/70">
                Notre Histoire
              </p>
              <h1 className="font-erotique text-4xl leading-tight text-background sm:text-5xl md:text-6xl lg:text-7xl">
                L&apos;Âme de Kinyn
              </h1>
              <p className="mx-auto max-w-md font-poppins text-[0.9rem] leading-relaxed text-background/60">
                Là où l&apos;élégance rencontre l&apos;intention — une maison
                née de la passion pour le raffinement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ 2. Brand Story ════════ */}
      <section className="bg-background px-6 py-20 md:py-28 lg:px-10">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2 md:gap-16 lg:gap-24">
          <div className="space-y-6">
            <p className="font-poppins text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-primary">
              Qui sommes-nous
            </p>
            <h2 className="font-erotique text-3xl text-dark sm:text-4xl">
              Une vision, un héritage
            </h2>
            <div className="space-y-4 font-poppins text-[0.88rem] leading-[1.85] text-dark/60">
              <p>
                Kinyn est née d&apos;une conviction simple : la mode peut être à
                la fois belle, accessible et porteuse de sens. Fondée avec une
                vision résolument contemporaine, notre maison puise dans
                l&apos;héritage artisanal tunisien tout en embrassant les codes
                du luxe international.
              </p>
              <p>
                Chaque collection raconte une histoire — celle de matières
                nobles, de coupes pensées pour sublimer chaque silhouette et
                d&apos;un souci du détail qui ne laisse rien au hasard. Nous
                croyons que le vêtement est un prolongement de soi, une
                expression silencieuse de ce que l&apos;on porte en nous.
              </p>
              <p>
                De Tunis au monde, Kinyn incarne un luxe décontracté, où
                l&apos;authenticité et l&apos;élégance cohabitent naturellement.
              </p>
            </div>
          </div>

          <div className="relative aspect-4/5 overflow-hidden rounded-2xl">
            <Image
              src="/images/image00028.jpg"
              alt="L'artisanat Kinyn"
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* ════════ 3. Vision & Values ════════ */}
      <section className="bg-white px-6 py-20 md:py-28 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center md:mb-18">
            <p className="font-poppins text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-primary">
              Nos Piliers
            </p>
            <h2 className="mt-3 font-erotique text-3xl text-dark sm:text-4xl">
              Ce qui nous définit
            </h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-3 sm:gap-6 lg:gap-12">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="group rounded-2xl border border-dark/5 bg-background/50 px-7 py-9 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
              >
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/8">
                  <v.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="mb-3 font-erotique text-xl text-dark">
                  {v.title}
                </h3>
                <p className="font-poppins text-[0.82rem] leading-relaxed text-dark/50">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ 4. Craftsmanship ════════ */}
      <section className="bg-background px-6 py-20 md:py-28 lg:px-10">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2 md:gap-16 lg:gap-24">
          <div className="relative aspect-4/5 overflow-hidden rounded-2xl md:order-1">
            <Image
              src="/images/image00061.JPG"
              alt="Détail de confection Kinyn"
              fill
              className="object-cover transition-transform duration-700 hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          <div className="space-y-6 md:order-2">
            <p className="font-poppins text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-primary">
              Savoir-Faire
            </p>
            <h2 className="font-erotique text-3xl text-dark sm:text-4xl">
              L&apos;Art du détail
            </h2>
            <div className="space-y-4 font-poppins text-[0.88rem] leading-[1.85] text-dark/60">
              <p>
                Nos matières sont sélectionnées avec exigence — cotons
                biologiques, lins européens, soies naturelles. Chaque tissu est
                choisi pour sa tenue, sa douceur au toucher et sa capacité à
                vieillir avec grâce.
              </p>
              <p>
                De la coupe initiale aux finitions invisibles, chaque étape de
                fabrication reflète un engagement envers la perfection discrète.
                Ce sont ces détails, souvent imperceptibles, qui distinguent une
                pièce Kinyn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ 5. Editorial Quote ════════ */}
      <section className="bg-dark px-6 py-20 md:py-28 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <blockquote>
            <p className="font-erotique text-2xl leading-snug text-background/90 sm:text-3xl md:text-4xl">
              &ldquo;Le vrai luxe ne se voit pas — il se ressent.&rdquo;
            </p>
            <footer className="mt-8">
              <cite className="font-poppins text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-background/40 not-italic">
                — La Maison Kinyn
              </cite>
            </footer>
          </blockquote>
        </div>
      </section>

      {/* ════════ 6. Call To Action ════════ */}
      <section className="bg-background px-6 py-20 md:py-28 lg:px-10">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="font-erotique text-3xl text-dark sm:text-4xl">
            Découvrez la Collection
          </h2>
          <p className="mx-auto mt-5 max-w-md font-poppins text-[0.88rem] leading-relaxed text-dark/50">
            Explorez des pièces conçues pour sublimer chaque moment — du
            quotidien aux occasions exceptionnelles.
          </p>
          <Link
            href="/femme"
            className="mt-9 inline-block rounded-lg bg-primary px-10 py-3.5 font-poppins text-[0.82rem] font-semibold tracking-[0.08em] text-white transition-all duration-300 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
          >
            Explorer
          </Link>
        </div>
      </section>
    </>
  );
}
