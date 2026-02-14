"use client";

import Navbar from "./component/shared/Navbar";
import CartDrawer from "./component/shared/CartDrawer";
import Footer from "./component/shared/Footer";
import { useState } from "react";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="sticky top-0 z-50 overflow-y-visible overflow-x-clip">
        <Navbar onCartClick={() => setCartOpen(true)} />
      </div>
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Scroll to top button */}
    </div>
  );
}
