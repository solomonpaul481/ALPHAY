"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createApiClient } from "@/lib/api-client";

function WelcomeForm() {
  const { restaurantId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const api = createApiClient(restaurantId);

  const [restaurant, setRestaurant] = useState(null);
  const [tableNumber, setTableNumber] = useState(searchParams.get("table") || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getInfo()
      .then(setRestaurant)
      .catch(() => setRestaurant({ name: "ALPHAX Restaurant" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinue = async (e) => {
    if (e) e.preventDefault();
    const cleanTable = tableNumber.trim();
    if (!cleanTable) return;
    setError("");
    setSubmitting(true);

    try {
      await api.startSession({
        tableNumber: cleanTable,
      });
      router.push(`/r/${restaurantId}/menu`);
    } catch (err) {
      setError(err.message || "Invalid table number. Please check your table and try again.");
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-sm"
    >
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-purple shadow-lift">
          {restaurant?.logoUrl ? (
            <img src={restaurant.logoUrl} alt={restaurant.name} className="h-12 w-12 object-contain" />
          ) : (
            <span className="text-4xl text-white">🍽️</span>
          )}
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-purple">
          ALPHAX
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-ink">
          Welcome to {restaurant?.name || "our Restaurant"}
        </h1>
        <p className="mt-2 text-sm text-ink2">
          Please enter your table number to start your order.
        </p>
      </div>

      <form
        onSubmit={handleContinue}
        className="mt-8 rounded-card bg-white p-6 shadow-lift border border-purple-50"
      >
        <label htmlFor="table" className="block text-xs font-bold uppercase tracking-wider text-ink2">
          Table Number
        </label>
        <input
          id="table"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          type="text"
          inputMode="text"
          placeholder="Enter Table Number (e.g. 12)"
          autoFocus
          className="mt-2.5 w-full rounded-2xl border border-purple/20 bg-purple-50/40 px-4 py-3.5 text-center text-xl font-bold text-ink placeholder:text-ink2/40 placeholder:font-normal focus:border-purple focus:bg-white focus:outline-none focus:ring-4 focus:ring-purple/10 transition-all"
        />

        {error && (
          <div className="mt-4 rounded-xl bg-nonveg-tint p-3.5 text-xs font-semibold text-nonveg leading-relaxed text-center">
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!tableNumber.trim() || submitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-purple py-4 text-base font-semibold text-white shadow-lift transition-all hover:bg-purple-deep active:scale-[0.98] disabled:opacity-50"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Validating Table...
            </span>
          ) : (
            "Continue →"
          )}
        </button>
      </form>
    </motion.div>
  );
}

export default function WelcomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-50/60 via-cream to-white px-6 py-12">
      <Suspense fallback={<div className="text-sm text-ink2">Loading...</div>}>
        <WelcomeForm />
      </Suspense>
    </main>
  );
}
