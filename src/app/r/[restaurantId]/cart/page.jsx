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
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center bg-slate-50 dark:bg-zinc-950">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 mb-3 shadow-sm">
          <IconCart className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Your Cart is Empty</h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          Add some delicious items from our menu to begin.
        </p>
        <button
          type="button"
          onClick={() => router.push(`/r/${restaurantId}/menu`)}
          className="mt-6 rounded-2xl bg-indigo-600 px-6 py-3.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 cursor-pointer"
        >
          Browse Menu
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 px-4 pb-36 pt-5 text-slate-900 dark:text-white">
      <div className="mx-auto max-w-lg">
        {/* Top Header */}
        <div className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white shadow-xs hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
            aria-label="Back"
          >
            <IconArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold">Order Summary</h1>
            {restaurantName && (
              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{restaurantName}</p>
            )}
          </div>
        </div>

        {/* Food Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.menuItemId}
              className="flex items-center gap-3.5 rounded-2xl bg-white dark:bg-zinc-900 p-4 shadow-sm border border-slate-200 dark:border-zinc-800"
            >
              <VegDot isVeg={item.isVeg} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{item.name}</p>
                <p className="mt-0.5 font-mono text-xs font-bold text-slate-500 dark:text-zinc-400 tabular-nums">
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
        <section className="mt-6 rounded-2xl bg-white dark:bg-zinc-900 p-5 shadow-sm border border-slate-200 dark:border-zinc-800">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-zinc-400">
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
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                    : "border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:border-slate-400"
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
            className="mt-3.5 w-full rounded-xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 p-3 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-indigo-600 focus:outline-none"
          />
        </section>

        {/* Bill Summary */}
        <section className="mt-6 rounded-2xl bg-white dark:bg-zinc-900 p-5 shadow-sm border border-slate-200 dark:border-zinc-800">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-3">
            Payment Summary
          </h2>
          <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-zinc-400">
            <span>Item Subtotal</span>
            <span className="font-mono tabular-nums">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="mt-2 flex justify-between text-xs font-bold text-slate-600 dark:text-zinc-400">
            <span>Taxes & GST ({gstPercent}%)</span>
            <span className="font-mono tabular-nums">₹{gstAmount.toFixed(2)}</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center text-base font-extrabold text-slate-900 dark:text-white">
            <span>Grand Total</span>
            <span className="font-mono text-lg font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>
        </section>
      </div>

      {/* Sticky Proceed Button */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={proceedToPayment}
            disabled={items.length === 0}
            className="flex w-full items-center justify-between rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-6 py-4 text-sm font-extrabold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <span>Proceed to Payment</span>
            <span className="font-mono text-base font-black flex items-center gap-1">
              ₹{grandTotal.toFixed(2)} <IconArrowRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}
