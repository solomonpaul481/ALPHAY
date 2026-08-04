"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useCart } from "@/lib/cart-context";
import QuantitySelector from "@/components/QuantitySelector";
import VegDot from "@/components/VegDot";
import { createApiClient } from "@/lib/api-client";

const QUICK_NOTES = ["No Onion", "Less Spicy", "Extra Gravy"];

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

  useEffect(() => {
    api
      .getInfo()
      .then((info) => setGstPercent(info.gstPercent ?? 5))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gstAmount = Math.round(subtotal * (gstPercent / 100) * 100) / 100;
  const total = Math.round((subtotal + gstAmount) * 100) / 100;

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
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="text-4xl">🛒</p>
        <h1 className="mt-3 font-display text-xl font-medium text-ink">Your cart is empty</h1>
        <p className="mt-1 text-sm text-ink2">Add a few dishes from the menu to get started.</p>
        <button
          type="button"
          onClick={() => router.push(`/r/${restaurantId}/menu`)}
          className="mt-6 rounded-full bg-purple px-6 py-3 text-sm font-semibold text-white shadow-soft"
        >
          Browse Menu
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 pb-40 pt-5">
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-soft"
          aria-label="Back"
        >
          ←
        </button>
        <h1 className="font-display text-xl font-medium text-ink">Your Order</h1>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <motion.div
            key={item.menuItemId}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 rounded-card bg-white p-3.5 shadow-soft"
          >
            <VegDot isVeg={item.isVeg} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[15px] font-medium text-ink">{item.name}</p>
              <p className="mt-0.5 font-mono text-sm text-ink2 tabular-nums">₹{item.price} each</p>
            </div>
            <QuantitySelector
              quantity={item.quantity}
              onIncrease={() => setQuantity(item.menuItemId, item.quantity + 1)}
              onDecrease={() => setQuantity(item.menuItemId, item.quantity - 1)}
            />
          </motion.div>
        ))}
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-ink2">Special Instructions</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {QUICK_NOTES.map((note) => (
            <button
              key={note}
              type="button"
              onClick={() => toggleNote(note)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                activeNotes.includes(note)
                  ? "border-purple bg-purple text-white"
                  : "border-purple/15 bg-white text-ink2"
              }`}
            >
              {note}
            </button>
          ))}
        </div>
        <textarea
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          placeholder="Any other notes for the kitchen…"
          rows={2}
          className="mt-3 w-full rounded-xl border border-purple/15 bg-white p-3 text-sm text-ink placeholder:text-ink2/60 focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/20"
        />
      </section>

      <section className="mt-6 rounded-card bg-white p-4 shadow-soft">
        <div className="flex justify-between text-sm text-ink2">
          <span>Subtotal</span>
          <span className="font-mono tabular-nums">₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm text-ink2">
          <span>GST ({gstPercent}%)</span>
          <span className="font-mono tabular-nums">₹{gstAmount.toFixed(2)}</span>
        </div>
        <div className="ticket-divider mt-3 flex justify-between pt-3 font-display text-lg font-medium text-ink">
          <span>Grand Total</span>
          <span className="font-mono tabular-nums">₹{total.toFixed(2)}</span>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-purple-50 bg-white/95 px-4 py-4 backdrop-blur">
        <button
          type="button"
          onClick={proceedToPayment}
          disabled={items.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple py-3.5 text-sm font-semibold text-white shadow-lift transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          Proceed to Payment · ₹{total.toFixed(2)}
        </button>
      </div>
    </main>
  );
}
