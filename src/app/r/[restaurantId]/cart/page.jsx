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

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);

  const handlePlaceOrder = async () => {
    if (submitting || items.length === 0) return;
    setSubmitting(true);
    setError("");

    try {
      await api.createOrder({
        items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity, notes: i.notes })),
        specialInstructions,
      });
      // Clear cart after placing order
      clearCart();
      setSubmitting(false);
      setOrderSuccess(true);
    } catch (err) {
      setSubmitting(false);
      if (err.status === 401) {
        router.replace(`/r/${restaurantId}`);
        return;
      }
      setError(err.message || "Could not place order. Please try again.");
    }
  };

  if (orderSuccess) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-8 text-white relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-amber-500/15 blur-3xl pointer-events-none animate-pulse" />

        <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/40 p-7 text-center shadow-2xl relative z-10 space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-4xl shadow-lg animate-bounce">
            👨‍🍳
          </div>

          <div>
            <span className="inline-block rounded-full bg-emerald-950/80 px-3.5 py-1 text-xs font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/40 font-['Cinzel']">
              Order Placed ✓
            </span>
            <h1 className="mt-3 text-2xl font-extrabold text-white font-['Cinzel'] tracking-wider">
              Order Sent to Kitchen!
            </h1>
            <p className="mt-2 text-xs font-medium text-slate-300">
              Your delicious items have been placed and the kitchen team is preparing them now.
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <button
              type="button"
              onClick={() => router.push(`/r/${restaurantId}/menu`)}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-4 text-xs font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 font-['Cinzel'] tracking-wider cursor-pointer transition-all active:scale-[0.98]"
            >
              ➕ Continue Ordering
            </button>

            <button
              type="button"
              onClick={() => router.push(`/r/${restaurantId}/track`)}
              className="w-full rounded-2xl bg-slate-800 border border-amber-500/30 py-3.5 text-xs font-extrabold text-amber-300 hover:bg-slate-700 font-['Cinzel'] cursor-pointer transition-all"
            >
              📋 View Order Status & Bill
            </button>
          </div>
        </div>
      </main>
    );
  }

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
            Current Order Summary
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
            <span className="font-['Cinzel']">Order Total</span>
            <span className="font-mono text-lg font-black text-amber-400 tabular-nums">
              ₹{grandTotal.toFixed(2)}
            </span>
          </div>
        </section>

        {error && (
          <p className="mt-4 rounded-xl bg-rose-500/20 border border-rose-500/40 p-3 text-xs font-bold text-rose-300 text-center">
            {error}
          </p>
        )}
      </div>

      {/* Sticky Proceed Button */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-amber-500/20 bg-slate-900/95 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={items.length === 0 || submitting}
            className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-6 py-4 text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer font-['Cinzel'] tracking-wider"
          >
            <span>{submitting ? "Sending to Kitchen..." : "Place Order & Send to Kitchen"}</span>
            <span className="font-mono text-base font-black flex items-center gap-1">
              ₹{grandTotal.toFixed(2)} <IconArrowRight className="h-4 w-4 text-slate-950" />
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}
