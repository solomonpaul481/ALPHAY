"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";
import { IconPlus } from "@/components/Icons";

const CAFETERIA_TYPES = [
  { value: "COLLEGE", label: "🎓 College / Campus Cafeteria", desc: "Designed for high volume campus lunch breaks & token queues" },
  { value: "ROADSIDE", label: "🛣️ Roadside / Highway Cafeteria", desc: "Fast service express counter for travelers & commuters" },
  { value: "OFFICE", label: "🏢 Office / Tech Park Cafeteria", desc: "Fast-moving prepaid executive lunch & refreshment counter" },
  { value: "FOOD_COURT", label: "🍽️ Food Court / Self-Service Canteen", desc: "Multi-counter collection & token call-out workflow" },
];

export default function ManagerCafeteriaPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    subCategory: "COLLEGE",
    latitude: "",
    longitude: "",
    geofenceRadiusMeters: "150",
    gstPercent: "5",
    managerName: "",
    managerEmail: "",
    managerPassword: "",
  });

  const loadData = async () => {
    try {
      const res = await fetch("/api/manager/cafeteria");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        }));
      },
      () => {
        setError("Could not get GPS location. Please enter coordinates manually.");
      },
      { enableHighAccuracy: true }
    );
  };

  const handleAddCafeteria = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.name || !form.latitude || !form.longitude) {
      setError("Cafeteria name and GPS coordinates are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/manager/cafeteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Failed to add cafeteria");
      setSuccess(`Cafeteria "${resJson.cafeteria?.name}" onboarded successfully!`);
      setForm({
        name: "",
        subCategory: "COLLEGE",
        latitude: "",
        longitude: "",
        geofenceRadiusMeters: "150",
        gstPercent: "5",
        managerName: "",
        managerEmail: "",
        managerPassword: "",
      });
      setShowAddForm(false);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (orderId, action) => {
    setBusyId(orderId);
    try {
      await fetch("/api/manager/cafeteria", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action }),
      });
      await loadData();
    } finally {
      setBusyId(null);
    }
  };

  const isCurrentCafeteria = data?.currentVenue?.isCafeteria;

  return (
    <>
      <Topbar
        title="Cafeteria Portal"
        right={
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-black text-slate-950 shadow-soft hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer font-['Cinzel']"
          >
            <IconPlus className="h-4 w-4" />
            <span>{showAddForm ? "Close Form" : "Add Cafeteria"}</span>
          </button>
        }
      />

      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-900 dark:text-white">
        {/* BANNER / STATUS CARD */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-amber-500/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-3xl">☕</span>
                <div>
                  <h1 className="font-['Cinzel'] text-xl font-extrabold tracking-wide text-slate-900 dark:text-white">
                    Cafeteria Service & Counter Management
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Category: <strong className="text-amber-600 dark:text-amber-400 font-['Cinzel']">CAFETERIA</strong> (College, Roadside & Express Dining)
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-['Cinzel']">
                  ✓ Pay-First Enforced
                </span>
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 border border-amber-500/30 font-['Cinzel']">
                  🎫 4-Digit Pickup Tokens Active
                </span>
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Dine-In & Takeaway Both Pre-paid
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-amber-50 dark:bg-slate-950 p-4 border border-amber-500/20 text-center">
              <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 font-['Cinzel']">Current Venue</p>
              <p className="font-['Cinzel'] text-base font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                {data?.currentVenue?.name || "Loading..."}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                {data?.currentVenue?.category === "CAFETERIA" ? "☕ Active Cafeteria" : "🏬 Standard Restaurant"}
              </p>
            </div>
          </div>
        </div>

        {/* FEEDBACK NOTICES */}
        {error && (
          <div className="rounded-2xl bg-rose-500/20 border border-rose-500/40 p-4 text-xs font-bold text-rose-300">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-2xl bg-emerald-500/20 border border-emerald-500/40 p-4 text-xs font-bold text-emerald-300">
            {success}
          </div>
        )}

        {/* ADD CAFETERIA FORM (ONLY CAFETERIAS CAN BE ADDED HERE) */}
        {showAddForm && (
          <form onSubmit={handleAddCafeteria} className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-amber-500/40 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-['Cinzel']">
                  ☕ Add Cafeteria
                </span>
                <h2 className="mt-1 font-['Cinzel'] text-lg font-bold text-slate-900 dark:text-white">
                  Add College Cafeteria, Roadside Cafeteria or Canteen
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Only cafeterias can be added under this category. In cafeterias, every customer pays first and collects their order.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-full bg-slate-100 dark:bg-slate-800 p-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Cafeteria Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Oxford Engineering College Cafeteria, Highway Roadside Express Canteen"
                  className="mt-1.5 w-full rounded-2xl border border-amber-500/20 bg-amber-50/40 dark:bg-slate-950 px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Cafeteria Type</label>
                <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
                  {CAFETERIA_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm({ ...form, subCategory: t.value })}
                      className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                        form.subCategory === t.value
                          ? "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500"
                          : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-500/40"
                      }`}
                    >
                      <p className="text-xs font-bold">{t.label}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Latitude</label>
                <input
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  placeholder="17.4239"
                  className="mt-1.5 w-full rounded-2xl border border-amber-500/20 bg-amber-50/40 dark:bg-slate-950 px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Longitude</label>
                <input
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  placeholder="78.4738"
                  className="mt-1.5 w-full rounded-2xl border border-amber-500/20 bg-amber-50/40 dark:bg-slate-950 px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  📍 Detect My Current GPS Location
                </button>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Geofence Radius (meters)</label>
                <input
                  value={form.geofenceRadiusMeters}
                  onChange={(e) => setForm({ ...form, geofenceRadiusMeters: e.target.value })}
                  type="number"
                  className="mt-1.5 w-full rounded-2xl border border-amber-500/20 bg-amber-50/40 dark:bg-slate-950 px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">GST %</label>
                <input
                  value={form.gstPercent}
                  onChange={(e) => setForm({ ...form, gstPercent: e.target.value })}
                  type="number"
                  className="mt-1.5 w-full rounded-2xl border border-amber-500/20 bg-amber-50/40 dark:bg-slate-950 px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 mt-2 border-t border-amber-500/20 pt-4">
                <p className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400 font-['Cinzel']">
                  Cafeteria Manager Credentials
                </p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Manager Name</label>
                <input
                  value={form.managerName}
                  onChange={(e) => setForm({ ...form, managerName: e.target.value })}
                  placeholder="e.g. Canteen In-charge"
                  className="mt-1.5 w-full rounded-2xl border border-amber-500/20 bg-amber-50/40 dark:bg-slate-950 px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Manager Email</label>
                <input
                  value={form.managerEmail}
                  onChange={(e) => setForm({ ...form, managerEmail: e.target.value })}
                  type="email"
                  placeholder="cafeteria@campus.edu"
                  className="mt-1.5 w-full rounded-2xl border border-amber-500/20 bg-amber-50/40 dark:bg-slate-950 px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Manager Password</label>
                <input
                  value={form.managerPassword}
                  onChange={(e) => setForm({ ...form, managerPassword: e.target.value })}
                  type="text"
                  placeholder="At least 6 characters"
                  className="mt-1.5 w-full rounded-2xl border border-amber-500/20 bg-amber-50/40 dark:bg-slate-950 px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-2xl border border-slate-300 dark:border-slate-700 px-5 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-xs font-black text-slate-950 font-['Cinzel'] shadow-md disabled:opacity-50 cursor-pointer"
              >
                {saving ? "Saving..." : "☕ Add Cafeteria to Portal"}
              </button>
            </div>
          </form>
        )}

        {/* LIVE CAFETERIA TOKEN PICKUP QUEUE */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xl border border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
            <div>
              <h2 className="font-['Cinzel'] text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🎫</span>
                <span>Live Cafeteria Token Collection Queue</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                All cafeteria orders are pre-paid. Call tokens for counter collection when prepared.
              </p>
            </div>
            <span className="rounded-full bg-amber-500/15 px-3 py-1 font-mono text-xs font-black text-amber-600 dark:text-amber-400">
              {data?.activeTokens?.length || 0} In Queue
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs font-bold text-amber-600 font-['Cinzel'] animate-pulse">
              Loading cafeteria token queue...
            </div>
          ) : !data?.activeTokens || data.activeTokens.length === 0 ? (
            <div className="p-10 text-center text-xs font-bold text-slate-500 dark:text-slate-400 font-['Cinzel']">
              ☕ No active orders waiting for pickup right now.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.activeTokens.map((t) => (
                <div
                  key={t.orderId}
                  className="rounded-2xl bg-amber-50/50 dark:bg-slate-950 p-4 border border-amber-500/30 shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xl font-black text-amber-600 dark:text-amber-400 tracking-wider">
                      #{t.tokenNumber}
                    </span>
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-['Cinzel']">
                      PAID ✓
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">
                      Type: <span className="text-amber-600 dark:text-amber-400">{t.orderType}</span> (Table {t.tableNumber})
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Items: {t.items.map((it) => `${it.quantity}x ${it.name}`).join(", ")}
                    </p>
                    <p className="font-mono font-bold text-slate-900 dark:text-white">
                      Total: ₹{t.total?.toFixed(2)}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-amber-500/20 flex gap-2">
                    {t.status !== "READY" ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(t.orderId, "READY")}
                        disabled={busyId === t.orderId}
                        className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-400 py-2 text-xs font-black text-slate-950 font-['Cinzel'] cursor-pointer transition-all"
                      >
                        🔔 Mark Ready for Pickup
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(t.orderId, "COLLECTED")}
                        disabled={busyId === t.orderId}
                        className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-black text-white font-['Cinzel'] cursor-pointer transition-all"
                      >
                        ✓ Mark Collected
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ONBOARDED CAFETERIAS DIRECTORY */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xl border border-amber-500/30 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
            <div>
              <h2 className="font-['Cinzel'] text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🏬</span>
                <span>All Onboarded Cafeterias ({data?.allCafeterias?.length || 0})</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                College cafeterias, roadside cafes, and canteens configured with Pay-First ordering.
              </p>
            </div>
          </div>

          {!data?.allCafeterias || data.allCafeterias.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-slate-500 dark:text-slate-400 font-['Cinzel']">
              No cafeterias onboarded yet. Click "Add Cafeteria" above to add one.
            </div>
          ) : (
            <div className="divide-y divide-amber-100 dark:divide-slate-800">
              {data.allCafeterias.map((c) => (
                <div key={c.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-['Cinzel'] text-sm font-bold text-slate-900 dark:text-white">
                      {c.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Type: <span className="font-bold text-amber-600 dark:text-amber-400">{c.subCategory} CAFETERIA</span> · Manager: {c.managerEmail}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/r/${c.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-amber-50 dark:bg-slate-950 px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:border-amber-500/50"
                    >
                      Open Customer Menu ↗
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
