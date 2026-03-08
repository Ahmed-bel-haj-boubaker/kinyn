"use client";

import Navbar from "./component/shared/Navbar";
import CartDrawer from "./component/shared/CartDrawer";
import SearchOverlay from "./component/shared/SearchOverlay";
import Footer from "./component/shared/Footer";
import { useState } from "react";
import { CartProvider } from "@/lib/cart";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-background">
        <div className="sticky top-0 z-50 overflow-y-visible overflow-x-clip">
          <Navbar
            onCartClick={() => setCartOpen(true)}
            onSearchClick={() => setSearchOpen(true)}
          />
        </div>
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
        <SearchOverlay
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
        />
      </div>
    </CartProvider>
  );
}
