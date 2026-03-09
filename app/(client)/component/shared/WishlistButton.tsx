"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart } from "lucide-react";

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
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  /* Check if this product is already in the user's wishlist on mount */
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data?.user?.wishlist)) {
          setWishlisted((data.user.wishlist as string[]).includes(productId));
        }
      })
      .catch(() => {});
  }, [productId]);

  const toggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (loading) return;
      setLoading(true);
      try {
        if (wishlisted) {
          const res = await fetch(`/api/auth/me/wishlist/${productId}`, {
            method: "DELETE",
          });
          if (res.ok) setWishlisted(false);
        } else {
          const res = await fetch("/api/auth/me/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          });
          if (res.ok) setWishlisted(true);
          /* 401 = not authenticated, silently ignore */
        }
      } finally {
        setLoading(false);
      }
    },
    [loading, wishlisted, productId],
  );

  const stateClass = wishlisted ? activeClassName : inactiveClassName;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
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
