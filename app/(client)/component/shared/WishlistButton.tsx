"use client";

import { useCallback } from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";

interface WishlistButtonProps {
  productId: string;
  /** Base classes always applied to the <button> element (sizing, position, shape). */
  className?: string;
  /** Extra classes applied when the product IS in the wishlist. */
  activeClassName?: string;
  /** Extra classes applied when the product is NOT in the wishlist. */
  inactiveClassName?: string;
  /** Classes applied to the Heart icon. */
  iconClassName?: string;
}

export default function WishlistButton({
  productId,
  className = "",
  activeClassName = "",
  inactiveClassName = "",
  iconClassName = "",
}: WishlistButtonProps) {
  const { has, toggle: wishlistToggle } = useWishlist();
  const wishlisted = has(productId);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      wishlistToggle(productId);
    },
    [wishlistToggle, productId],
  );

  const stateClass = wishlisted ? activeClassName : inactiveClassName;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={wishlisted ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`${className} ${stateClass}`}
    >
      <Heart
        className={`transition-all duration-200 ${wishlisted ? "fill-primary text-primary" : ""} ${iconClassName}`}
        strokeWidth={1.8}
      />
    </button>
  );
}
