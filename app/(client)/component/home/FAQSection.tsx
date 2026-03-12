"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
interface FaqItem {
  question: string;
  answer: string;
}

const FALLBACK_FAQS: FaqItem[] = [
  {
    question: "Quels sont les délais de livraison ?",
    answer:
      "La livraison standard en Tunisie est effectuée sous 2 à 5 jours ouvrables. Pour les commandes internationales, comptez entre 7 et 14 jours selon la destination. Vous recevrez un numéro de suivi dès l'expédition de votre colis.",
  },
  {
    question: "Puis-je retourner ou échanger un article ?",
    answer:
      "Bien sûr. Vous disposez de 14 jours après réception pour retourner ou échanger tout article non porté, dans son emballage d'origine et avec ses étiquettes. Les frais de retour sont à la charge du client, sauf en cas de défaut ou d'erreur de notre part.",
  },
  {
    question: "Les matières utilisées sont-elles de qualité ?",
    answer:
      "Absolument. Kinyn sélectionne rigoureusement ses matières premières : coton peigné, lin européen, viscose certifiée et cuir véritable. Chaque tissu est choisi pour sa durabilité, son confort et son rendu esthétique, reflétant notre engagement envers l'excellence.",
  },
  {
    question: "Proposez-vous la livraison gratuite ?",
    answer:
      "Oui, la livraison est offerte pour toute commande supérieure à 200 TND en Tunisie. Pour les commandes internationales, les frais de port sont calculés selon le poids et la destination lors du passage en caisse.",
  },
  {
    question: "Comment entretenir mes vêtements Kinyn ?",
    answer:
      "Pour préserver la qualité de vos pièces Kinyn, nous recommandons un lavage à 30°C, un séchage à plat et un repassage à température modérée. Les instructions d'entretien spécifiques sont indiquées sur l'étiquette de chaque vêtement.",
  },
  {
    question: "Puis-je passer une commande par téléphone ?",
    answer:
      "Oui, notre service client est disponible du lundi au samedi de 9h à 18h pour vous accompagner dans votre commande. Vous pouvez nous joindre par téléphone, WhatsApp ou e-mail. Nous serons ravis de vous assister.",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function FAQSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [faqs, setFaqs] = useState<FaqItem[]>(FALLBACK_FAQS);

  /* ---- fetch published FAQs ---- */
  useEffect(() => {
    fetch("/api/faq")
      .then((r) => r.json())
      .then((data: { faqs?: FaqItem[] }) => {
        if (Array.isArray(data.faqs) && data.faqs.length > 0) {
          setFaqs(data.faqs);
        }
      })
      .catch(() => {
        /* silently use fallback */
      });
  }, []);

  /* ---- intersection observer ---- */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <section
      ref={sectionRef}
      className="bg-background py-20 md:py-28 overflow-hidden"
    >
      <div
        className={`mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 transition-all duration-700 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* -------- heading -------- */}
        <div className="text-center mb-14">
          <h2 className="font-erotique text-dark text-3xl sm:text-4xl md:text-5xl tracking-tight">
            Questions Fréquentes
          </h2>
          <p className="mt-4 font-poppins text-dark/60 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Tout ce que vous devez savoir avant de passer commande chez Kinyn.
          </p>
          <span className="block mx-auto mt-6 w-16 h-1 bg-primary rounded-full" />
        </div>

        {/* -------- accordion -------- */}
        <div className="flex flex-col gap-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;

            return (
              <div
                key={i}
                className={`rounded-2xl border transition-colors duration-200 ${
                  isOpen
                    ? "bg-white border-primary/20 shadow-sm"
                    : "bg-white/60 border-transparent hover:bg-white hover:border-dark/5"
                }`}
              >
                {/* question button */}
                <button
                  onClick={() => toggle(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(i);
                    }
                  }}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${i}`}
                  className="w-full flex items-center justify-between gap-4
                             px-5 sm:px-6 py-4 sm:py-5 text-left cursor-pointer
                             focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-primary/40 rounded-2xl"
                >
                  <span className="font-poppins font-semibold text-dark text-sm sm:text-base leading-snug pr-2">
                    {faq.question}
                  </span>

                  {/* toggle icon */}
                  <span
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                                transition-all duration-300 ${
                                  isOpen
                                    ? "bg-primary text-white rotate-45"
                                    : "bg-primary/10 text-primary rotate-0"
                                }`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="transition-transform duration-300"
                    >
                      <path
                        d="M7 1V13M1 7H13"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </button>

                {/* answer panel */}
                <div
                  id={`faq-answer-${i}`}
                  role="region"
                  aria-labelledby={`faq-question-${i}`}
                  className="grid transition-all duration-300 ease-out"
                  style={{
                    gridTemplateRows: isOpen ? "1fr" : "0fr",
                  }}
                >
                  <div className="overflow-hidden">
                    <p className="font-poppins text-dark/65 text-sm sm:text-base leading-relaxed px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
