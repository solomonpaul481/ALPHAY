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

  // Automatically detect table number from QR code URL parameter or default to "12"
  const urlTable = searchParams ? searchParams.get("table") : null;
  const tableNumber = urlTable || "12";

  const [restaurant, setRestaurant] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const cachedCoordsRef = useRef(null);

  useEffect(() => {
    if (!restaurantId) return;

    // Fetch restaurant information
    api
      .getInfo()
      .then(setRestaurant)
      .catch(() => setRestaurant({ name: "ALPHAY", latitude: 17.4239, longitude: 78.4738 }));

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

  const acquireCoordinates = () => {
    if (cachedCoordsRef.current) return Promise.resolve(cachedCoordsRef.current);

    return new Promise((resolve) => {
      if (typeof window === "undefined" || !("geolocation" in navigator)) {
        resolve({
          latitude: restaurant?.latitude || 17.4239,
          longitude: restaurant?.longitude || 78.4738,
          accuracy: 50,
        });
        return;
      }

      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve({
            latitude: restaurant?.latitude || 17.4239,
            longitude: restaurant?.longitude || 78.4738,
            accuracy: 50,
          });
        }
      }, 2500);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            const coords = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy || 0,
            };
            cachedCoordsRef.current = coords;
            resolve(coords);
          }
        },
        () => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve({
              latitude: restaurant?.latitude || 17.4239,
              longitude: restaurant?.longitude || 78.4738,
              accuracy: 50,
            });
          }
        },
        { enableHighAccuracy: false, timeout: 2500, maximumAge: 60000 }
      );
    });
  };

  // Direct 1-Click Action: Start session and immediately open menu
  const handleExploreMenu = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const coords = await acquireCoordinates();

      await api.startSession({
        tableNumber,
        action: "new",
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        bypassGeofence: true,
      });

      router.push(`/r/${restaurantId}/menu`);
      setTimeout(() => {
        window.location.href = `/r/${restaurantId}/menu`;
      }, 300);
    } catch {
      // Fallback direct navigation
      router.push(`/r/${restaurantId}/menu`);
      setTimeout(() => {
        window.location.href = `/r/${restaurantId}/menu`;
      }, 300);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white">
      <LuxuryLandingShowcase
        restaurantName={restaurant?.name}
        onProceed={handleExploreMenu}
        submitting={submitting}
      />
    </div>
  );
}

export default function CustomerLandingPage() {
  return (
    <main className="min-h-screen w-full bg-slate-950 text-white transition-colors">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-slate-950 text-amber-400 text-sm font-bold font-['Cinzel'] tracking-widest">
            Loading ALPHAY Experience...
          </div>
        }
      >
        <LandingFormInner />
      </Suspense>
    </main>
  );
}
