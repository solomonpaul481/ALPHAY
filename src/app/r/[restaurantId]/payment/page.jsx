"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { useCart } from "@/lib/cart-context";
import { createApiClient } from "@/lib/api-client";
import { IconTransactions, IconArrowLeft, IconCheck } from "@/components/Icons";

export default function PaymentPage() {
  const { restaurantId } = useParams();
  const router = useRouter();
  const api = createApiClient(restaurantId);
  const { items, subtotal, specialInstructions, hydrated, clearCart } = useCart();

  const [checkoutOrder, setCheckoutOrder] = useState(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("ONLINE"); // "ONLINE" | "CASH"
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
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

  const handleOnlinePayment = () => {
    if (!checkoutOrder || !scriptReady || typeof window === "undefined" || !window.Razorpay) return;
    setProcessing(true);

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
          setProcessing(false);
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

  const handleCashPayment = async () => {
    if (!checkoutOrder) return;
    setProcessing(true);
    setError("");

    try {
      await api.payCash(checkoutOrder.orderId);
      clearCart();
      router.push(`/r/${restaurantId}/track/${checkoutOrder.orderId}`);
    } catch (err) {
      setError(err.message || "Failed to confirm cash order. Please try again.");
      setProcessing(false);
    }
  };

  const totalAmount = checkoutOrder ? checkoutOrder.amount : subtotal;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 px-4 py-8 text-slate-900 dark:text-white">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
      />

      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 p-6 sm:p-7 text-center shadow-xl border border-slate-200 dark:border-zinc-800">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm">
          <IconTransactions className="h-7 w-7" />
        </div>

        <h1 className="text-2xl font-black">Payment & Order</h1>
        <p className="mt-1 text-xs font-bold text-slate-500 dark:text-zinc-400">
          {items.length} item{items.length === 1 ? "" : "s"} · Table Order
        </p>

        {/* Total Amount Badge */}
        <div className="my-5 rounded-2xl bg-slate-100 dark:bg-zinc-800 p-4 border border-slate-200 dark:border-zinc-700">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">Total Payable Amount</p>
          <p className="mt-1 font-mono text-3xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
            ₹{totalAmount.toFixed(2)}
          </p>
        </div>

        {/* Select Payment Method Section */}
        <div className="text-left mb-5">
          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-zinc-400 mb-2">
            Select Payment Method
          </label>

          <div className="grid grid-cols-2 gap-3">
            {/* ONLINE PAYMENT CARD */}
            <button
              type="button"
              onClick={() => setPaymentMethod("ONLINE")}
              className={`relative flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                paymentMethod === "ONLINE"
                  ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 shadow-sm"
                  : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:border-slate-300"
              }`}
            >
              {paymentMethod === "ONLINE" && (
                <span className="absolute right-2 top-2 h-4 w-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                  <IconCheck className="h-3 w-3" />
                </span>
              )}
              <span className="text-xl mb-1">💳</span>
              <span className="text-xs font-extrabold">Pay Online</span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">UPI / Cards / NetBanking</span>
            </button>

            {/* CASH PAYMENT CARD */}
            <button
              type="button"
              onClick={() => setPaymentMethod("CASH")}
              className={`relative flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                paymentMethod === "CASH"
                  ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 shadow-sm"
                  : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:border-slate-300"
              }`}
            >
              {paymentMethod === "CASH" && (
                <span className="absolute right-2 top-2 h-4 w-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                  <IconCheck className="h-3 w-3" />
                </span>
              )}
              <span className="text-xl mb-1">💵</span>
              <span className="text-xs font-extrabold">Pay with Cash</span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">Pay at Counter / Waiter</span>
            </button>
          </div>
        </div>

        {paymentMethod === "CASH" && (
          <div className="mb-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3.5 text-left text-xs font-bold text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <span className="text-base">ℹ️</span>
            <span>
              You will pay <strong>₹{totalAmount.toFixed(2)}</strong> in cash at the counter or to your waiter when served.
            </span>
          </div>
        )}

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/60 p-3 text-xs font-bold text-red-600 dark:text-red-300">{error}</p>
        )}

        {/* Action Button */}
        {paymentMethod === "ONLINE" ? (
          <button
            type="button"
            onClick={handleOnlinePayment}
            disabled={!checkoutOrder || !scriptReady || processing}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 py-4 text-sm font-extrabold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {!checkoutOrder || !scriptReady || processing ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {processing ? "Launching Razorpay..." : "Preparing Razorpay..."}
              </span>
            ) : (
              `Pay Online ₹${totalAmount.toFixed(2)}`
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCashPayment}
            disabled={!checkoutOrder || processing}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 py-4 text-sm font-extrabold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {processing ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Confirming Cash Order...
              </span>
            ) : (
              `Confirm Cash Order (₹${totalAmount.toFixed(2)})`
            )}
          </button>
        )}

        <p className="mt-4 text-[11px] font-medium text-slate-400 dark:text-zinc-500">
          🔒 Encrypted Table Session. Order is instantly sent to kitchen upon confirmation.
        </p>
      </div>
    </main>
  );
}
