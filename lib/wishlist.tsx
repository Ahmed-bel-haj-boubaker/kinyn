"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

/* ================================================================
   Wishlist — hybrid (localStorage for guests, syncs with server
   for logged-in users)
   ================================================================ */

const STORAGE_KEY = "kinyn_wishlist";

function loadLocal(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* quota exceeded */
  }
}

interface WishlistContextValue {
  /** Product IDs in the wishlist */
  items: string[];
  /** Number of items */
  count: number;
  /** Is a given product wishlisted? */
  has: (productId: string) => boolean;
  /** Toggle a product in/out */
  toggle: (productId: string) => void;
  /** Remove a product */
  remove: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<string[]>(loadLocal);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const isInitialMount = useRef(true);
  const syncing = useRef(false);

  /* On mount: check auth and merge local wishlist with server */
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) return; // guest — keep local items
        const data = await res.json();
        if (cancelled) return;

        setIsLoggedIn(true);

        const serverIds: string[] = Array.isArray(data.user?.wishlist)
          ? data.user.wishlist
          : [];
        const localIds = loadLocal();

        /* Merge: union of both, deduplicated */
        const merged = Array.from(new Set([...serverIds, ...localIds]));
        setItems(merged);
        saveLocal(merged);

        /* Push any local-only items to server */
        const localOnly = localIds.filter((id) => !serverIds.includes(id));
        for (const id of localOnly) {
          await fetch("/api/auth/me/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: id }),
          }).catch(() => {});
        }
      } catch {
        /* offline / guest — keep local */
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  /* Persist to localStorage on every change (skip init) */
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveLocal(items);
  }, [items]);

  const has = useCallback(
    (productId: string) => items.includes(productId),
    [items],
  );

  const toggle = useCallback(
    (productId: string) => {
      const exists = items.includes(productId);
      if (exists) {
        setItems((prev) => prev.filter((id) => id !== productId));
        if (isLoggedIn && !syncing.current) {
          fetch(`/api/auth/me/wishlist/${productId}`, {
            method: "DELETE",
          }).catch(() => {});
        }
      } else {
        setItems((prev) => [...prev, productId]);
        if (isLoggedIn && !syncing.current) {
          fetch("/api/auth/me/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          }).catch(() => {});
        }
      }
    },
    [items, isLoggedIn],
  );

  const remove = useCallback(
    (productId: string) => {
      setItems((prev) => prev.filter((id) => id !== productId));
      if (isLoggedIn) {
        fetch(`/api/auth/me/wishlist/${productId}`, {
          method: "DELETE",
        }).catch(() => {});
      }
    },
    [isLoggedIn],
  );

  return (
    <WishlistContext.Provider
      value={{ items, count: items.length, has, toggle, remove }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx)
    throw new Error("useWishlist must be used within <WishlistProvider>");
  return ctx;
}
