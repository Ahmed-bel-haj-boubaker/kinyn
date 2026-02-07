"use client";

import { useState } from "react";
import TopBanner from "./component/shared/TopBanner";
import Navbar from "./component/shared/Navbar";
import CartDrawer from "./component/shared/CartDrawer";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="sticky top-0 z-50">
        <TopBanner />
        <Navbar onCartClick={() => setCartOpen(true)} />
      </div>
      <main className="flex-1">{children}</main>
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
