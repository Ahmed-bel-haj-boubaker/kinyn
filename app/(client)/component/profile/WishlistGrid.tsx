"use client";

import { X } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface WishlistItem {
  id: number;
  name: string;
  price: string;
  image: string;
  category: string;
}

const initialItems: WishlistItem[] = [
  {
    id: 1,
    name: "Robe en Soie Ivoire",
    price: "349.00 DT",
    image: "/images/product1.jpg",
    category: "Robes",
  },
  {
    id: 2,
    name: "Blazer Structuré Noir",
    price: "289.00 DT",
    image: "/images/product2.jpg",
    category: "Hauts",
  },
  {
    id: 3,
    name: "Pantalon Palazzo",
    price: "195.00 DT",
    image: "/images/product3.jpg",
    category: "Bas",
  },
  {
    id: 4,
    name: "Chemise en Lin",
    price: "159.00 DT",
    image: "/images/product1.jpg",
    category: "Hauts",
  },
  {
    id: 5,
    name: "Jupe Plissée Midi",
    price: "219.00 DT",
    image: "/images/product2.jpg",
    category: "Bas",
  },
  {
    id: 6,
    name: "Pull Cachemire Crème",
    price: "389.00 DT",
    image: "/images/product3.jpg",
    category: "Hauts",
  },
];

export default function WishlistGrid() {
  const [items, setItems] = useState<WishlistItem[]>(initialItems);

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <section>
      <h3 className="font-erotique text-lg text-dark mb-6">
        Liste de Souhaits
      </h3>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-xl bg-white border border-[#EEECE7] shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-shadow duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
            >
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="absolute right-3 top-3 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/90 text-[#999] opacity-0 shadow-sm transition-all duration-200 hover:bg-primary hover:text-white group-hover:opacity-100"
                aria-label={`Retirer ${item.name} de la liste`}
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>

              {/* Image */}
              <div className="relative aspect-4/5 w-full overflow-hidden bg-[#F5F4F1]">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                />
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="font-poppins text-[10.5px] uppercase tracking-wide text-[#999] mb-1">
                  {item.category}
                </p>
                <h4 className="font-poppins text-[13px] font-medium text-dark leading-snug mb-2 truncate">
                  {item.name}
                </h4>
                <p className="font-poppins text-[13.5px] font-semibold text-dark">
                  {item.price}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="font-poppins text-[14px] text-[#999]">
            Votre liste de souhaits est vide.
          </p>
        </div>
      )}
    </section>
  );
}
