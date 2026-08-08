"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { useCart } from "@/lib/cart-context";
import { createApiClient } from "@/lib/api-client";
import { IconTransactions, IconArrowLeft } from "@/components/Icons";

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
      name: checkoutOrder.restaurantName || "ALPHAX Dining",
      description: `Table ${checkoutOrder.tableNumber} · ${items.length} item${items.length === 1 ? "" : "s"}`,
      theme: { color: "#4F46E5" },
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 px-4 text-slate-900 dark:text-white">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
      />

      <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 p-7 text-center shadow-xl border border-slate-200 dark:border-zinc-800">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400">
          <IconTransactions className="h-7 w-7" />
        </div>

        <h1 className="text-2xl font-extrabold">Payment & Order</h1>
        <p className="mt-1 text-xs font-bold text-slate-500 dark:text-zinc-400">
          {items.length} item{items.length === 1 ? "" : "s"} · Table Order
        </p>

        <div className="my-6 rounded-2xl bg-slate-100 dark:bg-zinc-800 p-4 border border-slate-200 dark:border-zinc-700">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Total Amount</p>
          <p className="mt-1 font-mono text-3xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
            ₹{checkoutOrder ? checkoutOrder.amount.toFixed(2) : subtotal.toFixed(2)}
          </p>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/60 p-3 text-xs font-bold text-red-600 dark:text-red-300">{error}</p>
        )}

        <button
          type="button"
          onClick={openCheckout}
          disabled={!checkoutOrder || !scriptReady || opening}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 py-4 text-sm font-extrabold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
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

        <p className="mt-4 text-[11px] font-medium text-slate-400 dark:text-zinc-500">
          🔒 Verified SSL Razorpay Gateway. Orders are confirmed upon payment completion.
        </p>
      </div>
    </main>
  );
}
