"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createApiClient } from "@/lib/api-client";
import LuxuryLandingShowcase from "@/components/LuxuryLandingShowcase";
import { IconUtensils, IconArrowRight, IconSparkles, IconClock, IconQrCode, IconArrowLeft } from "@/components/Icons";

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
  
  // Show luxury landing showcase by default; clicking EXPLORE MENU shows table input form modal
  const [showTableForm, setShowTableForm] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    api
      .getInfo()
      .then(setRestaurant)
      .catch(() => setRestaurant({ name: "ALPHAX Dining" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const [geoState, setGeoState] = useState({ status: "idle", message: "" });

  const getCoordinates = () => {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }
      setGeoState({ status: "locating", message: "Acquiring GPS location..." });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoState({ status: "success", message: "Location verified" });
          resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        (err) => {
          let msg = "Location permission is required to verify you are physically inside the restaurant's ordering radius.";
          if (err.code === err.PERMISSION_DENIED) {
            msg = "Location access was denied. Please allow location access in your browser settings to continue.";
          }
          setGeoState({ status: "error", message: msg });
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

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
      const coords = await getCoordinates();
      await api.startSession({
        tableNumber: cleanTable,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      router.push(`/r/${restaurantId}/menu`);
    } catch (err) {
      setError(err.message || "Table not found. Please check your table number.");
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center">
      {/* Luxury Landing Showcase Component */}
      <LuxuryLandingShowcase
        restaurantName={restaurant?.name}
        onProceed={() => setShowTableForm(true)}
      />

      {/* TABLE NUMBER ENTRY MODAL OVERLAY */}
      {showTableForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/30 p-7 text-white shadow-2xl relative">
            {/* Back Arrow Button */}
            <button
              type="button"
              onClick={() => setShowTableForm(false)}
              className="absolute left-6 top-6 flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              <IconArrowLeft className="h-4 w-4" /> Back to Home
            </button>

            <div className="text-center pt-2">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 shadow-lg">
                {restaurant?.logoUrl ? (
                  <img src={restaurant.logoUrl} alt={restaurant.name} className="h-9 w-9 object-contain" />
                ) : (
                  <IconUtensils className="h-7 w-7 text-slate-950" />
                )}
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3.5 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                <IconSparkles className="h-3.5 w-3.5" /> WELCOME TO
              </span>

              <h2 className="mt-2 text-2xl font-extrabold text-white tracking-tight font-['Cinzel']">
                {restaurant?.name || "ALPHAX Dining"}
              </h2>

              <p className="mt-1.5 text-xs font-medium text-slate-400">
                Enter your dining table number to verify location & explore digital menu.
              </p>
            </div>

            {/* Feature Badges */}
            <div className="mt-5 flex justify-center gap-2 text-[11px] font-semibold text-slate-300">
              <span className="flex items-center gap-1 rounded-lg bg-slate-800/80 border border-slate-700 px-2.5 py-1">
                <IconQrCode className="h-3.5 w-3.5 text-amber-400" /> Instant QR Menu
              </span>
              <span className="flex items-center gap-1 rounded-lg bg-slate-800/80 border border-slate-700 px-2.5 py-1">
                <IconClock className="h-3.5 w-3.5 text-emerald-400" /> Direct Kitchen
              </span>
            </div>

            {/* Table Number Form */}
            <form onSubmit={handleContinue} className="mt-6 space-y-4">
              <div>
                <label htmlFor="table-input" className="block text-xs font-bold uppercase tracking-wider text-amber-300">
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
                  className="mt-2 w-full rounded-2xl border border-amber-500/30 bg-slate-950 px-4 py-3.5 text-center text-xl font-extrabold text-white placeholder:text-slate-600 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-500/20 transition-all"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-950/70 border border-red-800 p-3 text-xs font-bold text-red-300 text-center">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!tableNumber.trim() || submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-4 text-sm font-extrabold text-slate-950 shadow-lg shadow-amber-500/25 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    {geoState.status === "locating" ? "Verifying GPS Location..." : "Opening Menu..."}
                  </span>
                ) : (
                  <>
                    <span>Enter Table & View Menu</span>
                    <IconArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-[11px] text-slate-500 font-medium">
              📍 GPS location verification required inside restaurant radius.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerLandingPage() {
  return (
    <main className="min-h-screen w-full bg-slate-950 text-white transition-colors">
      <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-amber-400 text-sm font-bold">
          Loading Restaurant Experience...
        </div>
      }>
        <LandingFormInner />
      </Suspense>
    </main>
  );
}
