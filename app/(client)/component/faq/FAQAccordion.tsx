"use client";

import { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

interface Props {
  faqs: FaqItem[];
}

export default function FAQAccordion({ faqs }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <div className="flex flex-col gap-3">
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;

        return (
          <div
            key={i}
            className={`rounded-2xl border transition-all duration-300 ${
              isOpen
                ? "bg-white border-primary/20 shadow-sm"
                : "bg-white/60 border-transparent hover:bg-white hover:border-dark/5"
            }`}
          >
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
              id={`faq-question-${i}`}
              className="w-full flex items-center justify-between gap-4
                         px-5 sm:px-6 py-4 sm:py-5 text-left cursor-pointer
                         focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-primary/40 rounded-2xl"
            >
              <span className="font-poppins font-semibold text-dark text-sm sm:text-base leading-snug pr-2">
                {faq.question}
              </span>
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

            <div
              id={`faq-answer-${i}`}
              role="region"
              aria-labelledby={`faq-question-${i}`}
              className="grid transition-all duration-300 ease-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
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
  );
}
