"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import TopBanner from "./component/shared/TopBanner";
import Navbar from "./component/shared/Navbar";
import CartDrawer from "./component/shared/CartDrawer";
import Footer from "./component/shared/Footer";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [cartOpen, setCartOpen] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Hide banner once user scrolls past 50px
      setBannerVisible(currentScrollY <= 50);

      // Show scroll-to-top button after 400px
      setShowScrollTop(currentScrollY > 400);

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="sticky top-0 z-50">
        <div
          className={`transition-all duration-300 ease-out overflow-hidden ${
            bannerVisible ? "max-h-9 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <TopBanner />
        </div>
        <Navbar onCartClick={() => setCartOpen(true)} />
      </div>
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Scroll to top button */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Retour en haut"
        className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-background shadow-lg transition-all duration-300 ease-out hover:bg-primary/90 hover:scale-110 ${
          showScrollTop
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <ChevronUp className="h-5 w-5" strokeWidth={2.2} />
      </button>
    </div>
  );
}
