"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";

export default function ManagerSettingsPage() {
  const [data, setData] = useState(null);
  const [activeTheme, setActiveTheme] = useState("dark");
  const [locForm, setLocForm] = useState({ latitude: "", longitude: "", geofenceRadiusMeters: 150 });
  const [locSaving, setLocSaving] = useState(false);
  const [locMessage, setLocMessage] = useState(null);

  useEffect(() => {
    fetch("/api/manager/dashboard")
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d) {
          setData(d);
          setLocForm({
            latitude: d.latitude != null ? String(d.latitude) : "",
            longitude: d.longitude != null ? String(d.longitude) : "",
            geofenceRadiusMeters: d.geofenceRadiusMeters || 150,
          });
        }
      })
      .catch(() => {});

    const saved = localStorage.getItem("alphay_theme_mode") || "dark";
    setActiveTheme(saved);
  }, []);

  const selectTheme = (mode) => {
    setActiveTheme(mode);
    localStorage.setItem("alphay_theme_mode", mode);

    document.documentElement.classList.remove("dark", "aquarium");
    document.documentElement.removeAttribute("data-theme");

    if (mode === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else if (mode === "aquarium") {
      document.documentElement.setAttribute("data-theme", "aquarium");
      document.documentElement.classList.add("aquarium");
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
    }
  };

  const detectMyLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocMessage({ type: "error", text: "Geolocation is not supported by your browser." });
      return;
    }
    setLocSaving(true);
    setLocMessage({ type: "info", text: "Acquiring GPS coordinates from your device..." });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocForm((prev) => ({
          ...prev,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        }));
        setLocSaving(false);
        setLocMessage({ type: "success", text: `Acquired coordinates: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}. Tap 'Save GPS Coordinates' to apply.` });
      },
      (err) => {
        setLocSaving(false);
        setLocMessage({ type: "error", text: err.message || "Failed to retrieve device GPS." });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    setLocSaving(true);
    setLocMessage(null);
    try {
      const res = await fetch("/api/manager/location", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: parseFloat(locForm.latitude),
          longitude: parseFloat(locForm.longitude),
          geofenceRadiusMeters: parseInt(locForm.geofenceRadiusMeters, 10),
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to save location.");
      setLocMessage({ type: "success", text: "✓ Restaurant GPS coordinates & geofence radius updated successfully!" });
      setData((prev) => ({
        ...prev,
        latitude: resData.restaurant.latitude,
        longitude: resData.restaurant.longitude,
        geofenceRadiusMeters: resData.restaurant.geofenceRadiusMeters,
      }));
    } catch (err) {
      setLocMessage({ type: "error", text: err.message || "Failed to update restaurant location." });
    } finally {
      setLocSaving(false);
    }
  };

  return (
    <>
      <Topbar title="Restaurant Settings" />
      <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6 text-slate-900 dark:text-white">
        {/* GPS GEOFENCE CALIBRATION CARD */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-amber-500/30 space-y-4 transition-colors">
          <div className="flex items-center gap-3 border-b border-amber-500/20 pb-3">
            <span className="text-2xl">📍</span>
            <div>
              <h2 className="font-['Cinzel'] text-lg font-extrabold text-slate-900 dark:text-white">
                Restaurant GPS Location & Geofence
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Calibrate the exact GPS coordinates where customers sit and dine at this venue.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveLocation} className="space-y-4 pt-2">
            {locMessage && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold ${
                  locMessage.type === "success"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : locMessage.type === "error"
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                    : "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                }`}
              >
                {locMessage.text}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 font-['Cinzel']">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={locForm.latitude}
                  onChange={(e) => setLocForm({ ...locForm, latitude: e.target.value })}
                  placeholder="e.g. 17.4239"
                  required
                  className="w-full rounded-2xl bg-amber-50 dark:bg-slate-950 border border-amber-500/30 px-4 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 font-['Cinzel']">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={locForm.longitude}
                  onChange={(e) => setLocForm({ ...locForm, longitude: e.target.value })}
                  placeholder="e.g. 78.4738"
                  required
                  className="w-full rounded-2xl bg-amber-50 dark:bg-slate-950 border border-amber-500/30 px-4 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 font-['Cinzel']">
                Allowed Ordering Radius (Meters)
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min="50"
                  max="10000"
                  value={locForm.geofenceRadiusMeters}
                  onChange={(e) => setLocForm({ ...locForm, geofenceRadiusMeters: e.target.value })}
                  className="w-32 rounded-2xl bg-amber-50 dark:bg-slate-950 border border-amber-500/30 px-4 py-2.5 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <div className="flex gap-1.5 flex-wrap">
                  {[150, 300, 500, 1000].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setLocForm({ ...locForm, geofenceRadiusMeters: r })}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${
                        Number(locForm.geofenceRadiusMeters) === r
                          ? "bg-amber-500 text-slate-950 border-amber-400 font-black"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:border-amber-500/40"
                      }`}
                    >
                      {r}m
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                Customers within this distance can verify table presence and order food.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={detectMyLocation}
                disabled={locSaving}
                className="rounded-2xl bg-slate-800 hover:bg-slate-700 border border-amber-500/30 px-4 py-3 text-xs font-bold text-amber-300 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                <span>📍</span>
                <span>Set to My Current Device GPS</span>
              </button>

              <button
                type="submit"
                disabled={locSaving}
                className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-6 py-3 text-xs font-black text-slate-950 shadow-lg font-['Cinzel'] tracking-wider cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                {locSaving ? "Saving..." : "Save GPS Coordinates"}
              </button>
            </div>
          </form>
        </div>

        {/* THEME SELECTION CARD */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-amber-500/30 space-y-4 transition-colors">
          <div className="flex items-center gap-3 border-b border-amber-500/20 pb-3">
            <span className="text-2xl">🎨</span>
            <div>
              <h2 className="font-['Cinzel'] text-lg font-extrabold text-slate-900 dark:text-white">
                Manager Portal Display Theme
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Select your preferred interface theme. Default is constant Black & Gold.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 pt-2">
            {/* BLACK & GOLD THEME (DEFAULT) */}
            <button
              type="button"
              onClick={() => selectTheme("dark")}
              className={`rounded-2xl p-4 border text-left transition-all cursor-pointer ${
                activeTheme === "dark"
                  ? "border-amber-400 bg-slate-950 ring-2 ring-amber-400/40 shadow-lg"
                  : "border-slate-800 bg-slate-900 hover:border-amber-500/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-['Cinzel'] text-sm font-black text-amber-400">👑 Black & Gold</span>
                {activeTheme === "dark" && <span className="text-xs text-amber-400 font-bold">Active ✓</span>}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                Constant dark theme with deep pitch black background and shiny gold accents.
              </p>
            </button>

            {/* WHITE & GOLD THEME */}
            <button
              type="button"
              onClick={() => selectTheme("light")}
              className={`rounded-2xl p-4 border text-left transition-all cursor-pointer ${
                activeTheme === "light"
                  ? "border-amber-500 bg-amber-50 ring-2 ring-amber-500/40 shadow-lg"
                  : "border-amber-300/40 bg-white hover:border-amber-500"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-['Cinzel'] text-sm font-black text-amber-700">☀️ White & Gold</span>
                {activeTheme === "light" && <span className="text-xs text-amber-700 font-bold">Active ✓</span>}
              </div>
              <p className="text-[11px] text-slate-600 mt-2 font-medium">
                Clean light mode theme with pure white background and gold borders.
              </p>
            </button>

            {/* AQUARIUM THEME */}
            <button
              type="button"
              onClick={() => selectTheme("aquarium")}
              className={`rounded-2xl p-4 border text-left transition-all cursor-pointer ${
                activeTheme === "aquarium"
                  ? "border-cyan-400 bg-cyan-950/80 ring-2 ring-cyan-400/50 shadow-lg shadow-cyan-500/20"
                  : "border-cyan-900/60 bg-slate-900 hover:border-cyan-400/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-['Cinzel'] text-sm font-black text-cyan-300">🐠 Aquarium Theme</span>
                {activeTheme === "aquarium" && <span className="text-xs text-cyan-400 font-bold">Active ✓</span>}
              </div>
              <p className="text-[11px] text-cyan-200/80 mt-2 font-medium">
                Oceanic gradient with crystal transparent glassmorphic tables & glowing cyan text.
              </p>
            </button>
          </div>
        </div>

        {/* RESTAURANT INFO CARD */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-amber-500/30 space-y-6 transition-colors">
          <div className="flex items-center gap-4 border-b border-amber-500/20 pb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-2xl text-slate-950 font-black shadow-md">
              🍽️
            </div>
            <div>
              <h2 className="font-['Cinzel'] text-xl font-bold text-slate-900 dark:text-white">
                {data?.restaurantName || "ALPHAY Restaurant"}
              </h2>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Commercial SaaS Restaurant Account</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 font-['Cinzel']">Restaurant Status</label>
              <div className="mt-1 flex items-center gap-2 rounded-2xl bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-400 p-3 text-xs font-bold border border-emerald-400 dark:border-emerald-500/30">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>ACTIVE & ACCEPTING ORDERS</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 font-['Cinzel']">Standard GST Rate</label>
              <div className="mt-1 rounded-2xl bg-amber-50 dark:bg-slate-950 p-3 text-xs font-bold text-slate-900 dark:text-white border border-amber-500/30">
                {data?.gstPercent ?? 5}% GST Applicable
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 font-['Cinzel']">Geofence Ordering Radius</label>
              <div className="mt-1 rounded-2xl bg-amber-50 dark:bg-slate-950 p-3 text-xs font-bold text-slate-900 dark:text-white border border-amber-500/30 flex items-center gap-2">
                <span>📍</span>
                <span>{data?.geofenceRadiusMeters ?? 150} Meters GPS Radius</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 font-['Cinzel']">Active Payment Gateway</label>
              <div className="mt-1 rounded-2xl bg-amber-50 dark:bg-slate-950 p-3 text-xs font-bold text-slate-900 dark:text-white border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>💳</span>
                  <span>Cashfree Payment Gateway Enabled</span>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black text-emerald-400 border border-emerald-500/30 font-mono">
                  ACTIVE
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 font-['Cinzel']">KDS Integration</label>
              <div className="mt-1 rounded-2xl bg-amber-50 dark:bg-slate-950 p-3 text-xs font-bold text-slate-900 dark:text-white border border-amber-500/30 flex items-center gap-2">
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


