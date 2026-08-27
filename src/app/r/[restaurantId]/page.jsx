"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createApiClient } from "@/lib/api-client";
import LuxuryLandingShowcase from "@/components/LuxuryLandingShowcase";

function LandingFormInner() {
  const { restaurantId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const api = createApiClient(restaurantId);

  // Automatically detect table from QR code URL parameter (e.g. ?table=5) or default to "12"
  const urlTable = searchParams ? searchParams.get("table") : null;
  const tableNumber = urlTable || "12";

  const [restaurant, setRestaurant] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [distanceError, setDistanceError] = useState(null);
  const [activeSessionInfo, setActiveSessionInfo] = useState(null);

  useEffect(() => {
    if (!restaurantId) return;
    api
      .getInfo()
      .then(setRestaurant)
      .catch(() => setRestaurant({ name: "ALPHAY", latitude: 17.4239, longitude: 78.4738 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const getCoordinates = () => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("geolocation" in navigator)) {
        resolve({
          latitude: restaurant?.latitude || 17.4239,
          longitude: restaurant?.longitude || 78.4738,
          accuracy: 50,
          fallback: true,
        });
        return;
      }

      // Try 1: High accuracy GPS with 5s timeout
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy || 0,
            fallback: false,
          }),
        () => {
          // Try 2: Standard Wi-Fi / Cell positioning with 4s timeout
          navigator.geolocation.getCurrentPosition(
            (pos) =>
              resolve({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy || 50,
                fallback: false,
              }),
            () => {
              // Fallback: If device GPS times out or is blocked on HTTP, fallback gracefully
              resolve({
                latitude: restaurant?.latitude || 17.4239,
                longitude: restaurant?.longitude || 78.4738,
                accuracy: 50,
                fallback: true,
              });
            },
            { enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 }
          );
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
      );
    });
  };

  // Click handler when customer taps EXPLORE MENU
  const handleExploreMenu = async () => {
    if (submitting) return;
    setSubmitting(true);
    setDistanceError(null);
    setActiveSessionInfo(null);

    try {
      // Step 1: Check if table has an active session
      const checkRes = await api.checkSession(tableNumber).catch(() => ({ hasActiveSession: false }));
      if (checkRes.hasActiveSession && checkRes.activeSession) {
        setActiveSessionInfo(checkRes.activeSession);
        setSubmitting(false);
        return;
      }

      // Step 2: No active session -> start new session and open menu
      await startNewSession(false);
    } catch (err) {
      setSubmitting(false);
      setDistanceError(err.message || "Unable to start dining session.");
    }
  };

  const startNewSession = async (bypass = false) => {
    setSubmitting(true);
    setDistanceError(null);
    setActiveSessionInfo(null);

    try {
      const coords = bypass
        ? { latitude: restaurant?.latitude || 17.4239, longitude: restaurant?.longitude || 78.4738, accuracy: 50, fallback: true }
        : await getCoordinates();

      await api.startSession({
        tableNumber,
        action: "new",
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        bypassGeofence: bypass || coords.fallback,
      });

      router.push(`/r/${restaurantId}/menu`);
      setTimeout(() => {
        window.location.href = `/r/${restaurantId}/menu`;
      }, 300);
    } catch (err) {
      setSubmitting(false);
      if (err.data?.error === "outside_geofence" || err.message?.includes("away from")) {
        setDistanceError(
          err.data?.message ||
            err.message ||
            "You are currently outside the restaurant premises. Digital table ordering is restricted to guests inside the restaurant."
        );
      } else {
        setDistanceError(err.message || "Unable to verify table presence.");
      }
    }
  };

  const joinExistingSession = async () => {
    if (!activeSessionInfo) return;
    setSubmitting(true);
    try {
      await api.startSession({
        tableNumber,
        action: "join",
        sessionId: activeSessionInfo.id,
      });
      router.push(`/r/${restaurantId}/menu`);
      setTimeout(() => {
        window.location.href = `/r/${restaurantId}/menu`;
      }, 300);
    } catch (err) {
      setSubmitting(false);
      setDistanceError(err.message || "Could not join existing session.");
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

      {/* ACTIVE DINING SESSION MODAL (CONTINUE VS NEW) */}
      {activeSessionInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/40 p-6 sm:p-7 text-center text-white shadow-2xl relative">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-2xl animate-pulse">
              🍽️
            </div>

            <span className="inline-block rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-amber-400 border border-amber-500/20 mb-2">
              Table #{tableNumber} Status
            </span>

            <h2 className="text-xl font-extrabold text-white font-['Cinzel'] tracking-wide">
              Active Dining Session Found
            </h2>

            <p className="mt-1 text-xs font-semibold text-slate-300">
              There is an active dining session in progress on Table #{tableNumber}.
            </p>

            <div className="my-4 rounded-2xl bg-slate-950 border border-amber-500/30 p-4 text-left font-mono text-xs space-y-1.5 text-amber-200">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Orders Placed:</span>
                <span className="font-bold text-white">{activeSessionInfo.orderCount} Order{activeSessionInfo.orderCount === 1 ? "" : "s"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dishes Ordered:</span>
                <span className="font-bold text-white">{activeSessionInfo.totalItemsCount} items</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-sm">
                <span className="text-amber-400 font-['Cinzel']">Current Bill Amount:</span>
                <span className="text-amber-400">₹{activeSessionInfo.totalAmount?.toFixed(2) || "0.00"}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Option 1: Ongoing Dining */}
              <button
                type="button"
                onClick={joinExistingSession}
                disabled={submitting}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3.5 text-xs font-extrabold text-slate-950 shadow-lg font-['Cinzel'] tracking-wider cursor-pointer flex flex-col items-center justify-center transition-all active:scale-95 disabled:opacity-50"
              >
                <span className="text-sm font-black">1. Ongoing Dining</span>
                <span className="text-[10px] font-bold opacity-80">Join existing session & view your orders</span>
              </button>

              {/* Option 2: New Dining */}
              <button
                type="button"
                onClick={() => startNewSession(true)}
                disabled={submitting}
                className="w-full rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-3 text-xs font-bold text-slate-200 transition-colors cursor-pointer flex flex-col items-center justify-center disabled:opacity-50"
              >
                <span className="text-xs font-bold">2. Start Fresh Dining</span>
                <span className="text-[10px] font-medium text-slate-400">Clear old session & start a new visit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOCATION / DISTANCE OVERRIDE MODAL */}
      {distanceError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-lg animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/40 p-7 text-center text-white shadow-2xl relative">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-2xl animate-pulse">
              📍
            </div>

            <h2 className="text-xl font-extrabold text-white font-['Cinzel'] tracking-wide">
              Location Verification
            </h2>

            <div className="my-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs font-bold text-amber-200 leading-relaxed text-left">
              {distanceError}
            </div>

            <p className="text-xs font-medium text-slate-400 mb-6">
              Digital table ordering confirms you are dining at {restaurant?.name || "the restaurant"}.
            </p>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => startNewSession(true)}
                disabled={submitting}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3.5 text-xs font-extrabold text-slate-950 shadow-lg font-['Cinzel'] tracking-wider cursor-pointer active:scale-95 disabled:opacity-50"
              >
                🚀 Open Menu Directly
              </button>

              <button
                type="button"
                onClick={handleExploreMenu}
                disabled={submitting}
                className="w-full rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-3 text-xs font-bold text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                🔄 Retry GPS Verification
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
