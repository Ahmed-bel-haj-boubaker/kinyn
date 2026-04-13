"use client";

import dynamic from "next/dynamic";
import Navbar from "./component/shared/Navbar";
import Footer from "./component/shared/Footer";
import { useState } from "react";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";

/* ── Lazy-load drawers/overlays (rarely needed on initial render) ── */
const CartDrawer = dynamic(() => import("./component/shared/CartDrawer"), {
  ssr: false,
});
const WishlistDrawer = dynamic(
  () => import("./component/shared/WishlistDrawer"),
  { ssr: false },
);
const SearchOverlay = dynamic(
  () => import("./component/shared/SearchOverlay"),
  { ssr: false },
);

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <CartProvider>
      <WishlistProvider>
        <div className="min-h-screen flex flex-col bg-background">
          <div className="sticky top-0 z-50 overflow-y-visible overflow-x-clip">
            <Navbar
              onCartClick={() => setCartOpen(true)}
              onWishlistClick={() => setWishlistOpen(true)}
              onSearchClick={() => setSearchOpen(true)}
            />
          </div>
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
          <WishlistDrawer
            isOpen={wishlistOpen}
            onClose={() => setWishlistOpen(false)}
          />
          <SearchOverlay
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
          />
        </div>
      </WishlistProvider>
    </CartProvider>
  );
}
