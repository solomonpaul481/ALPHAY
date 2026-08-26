"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createApiClient } from "@/lib/api-client";
import { motion, AnimatePresence } from "framer-motion";

function LandingFormInner() {
  const { restaurantId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const api = createApiClient(restaurantId);

  // Extract table from QR code URL parameter (e.g. ?table=5) or default to "12"
  const urlTable = searchParams ? searchParams.get("table") : null;
  const tableNumber = urlTable || "12";

  const [restaurant, setRestaurant] = useState(null);
  const [phase, setPhase] = useState("LOCATING"); // LOCATING | ACTIVE_SESSION_FOUND | OUTSIDE_GEOFENCE | PERMISSION_REQUIRED | READY
  const [statusMessage, setStatusMessage] = useState("Verifying your location at restaurant...");
  const [distanceInfo, setDistanceInfo] = useState(null);
  const [activeSessionInfo, setActiveSessionInfo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const hasInitiatedRef = useRef(false);

  useEffect(() => {
    if (!restaurantId || hasInitiatedRef.current) return;
    hasInitiatedRef.current = true;

    initiateAutoVerification();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const initiateAutoVerification = async () => {
    setPhase("LOCATING");
    setStatusMessage("Connecting to restaurant & checking table status...");
    setDistanceInfo(null);

    let restData = null;
    try {
      restData = await api.getInfo();
      setRestaurant(restData);
    } catch {
      restData = { name: "ALPHAY", latitude: 17.4239, longitude: 78.4738, geofenceRadiusMeters: 150 };
      setRestaurant(restData);
    }

    // Step 1: Check if table has an active session
    try {
      const checkRes = await api.checkSession(tableNumber).catch(() => ({ hasActiveSession: false }));
      if (checkRes.hasActiveSession) {
        setActiveSessionInfo(checkRes.activeSession);
        setPhase("ACTIVE_SESSION_FOUND");
        return;
      }
    } catch (err) {
      console.warn("Session check error:", err);
    }

    // Step 2: Acquire location and verify presence at restaurant
    await verifyAndOpenMenu(restData);
  };

  const getCoordinates = () => {
    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("geolocation" in navigator)) {
        resolve({ error: "Geolocation is not supported by your browser." });
        return;
      }

      let settled = false;
      const timeoutTimer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve({ error: "GPS timeout. Please enable location services." });
        }
      }, 6000);

      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!settled) {
              settled = true;
              clearTimeout(timeoutTimer);
              resolve({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
              });
            }
          },
          (err) => {
            if (!settled) {
              settled = true;
              clearTimeout(timeoutTimer);
              resolve({ error: err.message || "Location permission denied." });
            }
          },
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 10000 }
        );
      } catch (err) {
        if (!settled) {
          settled = true;
          clearTimeout(timeoutTimer);
          resolve({ error: "Could not access location." });
        }
      }
    });
  };

  const verifyAndOpenMenu = async (restData, bypass = false) => {
    setIsProcessing(true);
    setStatusMessage("Accessing your location to verify restaurant presence...");

    const coords = await getCoordinates();

    if (coords.error && !bypass) {
      setIsProcessing(false);
      setPhase("PERMISSION_REQUIRED");
      setStatusMessage("Location permission is needed to confirm you are dining at the table.");
      return;
    }

    setStatusMessage("Verifying table presence & opening menu...");

    try {
      const payload = {
        tableNumber,
        action: "new",
        latitude: coords.latitude || restData?.latitude || 17.4239,
        longitude: coords.longitude || restData?.longitude || 78.4738,
        bypassGeofence: bypass,
      };

      await api.startSession(payload);

      // Successfully verified and created session -> open menu immediately!
      setStatusMessage("Location verified ✓ Opening menu...");
      window.location.href = `/r/${restaurantId}/menu`;
    } catch (err) {
      setIsProcessing(false);
      if (err.data?.error === "outside_geofence" || err.message?.includes("away from")) {
        setPhase("OUTSIDE_GEOFENCE");
        setDistanceInfo({
          message: err.data?.message || err.message || "You are outside the restaurant location.",
          distance: err.data?.distanceMeters,
          allowed: err.data?.allowedRadiusMeters,
        });
      } else {
        // Fallback retry
        setPhase("OUTSIDE_GEOFENCE");
        setDistanceInfo({
          message: err.message || "Unable to confirm table location.",
        });
      }
    }
  };

  const joinExistingSession = async () => {
    if (!activeSessionInfo) return;
    setIsProcessing(true);
    try {
      await api.startSession({
        tableNumber,
        action: "join",
        sessionId: activeSessionInfo.id,
      });
      window.location.href = `/r/${restaurantId}/menu`;
    } catch (err) {
      setIsProcessing(false);
      setDistanceInfo({ message: err.message || "Could not join existing session." });
      setPhase("OUTSIDE_GEOFENCE");
    }
  };

  const handleStartFreshSession = async () => {
    setActiveSessionInfo(null);
    await verifyAndOpenMenu(restaurant, false);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 px-4 py-8 text-white overflow-hidden select-none">
      {/* Background Ambience / Gold Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-8 z-10 space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-slate-900/80 px-4 py-1.5 backdrop-blur-md shadow-lg">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-300 font-['Cinzel']">
            {restaurant?.name || "ALPHAY RESTAURANT"}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-['Cinzel'] tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100">
          Table #{tableNumber}
        </h1>
      </div>

      {/* MAIN DYNAMIC CARD */}
      <div className="w-full max-w-md rounded-3xl bg-slate-900/90 border border-amber-500/40 p-6 sm:p-8 text-center shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        
        {/* PHASE 1: AUTOMATIC LOCATING & OPENING */}
        {phase === "LOCATING" && (
          <div className="space-y-6 py-4">
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-amber-500/40 animate-spin" />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/30 text-amber-300 border border-amber-500/50 text-3xl shadow-lg">
                📍
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-extrabold font-['Cinzel'] text-white tracking-wide">
                Verifying Location
              </h2>
              <p className="text-xs font-semibold text-slate-300">
                {statusMessage}
              </p>
            </div>

            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-amber-500/20">
              <div className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full animate-[progress_1.5s_ease-in-out_infinite]" style={{ width: "70%" }} />
            </div>

            <p className="text-[11px] font-medium text-slate-400">
              Opening the digital dining menu automatically upon confirmation...
            </p>
          </div>
        )}

        {/* PHASE 2: ACTIVE SESSION FOUND ON TABLE */}
        {phase === "ACTIVE_SESSION_FOUND" && activeSessionInfo && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-3xl">
              🍽️
            </div>

            <div className="space-y-1">
              <span className="inline-block rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-amber-400 border border-amber-500/20">
                Active Dining Found
              </span>
              <h2 className="text-xl font-extrabold text-white font-['Cinzel']">
                Table #{tableNumber} in Progress
              </h2>
            </div>

            <div className="rounded-2xl bg-slate-950 border border-amber-500/30 p-4 text-left font-mono text-xs space-y-1.5 text-amber-200">
              <div className="flex justify-between">
                <span className="text-slate-400">Orders Placed:</span>
                <span className="font-bold text-white">{activeSessionInfo.orderCount} Order(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Items:</span>
                <span className="font-bold text-white">{activeSessionInfo.totalItemsCount} items</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-sm">
                <span className="text-amber-400 font-['Cinzel']">Current Bill:</span>
                <span className="text-amber-400">₹{activeSessionInfo.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={joinExistingSession}
                disabled={isProcessing}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3.5 text-xs font-black text-slate-950 shadow-lg font-['Cinzel'] tracking-wider cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                1. Continue Dining (View Orders & Menu)
              </button>

              <button
                type="button"
                onClick={handleStartFreshSession}
                disabled={isProcessing}
                className="w-full rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-3 text-xs font-bold text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                2. Start Fresh New Session
              </button>
            </div>
          </div>
        )}

        {/* PHASE 3: OUTSIDE RESTAURANT GEOFENCE WARNING */}
        {phase === "OUTSIDE_GEOFENCE" && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 text-3xl">
              📍
            </div>

            <div className="space-y-1">
              <span className="inline-block rounded-full bg-rose-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-rose-400 border border-rose-500/20">
                Location Restricted
              </span>
              <h2 className="text-xl font-extrabold text-white font-['Cinzel']">
                Restaurant Presence Required
              </h2>
            </div>

            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs font-bold text-amber-200 text-left leading-relaxed">
              {distanceInfo?.message || "You are currently outside the restaurant premises. Digital table ordering is restricted to dining guests inside the restaurant."}
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={() => verifyAndOpenMenu(restaurant, false)}
                disabled={isProcessing}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3.5 text-xs font-black text-slate-950 shadow-lg font-['Cinzel'] tracking-wider cursor-pointer active:scale-95 disabled:opacity-50"
              >
                🔄 Retry GPS Location Verification
              </button>

              <button
                type="button"
                onClick={() => verifyAndOpenMenu(restaurant, true)}
                disabled={isProcessing}
                className="w-full rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-3 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
              >
                🚀 Open Menu Directly (Override)
              </button>
            </div>
          </div>
        )}

        {/* PHASE 4: LOCATION PERMISSION PROMPT */}
        {phase === "PERMISSION_REQUIRED" && (
          <div className="space-y-5 animate-in fade-in duration-300">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 text-3xl">
              🛰️
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white font-['Cinzel']">
                Enable Location Access
              </h2>
              <p className="text-xs font-medium text-slate-300">
                Please allow GPS location access in your browser so we can verify you are dining at {restaurant?.name || "the restaurant"}.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                onClick={() => verifyAndOpenMenu(restaurant, false)}
                disabled={isProcessing}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3.5 text-xs font-black text-slate-950 shadow-lg font-['Cinzel'] tracking-wider cursor-pointer active:scale-95 disabled:opacity-50"
              >
                📍 Allow Location & Open Menu
              </button>

              <button
                type="button"
                onClick={() => verifyAndOpenMenu(restaurant, true)}
                disabled={isProcessing}
                className="w-full rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-3 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
              >
                Skip & Open Menu
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Security note footer */}
      <footer className="mt-8 text-center text-[11px] font-medium text-slate-500 z-10">
        ALPHAY Contactless Dining System • Table #{tableNumber}
      </footer>
    </div>
  );
}

export default function CustomerLandingPage() {
  return (
    <main className="min-h-screen w-full bg-slate-950 text-white">
      <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-amber-400 text-sm font-bold font-['Cinzel'] tracking-widest">
          Loading Restaurant Experience...
        </div>
      }>
        <LandingFormInner />
      </Suspense>
    </main>
  );
}
