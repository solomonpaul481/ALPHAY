"use client";

import { useState } from "react";

function loadCashfreeScript() {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Cashfree) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CashfreeCheckoutButton({
  amountInRupees = 100,
  description = "Standard Cashfree Checkout",
  onSuccess,
  onFailure,
  className = "",
  buttonText = "Pay with Cashfree 💳",
}) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCheckout = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const isLoaded = await loadCashfreeScript();
      if (!isLoaded || typeof window === "undefined" || !window.Cashfree) {
        throw new Error("Failed to load Cashfree SDK. Please check your internet connection.");
      }

      // Step 1: Call backend to create Cashfree order (in paise)
      const paiseAmount = Math.max(100, Math.round(amountInRupees * 100));
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: paiseAmount, gateway: "cashfree" }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.ok || !orderData.paymentSessionId) {
        throw new Error(orderData.error || "Could not initialize order with Cashfree.");
      }

      // Step 2: Initialize Cashfree SDK & Launch Modal Checkout
      const cashfree = window.Cashfree({
        mode: orderData.env || "sandbox",
      });

      const checkoutOptions = {
        paymentSessionId: orderData.paymentSessionId,
        redirectTarget: "_modal",
      };

      const result = await cashfree.checkout(checkoutOptions);

      if (result?.error) {
        throw new Error(result.error.message || "Payment cancelled or failed.");
      }

      // Step 3: Verify payment status on backend
      const verifyRes = await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cfOrderId: orderData.orderId,
          orderId: orderData.orderId,
          gateway: "cashfree",
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || "Cashfree payment verification failed.");
      }

      if (onSuccess) {
        onSuccess(verifyData);
      }
    } catch (err) {
      const msg = err.message || "Cashfree checkout failed.";
      setErrorMessage(msg);
      if (onFailure) onFailure(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-block">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={
          className ||
          "rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600 px-6 py-3 text-sm font-black text-slate-950 shadow-lg hover:from-teal-400 hover:to-emerald-400 transition-all disabled:opacity-50 cursor-pointer font-['Cinzel']"
        }
      >
        {loading ? "Launching Cashfree..." : buttonText}
      </button>
      {errorMessage && (
        <p className="mt-2 text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/80 p-2 rounded-xl border border-rose-300">
          ⚠️ {errorMessage}
        </p>
      )}
    </div>
  );
}
