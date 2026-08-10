"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createApiClient } from "@/lib/api-client";
import LuxuryLandingShowcase from "@/components/LuxuryLandingShowcase";
import { IconArrowLeft } from "@/components/Icons";

function LandingFormInner() {
  const { restaurantId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const api = createApiClient(restaurantId);

  // Automatically extract table from QR code URL parameter or default to "1"
  const urlTable = searchParams ? searchParams.get("table") : null;
  const tableNumber = urlTable || "1";
  const [restaurant, setRestaurant] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [distanceError, setDistanceError] = useState(null);

  useEffect(() => {
    if (!restaurantId) return;
    api
      .getInfo()
      .then(setRestaurant)
      .catch(() => setRestaurant({ name: "ALPHAY" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const getCoordinates = () => {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => {
          let msg = "Location permission is required to verify you are physically inside the restaurant's ordering radius.";
          if (err.code === err.PERMISSION_DENIED) {
            msg = "Location access was denied. Please allow location access in your browser settings to continue.";
          }
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  // DIRECT MENU OPENING WITH STRICT LOCATION DISTANCE CHECK
  const handleExploreMenu = async () => {
    if (submitting) return;
    setSubmitting(true);
    setDistanceError(null);

    try {
      const coords = await getCoordinates();
      await api.startSession({
        tableNumber,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      // Session validated within geofence -> open menu!
      router.push(`/r/${restaurantId}/menu`);
    } catch (err) {
      setSubmitting(false);
      // Display exact distance details if user is far away or location denied
      setDistanceError(err.message || "Unable to verify your location inside the restaurant.");
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white">
      {/* Luxury Landing Showcase Component */}
      <LuxuryLandingShowcase
        restaurantName={restaurant?.name}
        onProceed={handleExploreMenu}
        submitting={submitting}
      />

      {/* FULLSCREEN DISTANCE / LOCATION WARNING SCREEN WHEN USER IS FAR AWAY */}
      {distanceError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/40 p-7 text-center text-white shadow-2xl relative">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-2xl animate-pulse">
              📍
            </div>

            <h2 className="text-xl font-extrabold text-white font-['Cinzel'] tracking-wide">
              Location Verification Required
            </h2>

            {/* Exact Distance Warning Details */}
            <div className="my-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs font-bold text-amber-200 leading-relaxed">
              {distanceError}
            </div>

            <p className="text-xs font-medium text-slate-400 mb-6">
              To prevent fraudulent orders, digital table ordering is strictly restricted to guests inside the restaurant premises.
            </p>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleExploreMenu}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3.5 text-xs font-extrabold text-slate-950 shadow-lg font-['Cinzel'] tracking-wider cursor-pointer"
              >
                🔄 Refresh Location & Try Again
              </button>

              <button
                type="button"
                onClick={() => setDistanceError(null)}
                className="w-full rounded-2xl bg-slate-800 hover:bg-slate-700 py-3 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
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
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-amber-400 text-sm font-bold font-['Cinzel'] tracking-widest">
          Loading ALPHAY Experience...
        </div>
      }>
        <LandingFormInner />
      </Suspense>
    </main>
  );
}
