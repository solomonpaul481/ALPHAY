"use client";

import { useEffect, useState } from "react";
import KitchenDisplayPage from "./[restaurantId]/page";

export default function KitchenDefaultPage() {
  const [restaurantId, setRestaurantId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/manager/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setRestaurantId(data.restaurantId || null);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-sm">
        Connecting to Kitchen Display System...
      </div>
    );
  }

  return <KitchenDisplayPage />;
}
