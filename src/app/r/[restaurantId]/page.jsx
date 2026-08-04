"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { createApiClient } from "@/lib/api-client";

const STATE = {
  IDLE: "idle",
  LOCATING: "locating",
  SUBMITTING: "submitting",
  ERROR: "error",
};

function WelcomeForm() {
  const { restaurantId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const api = createApiClient(restaurantId);

  const [restaurant, setRestaurant] = useState(null);
  const [tableNumber, setTableNumber] = useState(searchParams.get("table") || "");
  const [state, setState] = useState(STATE.IDLE);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getInfo()
      .then(setRestaurant)
      .catch(() => setRestaurant({ name: "ALPHAY" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinue = async (e) => {
    if (e) e.preventDefault();
    if (!tableNumber.trim()) return;
    setError("");

    if (!("geolocation" in navigator)) {
      setError("Your browser doesn't support geolocation, which is required to verify you are at the restaurant.");
      setState(STATE.ERROR);
      return;
    }

    setState(STATE.LOCATING);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setState(STATE.SUBMITTING);
        try {
          await api.startSession({
            tableNumber: tableNumber.trim(),
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          router.push(`/r/${restaurantId}/menu`);
        } catch (err) {
          setError(err.message || "Could not verify your location at this restaurant. Please try again.");
          setState(STATE.ERROR);
        }
      },
      (geoErr) => {
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setError("Location permission denied. Please allow location access in your browser settings so we can verify you're at the restaurant.");
        } else {
          setError("Unable to retrieve your current location. Please ensure location services are enabled and try again.");
        }
        setState(STATE.ERROR);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const busy = state === STATE.LOCATING || state === STATE.SUBMITTING;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-sm text-center"
    >
      <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple text-3xl text-white shadow-lift">
        🍽️
      </div>
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-purple">
        ALPHAY
      </p>
      <h1 className="mt-1 font-display text-3xl font-medium text-ink">
        {restaurant?.name || "Welcome"}
      </h1>
      <p className="mt-2 text-sm text-ink2">
        Please enter your table number to begin your dining experience.
      </p>

      <form
        onSubmit={handleContinue}
        className="mt-8 rounded-card bg-white p-6 text-left shadow-lift"
      >
        <label htmlFor="table" className="text-xs font-semibold uppercase tracking-wide text-ink2">
          Table Number
        </label>
        <input
          id="table"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
          type="text"
          inputMode="text"
          placeholder="e.g. 12"
          autoFocus
          className="mt-2 w-full rounded-xl border border-purple/15 bg-cream px-4 py-3 text-lg font-semibold text-ink placeholder:text-ink2/60 focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/20"
        />

        {error && (
          <div className="mt-4 rounded-xl border border-nonveg/20 bg-nonveg-tint p-3.5 text-xs text-nonveg leading-relaxed">
            <p className="font-semibold">📍 Location Verification Notice</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!tableNumber.trim() || busy}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-purple py-3.5 text-sm font-semibold text-white shadow-soft transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {state === STATE.LOCATING && "Verifying your location…"}
          {state === STATE.SUBMITTING && "Confirming table session…"}
          {(state === STATE.IDLE || state === STATE.ERROR) && "Continue"}
        </button>
        <p className="mt-3 text-center text-xs text-ink2">
          GPS location is verified to ensure ordering is permitted only within {restaurant?.name || "the restaurant"}'s premises.
        </p>
      </form>
    </motion.div>
  );
}

export default function WelcomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-50 to-cream px-6">
      <Suspense fallback={<div className="text-sm text-ink2">Loading…</div>}>
        <WelcomeForm />
      </Suspense>
    </main>
  );
}
