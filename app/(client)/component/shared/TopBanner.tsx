"use client";

export default function TopBanner() {
  return (
    <div className="bg-dark overflow-hidden">
      <div className="relative flex h-9 items-center">
        <span className="animate-marquee absolute whitespace-nowrap font-poppins text-[0.72rem] font-medium tracking-wide text-background">
          Livraison Gratuite à partir de 200 TND d&apos;achat
        </span>
      </div>
    </div>
  );
}
