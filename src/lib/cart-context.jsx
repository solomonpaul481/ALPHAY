"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);

function storageKey(restaurantId) {
  return `alphay_cart_${restaurantId}`;
}

export function CartProvider({ restaurantId, children }) {
  const [items, setItems] = useState([]); // { menuItemId, name, price, isVeg, quantity, notes }
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // Load any existing cart for this restaurant once, client-side only.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey(restaurantId));
      if (raw) {
        const parsed = JSON.parse(raw);
        setItems(parsed.items || []);
        setSpecialInstructions(parsed.specialInstructions || "");
      }
    } catch (err) {
      // Corrupt or unavailable storage — start with an empty cart.
    }
    setHydrated(true);
  }, [restaurantId]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(
        storageKey(restaurantId),
        JSON.stringify({ items, specialInstructions })
      );
    } catch (err) {
      // Ignore storage write failures (e.g. private browsing quota).
    }
  }, [items, specialInstructions, restaurantId, hydrated]);

  const addItem = useCallback((menuItem, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItemId === menuItem.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === menuItem.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          isVeg: menuItem.isVeg,
          quantity,
          notes: "",
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((menuItemId, quantity) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.menuItemId !== menuItemId);
      return prev.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity } : i));
    });
  }, []);

  const removeItem = useCallback((menuItemId) => {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setSpecialInstructions("");
  }, []);

  const quantityOf = useCallback(
    (menuItemId) => items.find((i) => i.menuItemId === menuItemId)?.quantity || 0,
    [items]
  );

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const value = {
    items,
    hydrated,
    addItem,
    setQuantity,
    removeItem,
    clearCart,
    quantityOf,
    totalItems,
    subtotal,
    specialInstructions,
    setSpecialInstructions,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
