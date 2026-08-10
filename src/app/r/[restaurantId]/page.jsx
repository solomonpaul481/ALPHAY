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

  // Automatically extract table from QR code URL parameter or default to "1"
  const urlTable = searchParams ? searchParams.get("table") : null;
  const tableNumber = urlTable || "1";
  const [restaurant, setRestaurant] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    api
      .getInfo()
      .then(setRestaurant)
      .catch(() => setRestaurant({ name: "ALPHAY" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const getCoordinatesSilently = () => {
    return new Promise((resolve) => {
      if (!("geolocation" in navigator)) {
        resolve({ latitude: 0, longitude: 0 });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve({ latitude: 0, longitude: 0 }),
        { timeout: 3000, maximumAge: 60000 }
      );
    });
  };

  // DIRECT MENU OPENING: When user clicks EXPLORE MENU, start table session automatically and open menu directly!
  const handleExploreMenu = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const coords = await getCoordinatesSilently();
      await api.startSession({
        tableNumber,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    } catch (err) {
      // Fallback: session might already exist or auto-created
    } finally {
      router.push(`/r/${restaurantId}/menu`);
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
