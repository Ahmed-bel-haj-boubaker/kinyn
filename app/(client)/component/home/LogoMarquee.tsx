"use client";

import Image from "next/image";

const LOGO_COUNT = 16;

export default function LogoMarquee() {
  const logos = Array.from({ length: LOGO_COUNT });

  return (
    <section className="w-full overflow-hidden bg-white py-6 md:py-8 lg:py-5">
      <div className="group flex w-max animate-marquee  ">
        {[0, 1].map((set) => (
          <div
            key={set}
            className="flex shrink-0 items-center"
            aria-hidden={set === 1 ? true : undefined}
          >
            {logos.map((_, i) => (
              <div
                key={i}
                className="mx-8 flex items-center justify-center sm:mx-12 md:mx-16 lg:mx-11"
              >
                <Image
                  src="/images/logo.png"
                  alt="KINYN"
                  width={400}
                  height={400}
                  className="h-8 w-auto object-contain transition-all duration-500 hover:opacity-100   sm:h-9 md:h-10 lg:h-12"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
