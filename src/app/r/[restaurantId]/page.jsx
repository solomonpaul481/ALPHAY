"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createApiClient } from "@/lib/api-client";
import LuxuryLandingShowcase from "@/components/LuxuryLandingShowcase";

function LandingFormInner() {
  const { restaurantId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const api = createApiClient(restaurantId);

  // Detect table number and parcel mode from QR code URL parameters
  const rawTable = searchParams ? searchParams.get("table") : null;
  const isParcel =
    searchParams?.get("type") === "parcel" ||
    searchParams?.get("parcel") === "true" ||
    String(rawTable).trim().toUpperCase() === "PARCEL" ||
    String(rawTable).trim().toUpperCase() === "P";

  const tableNumber = isParcel ? "PARCEL" : (rawTable || "12");

  const [restaurant, setRestaurant] = useState({ name: "ALPHAY", latitude: 17.4239, longitude: 78.4738 });
  const [submitting, setSubmitting] = useState(false);
  const cachedCoordsRef = useRef(null);
  const hasLoadedInfoRef = useRef(false);

  useEffect(() => {
    if (!restaurantId) return;

    // Fetch restaurant information once without double-rendering or flashing
    if (!hasLoadedInfoRef.current) {
      hasLoadedInfoRef.current = true;
      api
        .getInfo()
        .then((data) => {
          if (data?.name) setRestaurant(data);
        })
        .catch(() => {});
    }

    // Quietly detect and cache customer GPS coordinates in the background
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      try {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            cachedCoordsRef.current = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy || 0,
            };
          },
          () => {
            // Fallback low-accuracy
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                cachedCoordsRef.current = {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  accuracy: pos.coords.accuracy || 50,
                };
              },
              () => {},
              { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }
            );
          },
          { enableHighAccuracy: true, timeout: 4000, maximumAge: 30000 }
        );
      } catch {
        // Ignore background acquisition errors
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  // Direct 1-Click Action: Start session and immediately direct customer to the menu page
  const handleExploreMenu = async () => {
    if (submitting) return;
    setSubmitting(true);

    const coords = cachedCoordsRef.current || {
      latitude: restaurant?.latitude || 17.4239,
      longitude: restaurant?.longitude || 78.4738,
      accuracy: 50,
    };

    const navUrl = isParcel
      ? `/r/${restaurantId}/menu?type=parcel&table=PARCEL`
      : `/r/${restaurantId}/menu?table=${encodeURIComponent(tableNumber)}`;

    try {
      await api.startSession({
        tableNumber,
        isParcel,
        type: isParcel ? "parcel" : "dine_in",
        action: isParcel ? "force_new" : "join",
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        bypassGeofence: true,
      });
    } catch (err) {
      console.warn("Session auto-start notice:", err);
    }

    // Directly direct the customer straight to the menu page
    router.push(navUrl);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white">
      <LuxuryLandingShowcase
        restaurantName={restaurant?.name}
        onProceed={handleExploreMenu}
        submitting={submitting}
        isParcel={isParcel}
      />
    </div>
  );
}

export default function CustomerLandingPage() {
  return (
    <main className="min-h-screen w-full bg-slate-950 text-white transition-colors">
      <Suspense
        fallback={
          <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center" />
        }
      >
        <LandingFormInner />
      </Suspense>
    </main>
  );
}
