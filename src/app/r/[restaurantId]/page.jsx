"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createApiClient } from "@/lib/api-client";
import { IconUtensils, IconArrowRight, IconSparkles, IconClock, IconQrCode } from "@/components/Icons";

function LandingFormInner() {
  const { restaurantId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const api = createApiClient(restaurantId);

  const initialTable = searchParams ? searchParams.get("table") || "" : "";
  const [restaurant, setRestaurant] = useState(null);
  const [tableNumber, setTableNumber] = useState(initialTable);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!restaurantId) return;
    api
      .getInfo()
      .then(setRestaurant)
      .catch(() => setRestaurant({ name: "ALPHAX Dining" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const handleContinue = async (e) => {
    if (e) e.preventDefault();
    const cleanTable = tableNumber.trim();
    if (!cleanTable) {
      setError("Please enter your table number to proceed.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      await api.startSession({ tableNumber: cleanTable });
      router.push(`/r/${restaurantId}/menu`);
    } catch (err) {
      setError(err.message || "Table not found. Please check your table number.");
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-3xl bg-white dark:bg-zinc-900 p-8 shadow-xl border border-slate-200 dark:border-zinc-800 transition-colors">
        {/* Header Icon & Brand */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
            {restaurant?.logoUrl ? (
              <img src={restaurant.logoUrl} alt={restaurant.name} className="h-10 w-10 object-contain" />
            ) : (
              <IconUtensils className="h-8 w-8 text-white" />
            )}
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-zinc-800 px-3.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-zinc-700">
            <IconSparkles className="h-3.5 w-3.5" /> WELCOME TO
          </span>

          <h1 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {restaurant?.name || "ALPHAX Dining"}
          </h1>

          <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400">
            Enter your dining table number to view our digital menu and place your order.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="mt-6 flex justify-center gap-2 text-[11px] font-semibold text-slate-600 dark:text-zinc-300">
          <span className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-zinc-800 px-2.5 py-1">
            <IconQrCode className="h-3.5 w-3.5 text-indigo-600" /> QR Ordering
          </span>
          <span className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-zinc-800 px-2.5 py-1">
            <IconClock className="h-3.5 w-3.5 text-emerald-600" /> Instant Kitchen
          </span>
        </div>

        {/* Manual Table Number Input Form */}
        <form onSubmit={handleContinue} className="mt-6 space-y-4">
          <div>
            <label htmlFor="table-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              Table Number
            </label>
            <input
              id="table-input"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              type="text"
              inputMode="text"
              placeholder="e.g. 12 or P1"
              autoFocus
              className="mt-2 w-full rounded-2xl border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 px-4 py-3.5 text-center text-xl font-extrabold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:border-indigo-600 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 transition-all"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 p-3 text-xs font-bold text-red-600 dark:text-red-300 text-center">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!tableNumber.trim() || submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 py-4 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Validating Table...
              </span>
            ) : (
              <>
                <span>Enter Table & View Menu</span>
                <IconArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
          Simple touchless dining. No location permission required.
        </p>
      </div>
    </div>
  );
}

export default function CustomerLandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 px-4 py-12 transition-colors">
      <Suspense fallback={
        <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 p-8 text-center text-sm font-bold text-slate-500 shadow-xl border border-slate-200 dark:border-zinc-800">
          Loading Restaurant Menu...
        </div>
      }>
        <LandingFormInner />
      </Suspense>
    </main>
  );
}
