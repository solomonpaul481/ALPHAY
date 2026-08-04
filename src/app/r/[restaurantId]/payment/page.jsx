"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { motion } from "framer-motion";
import { useCart } from "@/lib/cart-context";
import { createApiClient } from "@/lib/api-client";

export default function PaymentPage() {
  const { restaurantId } = useParams();
  const router = useRouter();
  const api = createApiClient(restaurantId);
  const { items, subtotal, specialInstructions, hydrated, clearCart } = useCart();

  const [checkoutOrder, setCheckoutOrder] = useState(null); // { orderId, razorpayOrderId, amount, keyId, ... }
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState("");
  const [opening, setOpening] = useState(false);
  const createdRef = useRef(false);

  useEffect(() => {
    if (!hydrated) return;
    if (items.length === 0) {
      router.replace(`/r/${restaurantId}/menu`);
      return;
    }
    if (createdRef.current) return; // guard against double-invoke in dev/StrictMode
    createdRef.current = true;

    api
      .createOrder({
        items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity, notes: i.notes })),
        specialInstructions,
      })
      .then(setCheckoutOrder)
      .catch((err) => {
        if (err.status === 401) {
          router.replace(`/r/${restaurantId}`);
          return;
        }
        setError(err.message || "Couldn't start payment. Please go back and try again.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const openCheckout = () => {
    if (!checkoutOrder || !scriptReady || typeof window === "undefined" || !window.Razorpay) return;
    setOpening(true);

    const rzp = new window.Razorpay({
      key: checkoutOrder.keyId,
      amount: checkoutOrder.amountInPaise,
      currency: "INR",
      order_id: checkoutOrder.razorpayOrderId,
      name: checkoutOrder.restaurantName,
      description: `Table ${checkoutOrder.tableNumber} · ${items.length} item${items.length === 1 ? "" : "s"}`,
      theme: { color: "#6D28D9" },
      handler: function () {
        // NOTE: this fires the instant Razorpay's own checkout believes the
        // payment succeeded. We never trust this to mark the order paid —
        // we just move to the "verifying" screen, which polls our backend.
        // The order only becomes CONFIRMED once our webhook verifies the
        // signature directly with Razorpay's servers.
        clearCart();
        router.push(`/r/${restaurantId}/payment/processing?orderId=${checkoutOrder.orderId}`);
      },
      modal: {
        ondismiss: async () => {
          setOpening(false);
          try {
            await api.cancelOrder(checkoutOrder.orderId);
          } catch (err) {
            // best-effort — the order simply stays PENDING_PAYMENT otherwise
          }
          router.push(`/r/${restaurantId}/payment/failure?orderId=${checkoutOrder.orderId}`);
        },
      },
    });

    rzp.on("payment.failed", () => {
      router.push(`/r/${restaurantId}/payment/failure?orderId=${checkoutOrder.orderId}`);
    });

    rzp.open();
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-card bg-white p-6 text-center shadow-lift"
      >
        <h1 className="font-display text-xl font-medium text-ink">Ready to pay</h1>
        <p className="mt-1 text-sm text-ink2">
          {items.length} item{items.length === 1 ? "" : "s"} · Table order
        </p>

        <p className="mt-6 font-mono text-4xl font-semibold text-ink tabular-nums">
          ₹{checkoutOrder ? checkoutOrder.amount.toFixed(2) : subtotal.toFixed(2)}
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-nonveg-tint px-3 py-2 text-sm text-nonveg">{error}</p>
        )}

        <button
          type="button"
          onClick={openCheckout}
          disabled={!checkoutOrder || !scriptReady || opening}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-purple py-3.5 text-sm font-semibold text-white shadow-soft transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {!checkoutOrder || !scriptReady
            ? "Preparing secure payment…"
            : `Pay ₹${checkoutOrder.amount.toFixed(2)}`}
        </button>

        <p className="mt-4 text-xs text-ink2">Secured by Razorpay. Your card details never touch our servers.</p>
      </motion.div>
    </main>
  );
}
