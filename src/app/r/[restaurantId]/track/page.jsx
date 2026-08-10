"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Script from "next/script";
import { createApiClient } from "@/lib/api-client";
import { IconArrowLeft, IconCheck, IconCart, IconTransactions } from "@/components/Icons";

export default function SessionTrackPage() {
  const { restaurantId } = useParams();
  const router = useRouter();
  const api = createApiClient(restaurantId);

  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestingBill, setRequestingBill] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("ONLINE"); // ONLINE | CASH
  const [paying, setPaying] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  const fetchSession = async () => {
    try {
      const data = await api.getActiveSession();
      setSessionData(data);
      setLoading(false);
    } catch (err) {
      if (err.status === 401) {
        router.replace(`/r/${restaurantId}`);
        return;
      }
      setError(err.message || "Failed to load session details.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!restaurantId) return;
    fetchSession();

    // Auto refresh active session state every 4 seconds
    const interval = setInterval(fetchSession, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const handleRequestBill = async () => {
    if (requestingBill) return;
    setRequestingBill(true);
    try {
      await api.requestBill();
      await fetchSession();
    } catch (err) {
      setError(err.message || "Could not request bill.");
    } finally {
      setRequestingBill(false);
    }
  };

  const handleOnlinePayment = async () => {
    if (paying || !scriptReady || typeof window === "undefined" || !window.Razorpay) return;
    setPaying(true);
    setError("");

    try {
      const checkoutData = await api.paySessionOnline();
      const rzp = new window.Razorpay({
        key: checkoutData.keyId,
        amount: checkoutData.amountInPaise,
        currency: "INR",
        order_id: checkoutData.razorpayOrderId,
        name: checkoutData.restaurantName || "ALPHAY Restaurant",
        description: `Table ${checkoutData.tableNumber} · Session Bill Payment`,
        theme: { color: "#f59e0b" },
        handler: async function (response) {
          try {
            await api.verifySessionPayment({
              sessionId: sessionData.sessionId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });
            await fetchSession();
          } catch (err) {
            setError(err.message || "Payment verification failed.");
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
          },
        },
      });

      rzp.open();
    } catch (err) {
      setError(err.message || "Failed to launch online payment.");
      setPaying(false);
    }
  };

  const handleCashPayment = async () => {
    if (paying) return;
    setPaying(true);
    setError("");

    try {
      await api.paySessionCash();
      await fetchSession();
    } catch (err) {
      setError(err.message || "Failed to notify cash payment.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-amber-400 font-['Cinzel'] font-bold text-sm">
        Loading Dining Session...
      </main>
    );
  }

  if (error && !sessionData) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-slate-950 text-white">
        <p className="text-sm font-bold text-rose-400 mb-4">{error}</p>
        <button
          type="button"
          onClick={() => router.push(`/r/${restaurantId}/menu`)}
          className="rounded-2xl bg-amber-500 px-6 py-3 text-xs font-bold text-slate-950 font-['Cinzel']"
        >
          Return to Menu
        </button>
      </main>
    );
  }

  const isCompleted = sessionData?.status === "COMPLETED" || sessionData?.paymentStatus === "PAID";
  const isBillSent = sessionData?.status === "BILL_SENT";
  const isBillRequested = sessionData?.status === "BILL_REQUESTED";

  return (
    <main className="min-h-screen bg-slate-950 text-white pb-36 pt-5 px-4">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
      />

      <div className="mx-auto max-w-lg">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={() => router.push(`/r/${restaurantId}/menu`)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 border border-amber-500/30 text-amber-400 shadow-xs hover:bg-slate-800 cursor-pointer"
            aria-label="Menu"
          >
            <IconArrowLeft className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h1 className="text-lg font-black font-['Cinzel'] tracking-wider text-amber-200">
              {sessionData?.restaurantName || "ALPHAY"}
            </h1>
            <span className="inline-block rounded-md bg-gradient-to-r from-amber-500 to-amber-600 px-2 py-0.5 text-[10px] font-black text-slate-950">
              TABLE #{sessionData?.tableNumber || "12"}
            </span>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/r/${restaurantId}/menu`)}
            className="flex items-center gap-1.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 px-3 py-2 text-xs font-extrabold text-amber-400 hover:bg-amber-500/30 transition-all cursor-pointer"
          >
            <span>➕</span> Order More
          </button>
        </div>

        {/* SESSION STATUS BANNER */}
        <div className="mb-6 rounded-3xl bg-slate-900 p-5 border border-amber-500/30 shadow-xl text-center relative overflow-hidden">
          <div className="absolute right-0 top-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-amber-500/10 blur-xl pointer-events-none" />

          {isCompleted ? (
            <div>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xl">
                ✓
              </div>
              <h2 className="text-lg font-black text-emerald-400 font-['Cinzel']">
                Session Paid & Completed
              </h2>
              <p className="mt-1 text-xs text-slate-300">
                Thank you for dining with us! Table session is completed and cleared.
              </p>
            </div>
          ) : isBillSent ? (
            <div>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xl animate-bounce">
                🧾
              </div>
              <h2 className="text-lg font-black text-amber-400 font-['Cinzel']">
                Bill Received!
              </h2>
              <p className="mt-1 text-xs text-slate-300">
                Manager has dispatched your bill. Select your payment method below to complete dining.
              </p>
            </div>
          ) : isBillRequested ? (
            <div>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xl animate-pulse">
                ⏳
              </div>
              <h2 className="text-lg font-black text-amber-400 font-['Cinzel']">
                Bill Requested
              </h2>
              <p className="mt-1 text-xs text-slate-300">
                Manager has been notified to review and send your final bill.
              </p>
            </div>
          ) : (
            <div>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xl">
                🍽️
              </div>
              <h2 className="text-lg font-black text-white font-['Cinzel']">
                Ongoing Dining Session
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Feel free to order more dishes or request your bill when finished dining.
              </p>
            </div>
          )}
        </div>

        {/* SESSION PREVIOUS ORDERS DATA */}
        <section className="mb-6">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-3 font-['Cinzel'] flex items-center justify-between">
            <span>Orders Placed in this Session ({sessionData?.orders?.length || 0})</span>
            <span className="text-[10px] text-slate-400 font-mono">{sessionData?.totalItemsCount || 0} items</span>
          </h2>

          {sessionData?.orders?.length === 0 ? (
            <div className="rounded-2xl bg-slate-900 p-6 text-center border border-amber-500/20 text-xs font-semibold text-slate-400">
              No orders placed yet in this session.
            </div>
          ) : (
            <div className="space-y-4">
              {sessionData?.orders?.map((ord, idx) => (
                <div key={ord.id} className="rounded-2xl bg-slate-900 p-4 border border-amber-500/20 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      Order #{idx + 1} · {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-black text-amber-400 border border-amber-500/30">
                      {ord.status}
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs font-semibold text-slate-200">
                    {ord.items.map((it) => (
                      <li key={it.id} className="flex justify-between items-center">
                        <div>
                          <span className="font-extrabold text-amber-400 mr-2">{it.quantity}×</span>
                          <span>{it.name}</span>
                          {it.notes && (
                            <p className="text-[10px] font-medium text-slate-400 pl-5">Note: {it.notes}</p>
                          )}
                        </div>
                        <span className="font-mono text-slate-300">₹{(it.price * it.quantity).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex justify-between text-xs font-bold text-slate-400">
                    <span>Order Subtotal</span>
                    <span className="font-mono text-white">₹{ord.total.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* COMBINED BILL SUMMARY */}
        <section className="mb-6 rounded-2xl bg-slate-900 p-5 shadow-sm border border-amber-500/20">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-3 font-['Cinzel']">
            Combined Session Bill
          </h2>
          <div className="flex justify-between text-xs font-bold text-slate-400">
            <span>Session Items Subtotal</span>
            <span className="font-mono tabular-nums text-white">₹{(sessionData?.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="mt-2 flex justify-between text-xs font-bold text-slate-400">
            <span>Taxes & GST ({sessionData?.gstPercent || 5}%)</span>
            <span className="font-mono tabular-nums text-white">₹{(sessionData?.gstAmount || 0).toFixed(2)}</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-base font-extrabold text-white">
            <span className="font-['Cinzel']">Total Amount Payable</span>
            <span className="font-mono text-xl font-black text-amber-400 tabular-nums">
              ₹{(sessionData?.totalAmount || 0).toFixed(2)}
            </span>
          </div>
        </section>

        {/* PAYMENT OPTIONS (IF BILL SENT) */}
        {isBillSent && !isCompleted && (
          <section className="mb-6 rounded-2xl bg-slate-900 p-5 border border-amber-500/30 shadow-lg">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-3 font-['Cinzel']">
              Select Payment Option
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("ONLINE")}
                className={`relative flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  paymentMethod === "ONLINE"
                    ? "border-amber-400 bg-amber-500/10 text-amber-300"
                    : "border-slate-800 bg-slate-950 text-slate-400"
                }`}
              >
                {paymentMethod === "ONLINE" && (
                  <span className="absolute right-2 top-2 h-4 w-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px]">
                    <IconCheck className="h-3 w-3" />
                  </span>
                )}
                <span className="text-xl mb-1">💳</span>
                <span className="text-xs font-extrabold">Pay Online</span>
                <span className="text-[10px] text-slate-400">UPI / Cards / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`relative flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                  paymentMethod === "CASH"
                    ? "border-emerald-400 bg-emerald-500/10 text-emerald-300"
                    : "border-slate-800 bg-slate-950 text-slate-400"
                }`}
              >
                {paymentMethod === "CASH" && (
                  <span className="absolute right-2 top-2 h-4 w-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-[10px]">
                    <IconCheck className="h-3 w-3" />
                  </span>
                )}
                <span className="text-xl mb-1">💵</span>
                <span className="text-xs font-extrabold">Pay with Cash</span>
                <span className="text-[10px] text-slate-400">Pay at Counter</span>
              </button>
            </div>

            {paymentMethod === "CASH" && (
              <div className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs font-bold text-amber-200">
                ℹ️ Inform your waiter or manager at the counter to pay <strong>₹{(sessionData?.totalAmount || 0).toFixed(2)}</strong> in cash. Manager will confirm your payment to clear table.
              </div>
            )}
          </section>
        )}

        {/* BOTTOM ACTION BUTTONS */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-amber-500/20 bg-slate-900/95 px-4 py-4 backdrop-blur-md">
          <div className="mx-auto max-w-lg flex gap-3">
            {/* Button to order more */}
            {!isCompleted && (
              <button
                type="button"
                onClick={() => router.push(`/r/${restaurantId}/menu`)}
                className="flex-1 rounded-2xl bg-slate-800 border border-amber-500/30 py-3.5 text-xs font-extrabold text-amber-300 hover:bg-slate-700 transition-colors cursor-pointer font-['Cinzel']"
              >
                ➕ Order More
              </button>
            )}

            {!isCompleted && !isBillRequested && !isBillSent && (
              <button
                type="button"
                onClick={handleRequestBill}
                disabled={requestingBill || (sessionData?.orders?.length || 0) === 0}
                className="flex-1 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3.5 text-xs font-extrabold text-slate-950 shadow-lg font-['Cinzel'] tracking-wider disabled:opacity-50 cursor-pointer"
              >
                {requestingBill ? "Requesting Bill..." : "🧾 Request Bill"}
              </button>
            )}

            {isBillSent && !isCompleted && (
              <button
                type="button"
                onClick={paymentMethod === "ONLINE" ? handleOnlinePayment : handleCashPayment}
                disabled={paying}
                className="flex-1 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3.5 text-xs font-extrabold text-slate-950 shadow-lg font-['Cinzel'] tracking-wider disabled:opacity-50 cursor-pointer"
              >
                {paying
                  ? "Processing..."
                  : paymentMethod === "ONLINE"
                  ? `Pay Online ₹${(sessionData?.totalAmount || 0).toFixed(2)}`
                  : `Confirm Cash Payment (₹${(sessionData?.totalAmount || 0).toFixed(2)})`}
              </button>
            )}

            {isCompleted && (
              <button
                type="button"
                onClick={() => router.push(`/r/${restaurantId}`)}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-xs font-extrabold text-slate-950 font-['Cinzel']"
              >
                Back to Home / Scan New QR
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
