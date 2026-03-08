"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

/* ──────────────────────────── Types ──────────────────────────── */

export interface CartItem {
  /** product DB id */
  productId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  promoPrice: number | null;
  /** selected color (empty string if none) */
  color: string;
  /** selected size (empty string if none) */
  size: string;
  quantity: number;
  /** parent category slug – used for building product links */
  categorySlug: string;
}

/** Unique key for a cart line = productId + color + size */
function cartKey(item: Pick<CartItem, "productId" | "color" | "size">) {
  return `${item.productId}__${item.color}__${item.size}`;
}

interface CartContextValue {
  items: CartItem[];
  /** Total number of units in the cart */
  totalItems: number;
  /** Monetary subtotal (uses promoPrice when available) */
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string, color: string, size: string) => void;
  updateQuantity: (
    productId: string,
    color: string,
    size: string,
    quantity: number,
  ) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

/* ──────────────────────── LocalStorage helpers ──────────────────────── */

const STORAGE_KEY = "kinyn_cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

/* ──────────────────────── Provider ──────────────────────── */

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const isInitialMount = useRef(true);

  /* Persist to localStorage on every change (skip initial mount) */
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveCart(items);
  }, [items]);

  /* ── Derived values ── */
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => {
    const unitPrice = i.promoPrice ?? i.price;
    return sum + unitPrice * i.quantity;
  }, 0);

  /* ── Actions ── */

  const addItem = useCallback(
    (incoming: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      const qty = incoming.quantity ?? 1;

      setItems((prev) => {
        const key = cartKey(incoming);
        const idx = prev.findIndex((i) => cartKey(i) === key);

        if (idx >= 0) {
          // Already in cart → bump quantity
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            quantity: updated[idx].quantity + qty,
          };
          return updated;
        }

        // New line
        return [...prev, { ...incoming, quantity: qty }];
      });
    },
    [],
  );

  const removeItem = useCallback(
    (productId: string, color: string, size: string) => {
      setItems((prev) =>
        prev.filter((i) => cartKey(i) !== cartKey({ productId, color, size })),
      );
    },
    [],
  );

  const updateQuantity = useCallback(
    (productId: string, color: string, size: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId, color, size);
        return;
      }
      setItems((prev) => {
        const key = cartKey({ productId, color, size });
        return prev.map((i) => (cartKey(i) === key ? { ...i, quantity } : i));
      });
    },
    [removeItem],
  );

  const clearCart = useCallback(() => setItems([]), []);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        subtotal,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/* ──────────────────────── Hook ──────────────────────── */

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}
