"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";

export default function ManagerSettingsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/manager/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => {});
  }, []);

  return (
    <>
      <Topbar title="Restaurant Settings" />
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-soft border border-purple-50 space-y-6">
          <div className="flex items-center gap-4 border-b border-purple-50 pb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple text-2xl text-white shadow-soft">
              🍽️
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-ink">
                {data?.restaurantName || "ALPHAY Restaurant"}
              </h2>
              <p className="text-xs font-semibold text-purple">Commercial SaaS Restaurant Account</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-ink2">Restaurant Status</label>
              <div className="mt-1 flex items-center gap-2 rounded-2xl bg-veg-tint p-3 text-xs font-bold text-veg border border-veg/20">
                <span className="h-2.5 w-2.5 rounded-full bg-veg" />
                <span>ACTIVE & ACCEPTING ORDERS</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-ink2">Standard GST Rate</label>
              <div className="mt-1 rounded-2xl bg-purple-50 p-3 text-xs font-bold text-ink border border-purple-100">
                {data?.gstPercent ?? 5}% GST Applicable
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-ink2">Geofence Ordering Radius</label>
              <div className="mt-1 rounded-2xl bg-purple-50 p-3 text-xs font-bold text-ink border border-purple-100 flex items-center gap-2">
                <span>📍</span>
                <span>{data?.geofenceRadiusMeters ?? 150} Meters GPS Radius</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-ink2">Payment Gateway</label>
              <div className="mt-1 rounded-2xl bg-purple-50 p-3 text-xs font-bold text-ink border border-purple-100 flex items-center gap-2">
                <span>💳</span>
                <span>Razorpay Automatic Online Verification</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-ink2">KDS Integration</label>
              <div className="mt-1 rounded-2xl bg-purple-50 p-3 text-xs font-bold text-ink border border-purple-100 flex items-center gap-2">
                <span>👨‍🍳</span>
                <span>Kitchen Display System Enabled (`/kitchen`)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

