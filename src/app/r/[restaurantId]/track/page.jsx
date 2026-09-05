"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createApiClient } from "@/lib/api-client";
import { IconArrowLeft, IconCheck, IconSparkles } from "@/components/Icons";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function SessionTrackContent() {
  const { restaurantId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const api = createApiClient(restaurantId);

  const urlType = searchParams ? searchParams.get("type") : null;
  const urlTable = searchParams ? searchParams.get("table") : null;
  const isParcelUrl =
    urlType === "parcel" ||
    String(urlTable).trim().toUpperCase() === "PARCEL" ||
    String(urlTable).trim().toUpperCase() === "P";

  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestingBill, setRequestingBill] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("ONLINE"); // ONLINE | CASH
  const [paying, setPaying] = useState(false);

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

    // Preload Razorpay checkout script in background
    loadRazorpayScript();

    // Auto refresh active session state every 3 seconds
    const interval = setInterval(fetchSession, 3000);
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
    if (paying) return;
    setPaying(true);
    setError("");

    try {
      const checkoutData = await api.paySessionOnline();

      // Razorpay Flow
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || typeof window === "undefined" || !window.Razorpay) {
        throw new Error("Could not load Razorpay SDK. Please check your internet connection.");
      }

      const options = {
        key: checkoutData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TUtBMqf8GaZllM",
        amount: checkoutData.amount,
        currency: checkoutData.currency || "INR",
        name: checkoutData.restaurantName || "ALPHAY",
        description: `Table #${checkoutData.tableNumber} Dining Bill`,
        order_id: checkoutData.orderId,
        theme: { color: "#F59E0B" },
        handler: async function (response) {
          try {
            await api.verifySessionPayment({
              sessionId: sessionData.sessionId,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            await fetchSession();
          } catch (verErr) {
            setError(verErr.message || "Payment verification failed.");
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (resp) {
        setPaying(false);
        setError(resp.error?.description || "Payment failed. Please try again.");
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

  const isParcel = Boolean(sessionData?.isParcel || isParcelUrl);
  const isParcelHandedOver = isParcel && sessionData?.orders?.length > 0 && sessionData.orders.every((o) => o.status === "SERVED" || o.status === "COMPLETED");
  const isDineInCompleted = !isParcel && (sessionData?.status === "COMPLETED" || sessionData?.paymentStatus === "PAID");
  const isCompleted = isParcelHandedOver || isDineInCompleted;
  const isBillSent = sessionData?.status === "BILL_SENT";
  const isBillRequested = sessionData?.status === "BILL_REQUESTED";

  // LUXURY THANK YOU SCREEN AFTER PAYMENT IS DONE (ONLINE OR CASH)
  if (isCompleted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-8 text-white relative overflow-hidden">
        {/* Ambient Gold Radial Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md rounded-3xl bg-slate-900/90 border border-amber-500/40 p-7 text-center shadow-2xl backdrop-blur-xl relative z-10 space-y-5">
          {/* Golden Badge Logo */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 shadow-lg text-3xl">
            {isParcel ? "🛍️" : "👑"}
          </div>

          <div>
            <span className="inline-block rounded-full bg-amber-500/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-400 border border-amber-500/30">
              {isParcel ? "Order Handed Over ✓" : "Payment Verified ✓"}
            </span>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 font-['Cinzel'] tracking-wider leading-snug">
              {isParcel ? "Enjoy Your Meal!" : "Thank you for visiting!"}
            </h1>
          </div>

          {/* Core Thank You Text requested by user */}
          <div className="rounded-2xl bg-slate-950/80 border border-amber-500/30 p-5 shadow-inner">
            <p className="text-sm font-bold text-amber-200 leading-relaxed font-['Cinzel'] tracking-wide">
              {isParcel
                ? "Your takeaway parcel has been picked up. We hope you relish every bite!"
                : '"We hope you enjoyed and loved the meal. Come back again!"'}
            </p>
          </div>

          {/* Session Receipt Summary */}
          <div className="rounded-2xl bg-slate-950/50 p-4 border border-slate-800 text-left font-mono text-xs space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Restaurant:</span>
              <span className="font-bold text-amber-300">{sessionData?.restaurantName || "ALPHAY"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{isParcel ? "Order Type:" : "Table Number:"}</span>
              <span className="font-bold text-white">
                {isParcel
                  ? `📦 Takeaway Parcel (Token #${sessionData?.pickupToken || sessionData?.orders?.[0]?.token || "1024"})`
                  : `Table #${sessionData?.tableNumber}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Status:</span>
              <span className="font-bold text-emerald-400">PAID ({sessionData?.paymentMethod || "VERIFIED"}) ✓</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-slate-800 font-bold text-sm">
              <span className="text-amber-400 font-['Cinzel']">Total Paid Amount:</span>
              <span className="text-amber-400">₹{(sessionData?.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/r/${restaurantId}`)}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-4 text-xs font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 font-['Cinzel'] tracking-widest cursor-pointer transition-all active:scale-[0.98]"
          >
            Visit Again / Scan QR Code
          </button>
        </div>
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

  const handleCancelItem = async (orderId, itemId) => {
    if (!confirm("Are you sure you want to cancel this item?")) return;
    try {
      const res = await fetch(`/api/r/${restaurantId}/orders/${orderId}/cancel-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not cancel item.");
      await fetchSession();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this entire order?")) return;
    try {
      const res = await fetch(`/api/r/${restaurantId}/orders/${orderId}/cancel`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not cancel order.");
      await fetchSession();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white pb-36 pt-5 px-4">
      <div className="mx-auto max-w-lg">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-5">
          <button
            type="button"
            onClick={() => router.push(`/r/${restaurantId}/menu${isParcel ? "?type=parcel&table=PARCEL" : ""}`)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 border border-amber-500/30 text-amber-400 shadow-xs hover:bg-slate-800 cursor-pointer"
            aria-label="Menu"
          >
            <IconArrowLeft className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h1 className="text-lg font-black font-['Cinzel'] tracking-wider text-amber-200">
              {sessionData?.restaurantName || "ALPHAY"}
            </h1>
            {isParcel ? (
              <span className="inline-block rounded-md bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1 text-xs font-black text-slate-950 font-['Cinzel'] tracking-wider shadow-sm">
                📦 TAKEAWAY / PARCEL
              </span>
            ) : (
              <span className="inline-block rounded-md bg-gradient-to-r from-amber-500 to-amber-600 px-2.5 py-0.5 text-[10px] font-black text-slate-950 font-mono">
                TABLE #{sessionData?.tableNumber || "1"}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => router.push(`/r/${restaurantId}/menu${isParcel ? "?type=parcel&table=PARCEL" : ""}`)}
            className="flex items-center gap-1.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 px-3 py-2 text-xs font-extrabold text-amber-400 hover:bg-amber-500/30 transition-all cursor-pointer font-['Cinzel']"
          >
            <span>➕</span> {isParcel ? "Add Items" : "Continue"}
          </button>
        </div>

        {/* 4-DIGIT PARCEL PICKUP TOKEN CARD IF PARCEL */}
        {sessionData?.isParcel && (
          <div className="mb-6 rounded-3xl bg-slate-900 border-2 border-amber-400 p-5 text-center shadow-2xl space-y-2 relative overflow-hidden">
            <div className="absolute right-0 top-0 -mr-6 -mt-6 h-20 w-20 rounded-full bg-amber-500/20 blur-xl" />
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 font-['Cinzel']">
              Your Parcel Pickup Token
            </p>
            <div className="font-mono text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 tracking-wider">
              #{sessionData?.pickupToken || sessionData?.orders?.[0]?.token || "1024"}
            </div>
            <p className="text-xs text-slate-300 font-medium pt-1">
              Please quote this 4-digit number at the Parcel Counter to collect your packed order.
            </p>
          </div>
        )}

        {/* SESSION STATUS BANNER */}
        <div className="mb-6 rounded-3xl bg-slate-900/95 p-6 border border-amber-500/30 shadow-2xl backdrop-blur-xl text-center relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-6 -bottom-6 h-28 w-28 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

          {isBillSent && !sessionData?.isParcel ? (
            <div className="space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-2xl shadow-lg animate-bounce">
                🧾
              </div>
              <div>
                <span className="inline-block rounded-full bg-amber-500/15 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-400 border border-amber-500/30 font-['Cinzel']">
                  Bill Ready for Payment
                </span>
                <h2 className="text-xl font-extrabold text-amber-300 font-['Cinzel'] tracking-wide mt-1.5">
                  Dining Bill Received!
                </h2>
                <p className="mt-1 text-xs text-slate-300">
                  Manager has dispatched your table bill. Select your payment method below to complete dining.
                </p>
              </div>
            </div>
          ) : isBillRequested && !sessionData?.isParcel ? (
            <div className="space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-2xl shadow-lg animate-pulse">
                ⏳
              </div>
              <div>
                <span className="inline-block rounded-full bg-amber-500/15 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-400 border border-amber-500/30 font-['Cinzel']">
                  Bill Requested
                </span>
                <h2 className="text-xl font-extrabold text-amber-300 font-['Cinzel'] tracking-wide mt-1.5">
                  Requesting Final Bill...
                </h2>
                <p className="mt-1 text-xs text-slate-300">
                  Manager has been notified to review and dispatch your table bill.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-2xl shadow-lg shadow-emerald-500/15">
                {sessionData?.isParcel ? "📦" : "👨‍🍳"}
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-3.5 py-1 text-[11px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/40 font-['Cinzel'] shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  {sessionData?.isParcel
                    ? "Parcel Confirmed & Kitchen Packing"
                    : "Order Confirmed & Kitchen Preparing!"}
                </span>
                <h2 className="mt-2 text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 font-['Cinzel'] tracking-wide">
                  {sessionData?.isParcel ? "Preparing Your Takeaway" : "Your Order is Being Prepared"}
                </h2>
                <p className="mt-1 text-xs text-slate-300 font-medium">
                  {sessionData?.isParcel
                    ? "Kitchen team is packaging your fresh dishes for pickup."
                    : "The kitchen team has confirmed your table order and is cooking your dishes now."}
                </p>
              </div>

              {/* 3-STEP REAL-TIME PROGRESS INDICATOR */}
              <div className="pt-2 grid grid-cols-3 gap-2 text-center text-[10px] font-bold font-['Cinzel']">
                <div className="rounded-xl bg-slate-950/80 border border-emerald-500/30 p-2 text-emerald-400">
                  <span className="block text-sm mb-0.5">💳</span>
                  <span>{sessionData?.isParcel ? "Paid & Placed ✓" : "Order Placed ✓"}</span>
                </div>
                <div className="rounded-xl bg-amber-500/15 border border-amber-500/40 p-2 text-amber-300 ring-1 ring-amber-400/30">
                  <span className="block text-sm mb-0.5">🔥</span>
                  <span>{sessionData?.isParcel ? "Kitchen Packing" : "Cooking Live"}</span>
                </div>
                <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-2 text-slate-400">
                  <span className="block text-sm mb-0.5">{sessionData?.isParcel ? "🛍️" : "🍽️"}</span>
                  <span>{sessionData?.isParcel ? "Ready for Pickup" : "Served to Table"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SESSION PREVIOUS ORDERS DATA */}
        <section className="mb-6">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-3 font-['Cinzel'] flex items-center justify-between">
            <span>Orders Placed ({sessionData?.orders?.length || 0})</span>
            <span className="text-[10px] text-slate-400 font-mono">{sessionData?.totalItemsCount || 0} items</span>
          </h2>

          {sessionData?.orders?.length === 0 ? (
            <div className="rounded-2xl bg-slate-900 p-6 text-center border border-amber-500/20 text-xs font-semibold text-slate-400">
              No orders placed yet in this session.
            </div>
          ) : (
            <div className="space-y-4">
              {sessionData?.orders?.map((ord, idx) => {
                const canCancelOrder = ord.status !== "SERVED" && ord.status !== "PAID" && ord.status !== "CANCELLED";

                return (
                  <div key={ord.id} className="rounded-2xl bg-slate-900 p-4 border border-amber-500/20 shadow-md">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                      <span className="font-mono text-xs font-bold text-amber-400">
                        Order #{ord.orderSeq ? ord.orderSeq : idx + 1} · {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-black text-emerald-400 border border-emerald-500/40 font-['Cinzel']">
                          Order Confirmed ✓
                        </span>
                        {canCancelOrder && (
                          <button
                            type="button"
                            onClick={() => handleCancelOrder(ord.id)}
                            className="rounded-full bg-rose-950/80 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/40 hover:bg-rose-900 cursor-pointer font-['Cinzel']"
                          >
                            Cancel Order ✕
                          </button>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-2 text-xs font-semibold text-slate-200">
                      {ord.items.map((it) => (
                        <li key={it.id} className="flex justify-between items-center py-1">
                          <div>
                            <span className="font-extrabold text-amber-400 mr-2 font-mono">{it.quantity}×</span>
                            <span className={it.isCancelled ? "line-through text-slate-500" : "text-white font-['Cinzel']"}>
                              {it.name}
                            </span>
                            {it.notes && (
                              <p className="text-[10px] font-medium text-slate-400 pl-5">Note: {it.notes}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-300">₹{(it.price * it.quantity).toFixed(2)}</span>
                            {it.isCancelled ? (
                              <span className="rounded-full bg-rose-950/80 px-2 py-0.5 text-[9px] font-black text-rose-400 border border-rose-500/40 font-['Cinzel']">
                                CANCELLED ✕
                              </span>
                            ) : canCancelOrder ? (
                              <button
                                type="button"
                                onClick={() => handleCancelItem(ord.id, it.id)}
                                className="rounded-full bg-rose-950/60 px-2 py-0.5 text-[9px] font-bold text-rose-300 border border-rose-500/30 hover:bg-rose-900 cursor-pointer font-['Cinzel']"
                                title="Cancel this specific item"
                              >
                                Cancel Item
                              </button>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex justify-between text-xs font-bold text-slate-400">
                      <span>Order Subtotal</span>
                      <span className="font-mono text-white">₹{ord.total.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* COMBINED BILL SUMMARY */}
        <section className="mb-6 rounded-2xl bg-slate-900 p-5 shadow-sm border border-amber-500/20">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 font-['Cinzel']">
              {sessionData?.isParcel ? "Parcel Order Summary" : "Combined Session Bill"}
            </h2>
            {sessionData?.isParcel && (
              <span className="rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-black text-emerald-400 border border-emerald-500/40 font-['Cinzel']">
                PAID ONLINE ✓
              </span>
            )}
          </div>
          <div className="flex justify-between text-xs font-bold text-slate-400">
            <span>{sessionData?.isParcel ? "Items Subtotal" : "Session Items Subtotal"}</span>
            <span className="font-mono tabular-nums text-white">₹{(sessionData?.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="mt-2 flex justify-between text-xs font-bold text-slate-400">
            <span>Taxes & GST ({sessionData?.gstPercent || 5}%)</span>
            <span className="font-mono tabular-nums text-white">₹{(sessionData?.gstAmount || 0).toFixed(2)}</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-base font-extrabold text-white">
            <span className="font-['Cinzel']">{sessionData?.isParcel ? "Total Paid" : "Total Amount Payable"}</span>
            <span className="font-mono text-xl font-black text-amber-400 tabular-nums">
              ₹{(sessionData?.totalAmount || 0).toFixed(2)}
            </span>
          </div>
        </section>

        {/* PAYMENT OPTIONS (IF BILL SENT AND NOT PARCEL) */}
        {isBillSent && !sessionData?.isParcel && (
          <section className="mb-6 rounded-2xl bg-slate-900 p-5 border border-amber-500/30 shadow-lg">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-3 font-['Cinzel']">
              Select Payment Option
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("ONLINE")}
                className={`relative flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${paymentMethod === "ONLINE"
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
                <span className="text-[10px] text-slate-400">UPI / Cards / NetBanking</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`relative flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${paymentMethod === "CASH"
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
                ℹ️ Please pay <strong>₹{(sessionData?.totalAmount || 0).toFixed(2)}</strong> in cash to your waiter or at the counter. Once manager confirms payment, your screen will update automatically.
              </div>
            )}
          </section>
        )}

        {error && (
          <p className="mb-4 rounded-xl bg-rose-500/20 border border-rose-500/40 p-3 text-xs font-bold text-rose-300 text-center">
            {error}
          </p>
        )}

        {/* BOTTOM ACTION BUTTONS */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-amber-500/20 bg-slate-900/95 px-4 py-4 backdrop-blur-md">
          <div className="mx-auto max-w-lg flex gap-3">
            {sessionData?.isParcel ? (
              <button
                type="button"
                onClick={() => router.push(`/r/${restaurantId}/menu?type=parcel&table=PARCEL`)}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-4 text-xs font-black text-slate-950 shadow-lg font-['Cinzel'] tracking-wider cursor-pointer transition-all active:scale-[0.98]"
              >
                ➕ Add More Items to Parcel
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => router.push(`/r/${restaurantId}/menu`)}
                  className="flex-1 rounded-2xl bg-slate-800 border border-amber-500/30 py-3.5 text-xs font-extrabold text-amber-300 hover:bg-slate-700 transition-colors cursor-pointer font-['Cinzel']"
                >
                  ➕ Order More
                </button>

                {!isBillRequested && !isBillSent && (
                  <button
                    type="button"
                    onClick={handleRequestBill}
                    disabled={requestingBill || (sessionData?.orders?.length || 0) === 0}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3.5 text-xs font-extrabold text-slate-950 shadow-lg font-['Cinzel'] tracking-wider disabled:opacity-50 cursor-pointer"
                  >
                    {requestingBill ? "Requesting..." : "🧾 Request Bill"}
                  </button>
                )}

                {isBillSent && (
                  <button
                    type="button"
                    onClick={paymentMethod === "ONLINE" ? handleOnlinePayment : handleCashPayment}
                    disabled={paying}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3.5 text-xs font-extrabold text-slate-950 shadow-lg font-['Cinzel'] tracking-wider disabled:opacity-50 cursor-pointer"
                  >
                    {paying
                      ? "Launching Razorpay..."
                      : paymentMethod === "ONLINE"
                        ? `Pay Online ₹${(sessionData?.totalAmount || 0).toFixed(2)}`
                        : `Confirm Cash Payment (₹${(sessionData?.totalAmount || 0).toFixed(2)})`}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SessionTrackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 text-amber-400 font-['Cinzel'] font-bold text-sm">
          Loading Parcel & Session...
        </main>
      }
    >
      <SessionTrackContent />
    </Suspense>
  );
}
