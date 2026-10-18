"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { PricedCart } from "@/lib/pricing";

// Client view of the server cart. The browser only sends product ids and
// quantities; every response is the cart priced by the server.

type CartState = {
  cart: PricedCart | null;
  pending: boolean;
  error: string | null;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (productId: number, quantity: number) => Promise<boolean>;
  setQuantity: (lineId: number, quantity: number) => Promise<void>;
  remove: (lineId: number) => Promise<void>;
  /** Accept or decline the order bump on offer */
  setBump: (accept: boolean) => Promise<void>;
  /** Reload the cart from the server (e.g. after an order emptied it) */
  refresh: () => Promise<void>;
  freeShippingText: string;
};

const CartContext = createContext<CartState | null>(null);

const emptyCart: PricedCart = {
  lines: [],
  bump: null,
  staleBumpLineId: null,
  removed: [],
  subtotalCents: 0,
  compareAtTotalCents: 0,
  savingsCents: 0,
  itemCount: 0,
};

async function request(url: string, init?: RequestInit): Promise<PricedCart> {
  const response = await fetch(url, {
    ...init,
    headers: init?.body ? { "content-type": "application/json" } : undefined,
    cache: "no-store",
  });
  const body = (await response.json().catch(() => ({}))) as PricedCart & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "Something went wrong. Please try again.");
  return body;
}

export function CartProvider({ children, freeShippingText }: { children: ReactNode; freeShippingText: string }) {
  const [cart, setCart] = useState<PricedCart | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const latest = useRef(0);

  // Only the newest response wins when requests overlap
  const run = useCallback(async (work: () => Promise<PricedCart>) => {
    const ticket = ++latest.current;
    setPending(true);
    setError(null);
    try {
      const next = await work();
      if (ticket === latest.current) setCart(next);
      return true;
    } catch (err) {
      if (ticket === latest.current) setError(err instanceof Error ? err.message : "Something went wrong.");
      return false;
    } finally {
      if (ticket === latest.current) setPending(false);
    }
  }, []);

  // Initial load: state is only set when the response arrives
  useEffect(() => {
    const ticket = latest.current;
    request("/api/cart")
      .then((next) => {
        if (ticket === latest.current) setCart(next);
      })
      .catch(() => setCart((current) => current ?? emptyCart));
  }, []);

  const value = useMemo<CartState>(
    () => ({
      cart,
      pending,
      error,
      isOpen,
      open: () => {
        setIsOpen(true);
        // Re-price on open: stock, gifts or the offer timer may have changed
        void run(() => request("/api/cart"));
      },
      close: () => setIsOpen(false),
      add: async (productId, quantity) => {
        const ok = await run(() =>
          request("/api/cart/items", { method: "POST", body: JSON.stringify({ productId, quantity }) }),
        );
        if (ok) setIsOpen(true);
        return ok;
      },
      setQuantity: async (lineId, quantity) => {
        await run(() => request(`/api/cart/items/${lineId}`, { method: "PATCH", body: JSON.stringify({ quantity }) }));
      },
      remove: async (lineId) => {
        await run(() => request(`/api/cart/items/${lineId}`, { method: "DELETE" }));
      },
      setBump: async (accept) => {
        await run(() => request("/api/cart/bump", { method: "PUT", body: JSON.stringify({ accept }) }));
      },
      refresh: async () => {
        await run(() => request("/api/cart"));
      },
      freeShippingText,
    }),
    [cart, pending, error, isOpen, run, freeShippingText],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>");
  return context;
}
