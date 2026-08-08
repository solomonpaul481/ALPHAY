"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCart } from "@/lib/cart-context";
import QuantitySelector from "@/components/QuantitySelector";
import VegDot from "@/components/VegDot";
import { createApiClient } from "@/lib/api-client";

const QUICK_NOTES = ["Less spicy", "No onion", "Extra gravy", "No garlic", "Make it crispy"];

export default function CartPage() {
  const { restaurantId } = useParams();
  const router = useRouter();
  const api = createApiClient(restaurantId);
  const {
    items,
    setQuantity,
    subtotal,
    specialInstructions,
    setSpecialInstructions,
    hydrated,
  } = useCart();

  const [gstPercent, setGstPercent] = useState(5);
  const [restaurantName, setRestaurantName] = useState("");

  useEffect(() => {
    api
      .getInfo()
      .then((info) => {
        setGstPercent(info.gstPercent ?? 5);
        setRestaurantName(info.name ?? "");
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gstAmount = Math.round(subtotal * (gstPercent / 100) * 100) / 100;
  const grandTotal = Math.round((subtotal + gstAmount) * 100) / 100;

  const toggleNote = (note) => {
    const current = specialInstructions.split(",").map((s) => s.trim()).filter(Boolean);
    if (current.includes(note)) {
      setSpecialInstructions(current.filter((n) => n !== note).join(", "));
    } else {
      setSpecialInstructions([...current, note].join(", "));
    }
  };

  const activeNotes = specialInstructions.split(",").map((s) => s.trim());

  const proceedToPayment = () => {
    router.push(`/r/${restaurantId}/payment`);
  };

  if (hydrated && items.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center bg-cream">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-purple-100 text-4xl shadow-soft">
          🛒
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">Your cart is empty</h1>
        <p className="mt-1 text-sm text-ink2">Add some delicious dishes from our menu to begin.</p>
        <button
          type="button"
          onClick={() => router.push(`/r/${restaurantId}/menu`)}
          className="mt-6 rounded-2xl bg-purple px-8 py-3.5 text-sm font-bold text-white shadow-lift hover:bg-purple-deep transition-all"
        >
          Browse Menu
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream px-4 pb-36 pt-5">
      <div className="mx-auto max-w-lg">
        {/* Top bar */}
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-soft text-ink font-bold hover:bg-purple-50 transition-colors"
            aria-label="Back to menu"
          >
            ←
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-ink">Cart Summary</h1>
            {restaurantName && (
              <p className="text-xs font-semibold text-purple">{restaurantName}</p>
            )}
          </div>
        </div>

        {/* Selected Food Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <motion.div
              key={item.menuItemId}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3.5 rounded-2xl bg-white p-4 shadow-soft border border-purple-50"
            >
              <VegDot isVeg={item.isVeg} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-bold text-ink">{item.name}</p>
                <p className="mt-0.5 font-mono text-xs font-semibold text-ink2 tabular-nums">
                  ₹{item.price} each
                </p>
              </div>
              <QuantitySelector
                quantity={item.quantity}
                onIncrease={() => setQuantity(item.menuItemId, item.quantity + 1)}
                onDecrease={() => setQuantity(item.menuItemId, item.quantity - 1)}
              />
            </motion.div>
          ))}
        </div>

        {/* Special Instructions */}
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-soft border border-purple-50">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink2">
            Special Instructions for Kitchen
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_NOTES.map((note) => (
              <button
                key={note}
                type="button"
                onClick={() => toggleNote(note)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all ${
                  activeNotes.includes(note)
                    ? "border-purple bg-purple text-white shadow-soft"
                    : "border-purple/20 bg-purple-50/50 text-ink2 hover:bg-purple-50"
                }`}
              >
                {note}
              </button>
            ))}
          </div>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Add any specific notes for the chef..."
            rows={2}
            className="mt-3.5 w-full rounded-xl border border-purple/20 bg-purple-50/30 p-3 text-xs font-medium text-ink placeholder:text-ink2/50 focus:border-purple focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple/10"
          />
        </section>

        {/* Bill Breakdown */}
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-soft border border-purple-50">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink2 mb-3">
            Payment Summary
          </h2>
          <div className="flex justify-between text-xs font-semibold text-ink2">
            <span>Item Subtotal</span>
            <span className="font-mono tabular-nums">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="mt-2 flex justify-between text-xs font-semibold text-ink2">
            <span>Taxes & GST ({gstPercent}%)</span>
            <span className="font-mono tabular-nums">₹{gstAmount.toFixed(2)}</span>
          </div>
          <div className="mt-4 pt-3 border-t border-purple-50 flex justify-between items-center font-display text-lg font-bold text-ink">
            <span>Grand Total</span>
            <span className="font-mono text-xl font-bold text-purple tabular-nums">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>
        </section>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-purple-50 bg-white/95 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={proceedToPayment}
            disabled={items.length === 0}
            className="flex w-full items-center justify-between rounded-2xl bg-purple px-6 py-4 text-base font-bold text-white shadow-lift transition-all hover:bg-purple-deep active:scale-[0.98] disabled:opacity-50"
          >
            <span>Proceed to Payment</span>
            <span className="font-mono text-lg tabular-nums">₹{grandTotal.toFixed(2)} →</span>
          </button>
        </div>
      </div>
    </main>
  );
}
