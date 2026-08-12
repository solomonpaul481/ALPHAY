"use client";

import { useState } from "react";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayCheckoutButton({
  amountInRupees = 100,
  description = "Standard Razorpay Checkout",
  onSuccess,
  onFailure,
  className = "",
  buttonText = "Pay with Razorpay 💳",
}) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCheckout = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || typeof window === "undefined" || !window.Razorpay) {
        throw new Error("Failed to load Razorpay SDK. Please check your internet connection.");
      }

      // Step 1: Call Backend to Create Order (amount in paise, minimum 100 paise)
      const paiseAmount = Math.max(100, Math.round(amountInRupees * 100));
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: paiseAmount }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.ok) {
        throw new Error(orderData.error || "Could not initialize order with Razorpay.");
      }

      const keyId =
        orderData.keyId ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        "rzp_test_TOtzon9NeyIvZ4";

      // Step 2: Open Razorpay Standard Checkout Modal
      const options = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "ALPHAY Checkout",
        description: description,
        order_id: orderData.order_id,
        theme: { color: "#F59E0B" },
        handler: async function (response) {
          try {
            // Step 3: Call Backend to Verify Payment Signature
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment signature verification failed.");
            }

            if (onSuccess) {
              onSuccess(verifyData);
            }
          } catch (err) {
            const msg = err.message || "Payment verification failed.";
            setErrorMessage(msg);
            if (onFailure) onFailure(msg);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setErrorMessage("Payment was cancelled by the user.");
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        setLoading(false);
        const failureMsg = response.error?.description || "Payment failed. Please try again.";
        setErrorMessage(failureMsg);
        if (onFailure) onFailure(failureMsg);
      });

      rzp.open();
    } catch (err) {
      setLoading(false);
      const msg = err.message || "Checkout failed to launch.";
      setErrorMessage(msg);
      if (onFailure) onFailure(msg);
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
          "rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 px-6 py-3 text-sm font-black text-slate-950 shadow-lg hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-50 cursor-pointer font-['Cinzel']"
        }
      >
        {loading ? "Initializing Razorpay..." : buttonText}
      </button>
      {errorMessage && (
        <p className="mt-2 text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/80 p-2 rounded-xl border border-rose-300">
          ⚠️ {errorMessage}
        </p>
      )}
    </div>
  );
}
