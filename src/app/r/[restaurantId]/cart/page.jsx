"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import QuantitySelector from "@/components/QuantitySelector";
import VegDot from "@/components/VegDot";
import { createApiClient } from "@/lib/api-client";
import { IconArrowLeft, IconCart, IconArrowRight } from "@/components/Icons";

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
    if (!restaurantId) return;
    api
      .getInfo()
      .then((info) => {
        setGstPercent(info.gstPercent ?? 5);
        setRestaurantName(info.name ?? "");
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

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
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center bg-slate-950 text-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 mb-3 shadow-sm border border-amber-500/30">
          <IconCart className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-extrabold text-white font-['Cinzel']">Your Cart is Empty</h1>
        <p className="mt-1 text-xs text-slate-400">
          Add some delicious items from our menu to begin.
        </p>
        <button
          type="button"
          onClick={() => router.push(`/r/${restaurantId}/menu`)}
          className="mt-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3.5 text-xs font-bold text-slate-950 shadow-md hover:from-amber-400 hover:to-amber-500 font-['Cinzel'] cursor-pointer"
        >
          Browse Menu
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-36 pt-5 text-white">
      <div className="mx-auto max-w-lg">
        {/* Top Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 border border-amber-500/30 text-amber-400 shadow-xs hover:bg-slate-800 cursor-pointer"
            aria-label="Back"
          >
            <IconArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold font-['Cinzel'] tracking-wider">Order Summary</h1>
            {restaurantName && (
              <p className="text-xs font-bold text-amber-400">{restaurantName}</p>
            )}
          </div>
        </div>

        {/* Food Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.menuItemId}
              className="flex items-center gap-3.5 rounded-2xl bg-slate-900 p-4 shadow-sm border border-amber-500/20"
            >
              <VegDot isVeg={item.isVeg} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-white font-['Cinzel']">{item.name}</p>
                <p className="mt-0.5 font-mono text-xs font-bold text-amber-400 tabular-nums">
                  ₹{item.price} each
                </p>
              </div>
              <QuantitySelector
                quantity={item.quantity}
                onIncrease={() => setQuantity(item.menuItemId, item.quantity + 1)}
                onDecrease={() => setQuantity(item.menuItemId, item.quantity - 1)}
              />
            </div>
          ))}
        </div>

        {/* Special Instructions */}
        <section className="mt-6 rounded-2xl bg-slate-900 p-5 shadow-sm border border-amber-500/20">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 font-['Cinzel']">
            Special Instructions for Kitchen
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_NOTES.map((note) => (
              <button
                key={note}
                type="button"
                onClick={() => toggleNote(note)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                  activeNotes.includes(note)
                    ? "border-amber-400 bg-amber-500 text-slate-950 shadow-xs"
                    : "border-slate-800 bg-slate-950 text-slate-300 hover:border-amber-500/50"
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
            className="mt-3.5 w-full rounded-xl border border-amber-500/20 bg-slate-950 p-3 text-xs font-semibold text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
          />
        </section>

        {/* Bill Summary */}
        <section className="mt-6 rounded-2xl bg-slate-900 p-5 shadow-sm border border-amber-500/20">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-3 font-['Cinzel']">
            Payment Summary
          </h2>
          <div className="flex justify-between text-xs font-bold text-slate-400">
            <span>Item Subtotal</span>
            <span className="font-mono tabular-nums text-white">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="mt-2 flex justify-between text-xs font-bold text-slate-400">
            <span>Taxes & GST ({gstPercent}%)</span>
            <span className="font-mono tabular-nums text-white">₹{gstAmount.toFixed(2)}</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-base font-extrabold text-white">
            <span className="font-['Cinzel']">Grand Total</span>
            <span className="font-mono text-lg font-black text-amber-400 tabular-nums">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>
        </section>
      </div>

      {/* Sticky Proceed Button */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-amber-500/20 bg-slate-900/95 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={proceedToPayment}
            disabled={items.length === 0}
            className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-6 py-4 text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer font-['Cinzel'] tracking-wider"
          >
            <span>Proceed to Payment</span>
            <span className="font-mono text-base font-black flex items-center gap-1">
              ₹{grandTotal.toFixed(2)} <IconArrowRight className="h-4 w-4 text-slate-950" />
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}
