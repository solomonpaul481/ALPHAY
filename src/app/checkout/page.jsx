"use client";

import { useState } from "react";
import RazorpayCheckoutButton from "@/components/RazorpayCheckoutButton";

export default function CheckoutDemoPage() {
  const [amount, setAmount] = useState(100); // Amount in ₹
  const [paymentResult, setPaymentResult] = useState(null);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-amber-500/30 p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2 border-b border-amber-500/20 pb-6">
          <span className="text-4xl">💳</span>
          <h1 className="text-2xl font-black text-amber-400 font-['Cinzel'] tracking-wide">
            Razorpay Checkout Demo
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Test Razorpay order creation, payment modal, and backend signature verification.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-amber-400 font-['Cinzel'] mb-1">
              Payment Amount (₹ INR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-sm font-bold text-amber-400">₹</span>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full rounded-2xl border border-amber-500/30 bg-slate-950 pl-9 pr-4 py-3 text-sm font-bold text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400 font-mono">
              Equivalent to {Math.round(amount * 100)} paise (Minimum: 100 paise = ₹1)
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 border border-amber-500/20 text-xs font-mono space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Payment Gateway:</span>
              <span className="text-emerald-400 font-bold uppercase">RAZORPAY</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Order Endpoint:</span>
              <span className="text-cyan-400">POST /api/create-order</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Verification Endpoint:</span>
              <span className="text-cyan-400">POST /api/verify-payment</span>
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <RazorpayCheckoutButton
              amountInRupees={amount}
              description={`Test Razorpay Checkout for ₹${amount}`}
              onSuccess={(result) => setPaymentResult(result)}
              onFailure={() => setPaymentResult(null)}
              buttonText={`Pay ₹${amount} with Razorpay 💳`}
            />
          </div>
        </div>

        {paymentResult && (
          <div className="rounded-2xl bg-emerald-950/80 border border-emerald-500/50 p-5 space-y-2 text-xs font-mono text-emerald-200">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-sm font-['Cinzel']">
              <span>✓</span>
              <span>Payment Verified Successfully!</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <p><strong className="text-white">Gateway:</strong> RAZORPAY</p>
              <p><strong className="text-white">Payment ID:</strong> {paymentResult.paymentId}</p>
              <p><strong className="text-white">Order ID:</strong> {paymentResult.orderId}</p>
              <p><strong className="text-white">Status:</strong> Verified & Signature Matched</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
