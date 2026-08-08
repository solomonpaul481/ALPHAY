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

  const [checkoutOrder, setCheckoutOrder] = useState(null);
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
    if (createdRef.current) return;
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
        setError(err.message || "Couldn't start payment. Please return to your cart and try again.");
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
      name: checkoutOrder.restaurantName || "ALPHAX Restaurant",
      description: `Table ${checkoutOrder.tableNumber} · ${items.length} item${items.length === 1 ? "" : "s"}`,
      theme: { color: "#6D28D9" },
      handler: function (response) {
        clearCart();
        const query = new URLSearchParams({
          orderId: checkoutOrder.orderId,
          paymentId: response?.razorpay_payment_id || "",
          signature: response?.razorpay_signature || "",
          razorpayOrderId: response?.razorpay_order_id || "",
        }).toString();
        router.push(`/r/${restaurantId}/payment/processing?${query}`);
      },
      modal: {
        ondismiss: async () => {
          setOpening(false);
          try {
            await api.cancelOrder(checkoutOrder.orderId);
          } catch (err) {
            // best effort
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-50/50 via-cream to-white px-6">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm rounded-3xl bg-white p-7 text-center shadow-lift border border-purple-50"
      >
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple text-2xl font-bold">
          💳
        </div>

        <h1 className="font-display text-2xl font-bold text-ink">Checkout & Pay</h1>
        <p className="mt-1 text-xs font-semibold text-ink2">
          {items.length} item{items.length === 1 ? "" : "s"} · Table Order
        </p>

        <div className="my-6 rounded-2xl bg-purple-50/60 p-4 border border-purple-100">
          <p className="text-xs font-bold uppercase tracking-wider text-ink2">Total Payable Amount</p>
          <p className="mt-1 font-mono text-4xl font-bold text-purple tabular-nums">
            ₹{checkoutOrder ? checkoutOrder.amount.toFixed(2) : subtotal.toFixed(2)}
          </p>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-nonveg-tint p-3 text-xs font-semibold text-nonveg">{error}</p>
        )}

        <button
          type="button"
          onClick={openCheckout}
          disabled={!checkoutOrder || !scriptReady || opening}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-purple py-4 text-base font-bold text-white shadow-lift hover:bg-purple-deep transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {!checkoutOrder || !scriptReady ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Preparing Razorpay...
            </span>
          ) : (
            `Pay ₹${checkoutOrder.amount.toFixed(2)}`
          )}
        </button>

        <p className="mt-4 text-[11px] font-medium text-ink2">
          🔒 Secured 256-bit SSL Razorpay Gateway. Orders are confirmed only upon payment verification.
        </p>
      </motion.div>
    </main>
  );
}
