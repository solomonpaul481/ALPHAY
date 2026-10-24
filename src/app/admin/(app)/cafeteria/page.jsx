"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";
import { IconBuilding, IconPlus, IconSettings } from "@/components/Icons";

const CAFETERIA_TYPES = [
  { value: "COLLEGE", label: "🎓 College / University Cafeteria", desc: "Campus dining with high-throughput counter token collection" },
  { value: "ROADSIDE", label: "🛣️ Roadside / Highway Cafeteria", desc: "Quick-stop express dining with instant pay-first pickup" },
  { value: "OFFICE", label: "🏢 Office / Tech Park Cafeteria", desc: "Corporate cafeteria with prepaid desk & parcel tokens" },
  { value: "FOOD_COURT", label: "🍽️ Food Court / Canteen", desc: "Multi-counter self-service cafeteria ordering" },
];

const EMPTY_CAFETERIA_FORM = {
  name: "",
  subCategory: "COLLEGE",
  latitude: "",
  longitude: "",
  geofenceRadiusMeters: "150",
  gstPercent: "5",
  commissionPercent: "5",
  managerName: "",
  managerEmail: "",
  managerPassword: "",
};

function AddCafeteriaPanel({ onCreated, onClose }) {
  const [form, setForm] = useState(EMPTY_CAFETERIA_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude),
        }));
      },
      () => {
        setError("Could not get location. Enter coordinates manually.");
      },
      { enableHighAccuracy: true }
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.latitude || !form.longitude) {
      setError("Cafeteria name and GPS location coordinates are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          category: "CAFETERIA",
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      onCreated();
    } catch (err) {
      setError(err.message || "Couldn't create cafeteria.");
    } finally {
      setSaving(false);
    }
  };

  if (result) {
    return (
      <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-amber-500/30">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          ✓ Cafeteria Onboarded
        </span>
        <h2 className="mt-1 font-['Cinzel'] text-2xl font-bold text-slate-900 dark:text-white">
          {result.restaurant.name}
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Category: <span className="font-bold text-amber-600 dark:text-amber-400">CAFETERIA</span> ({form.subCategory}) · Pay-First Active
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Customer Digital Menu Link</p>
            <a
              href={result.customerUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block break-all rounded-2xl bg-amber-50 dark:bg-slate-950 p-3 font-mono text-xs font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20"
            >
              {result.customerUrl}
            </a>

            <p className="mt-4 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Manager Login Credentials</p>
            <p className="mt-1 rounded-2xl bg-amber-50 dark:bg-slate-950 p-3 font-mono text-xs font-bold text-slate-900 dark:text-white border border-amber-500/20">
              {result.manager.email}
            </p>
          </div>

          <div className="flex gap-4">
            <div className="text-center">
              <img src={result.qr.dineIn} alt="Dine-in QR" className="h-28 w-28 rounded-2xl border border-amber-500/30 p-1" />
              <p className="mt-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">Dine-In QR</p>
            </div>
            <div className="text-center">
              <img src={result.qr.parcel} alt="Parcel Counter QR" className="h-28 w-28 rounded-2xl border border-amber-500/30 p-1" />
              <p className="mt-1 text-[11px] font-bold text-slate-600 dark:text-slate-300">Parcel QR</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-xs font-bold text-slate-950 font-['Cinzel'] cursor-pointer"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-amber-500/30">
      <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            ☕ Add Cafeteria (Only Cafeteria Category)
          </span>
          <h2 className="mt-1 font-['Cinzel'] text-xl font-bold text-slate-900 dark:text-white">
            Onboard New Cafeteria
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Add college cafeterias, roadside cafes, or campus canteens. All orders require payment first.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-slate-100 dark:bg-slate-800 p-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
        >
          ✕
        </button>
      </div>

      {/* Pay-first notice */}
      <div className="mt-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
        <span className="text-base">ℹ️</span>
        <div>
          <p className="font-bold font-['Cinzel']">Pay-First Self-Service Rule Enforced:</p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
            In the Cafeteria category, customers who scan either Dine-In or Parcel QR codes must pay online upfront. Once paid, they receive a digital pickup token to collect their food from the counter.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Cafeteria Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Oxford Campus Cafeteria, Highway Roadside Express"
            className="mt-1.5 w-full rounded-2xl border border-amber-500/20 bg-amber-50/40 dark:bg-slate-950 px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Cafeteria Type / Subcategory</label>
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
            onClick={useMyLocation}
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            📍 Detect & Use My Current GPS Location
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
          <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">GST Rate %</label>
          <input
            value={form.gstPercent}
            onChange={(e) => setForm({ ...form, gstPercent: e.target.value })}
            type="number"
            className="mt-1.5 w-full rounded-2xl border border-amber-500/20 bg-amber-50/40 dark:bg-slate-950 px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2 mt-2 border-t border-amber-500/20 pt-4">
          <p className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400">Cafeteria Manager Login</p>
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
          <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Password</label>
          <input
            value={form.managerPassword}
            onChange={(e) => setForm({ ...form, managerPassword: e.target.value })}
            type="text"
            placeholder="At least 8 characters"
            className="mt-1.5 w-full rounded-2xl border border-amber-500/20 bg-amber-50/40 dark:bg-slate-950 px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
            required
          />
        </div>
      </div>

      {error && <p className="mt-4 rounded-xl bg-rose-500/20 border border-rose-500/40 p-3 text-xs font-bold text-rose-300">{error}</p>}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-2xl border border-slate-300 dark:border-slate-700 px-5 py-3 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-xs font-black text-slate-950 font-['Cinzel'] shadow-md disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Onboarding Cafeteria..." : "☕ Onboard Cafeteria"}
        </button>
      </div>
    </form>
  );
}

export default function AdminCafeteriaPage() {
  const [cafeterias, setCafeterias] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const load = async () => {
    const res = await fetch("/api/admin/restaurants?category=CAFETERIA");
    if (res.ok) {
      const data = await res.json();
      setCafeterias(data.restaurants || []);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openManagerPortal = async (r) => {
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/admin/restaurants/${r.id}/impersonate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Couldn't open Cafeteria Manager Portal.");
        return;
      }
      window.open("/manager/cafeteria", "_blank");
    } finally {
      setBusyId(null);
    }
  };

  const toggleStatus = async (r) => {
    const verb = r.status === "ACTIVE" ? "suspend" : "reactivate";
    if (!confirm(`${verb.toUpperCase()} ${r.name}?`)) return;
    setBusyId(r.id);
    try {
      await fetch(`/api/admin/restaurants/${r.id}/toggle-status`, { method: "POST" });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Topbar
        title="Cafeteria Category Management"
        right={
          !showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs font-black text-slate-950 shadow-soft hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer font-['Cinzel']"
            >
              <IconPlus className="h-4 w-4" />
              <span>Add Cafeteria</span>
            </button>
          )
        }
      />

      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Category Header Card */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-amber-500/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">☕</span>
                <h1 className="font-['Cinzel'] text-xl font-extrabold text-slate-900 dark:text-white">
                  Cafeteria Venues & Counter Services
                </h1>
                <span className="rounded-full bg-amber-500/20 px-3 py-0.5 text-xs font-black text-amber-600 dark:text-amber-400 border border-amber-500/30 font-['Cinzel']">
                  Pay-First Enforced
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
                Dedicated category for <strong>college cafeterias, roadside cafes, campus canteens, and food courts</strong>. Customers order by scanning the QR code, pay upfront via Razorpay, and collect their order at the counter with an issued 4-digit pickup token.
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 dark:bg-slate-950 p-3 border border-amber-500/20 text-right">
              <p className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 font-['Cinzel']">Total Cafeterias</p>
              <p className="font-mono text-2xl font-black text-amber-600 dark:text-amber-400">
                {cafeterias ? cafeterias.length : "…"}
              </p>
            </div>
          </div>
        </div>

        {showAddForm && (
          <AddCafeteriaPanel onCreated={load} onClose={() => setShowAddForm(false)} />
        )}

        <div className="overflow-x-auto rounded-3xl bg-white dark:bg-slate-900 shadow-xl border border-amber-500/30">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-amber-500/20 bg-amber-50/80 dark:bg-slate-950/80 font-['Cinzel'] text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <th className="px-5 py-4">Cafeteria ID</th>
                <th className="px-5 py-4">Cafeteria Name & Type</th>
                <th className="px-5 py-4">Manager Credentials</th>
                <th className="px-5 py-4">GPS Geofence</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 dark:divide-slate-800 font-semibold text-slate-900 dark:text-white">
              {cafeterias === null ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
                    Loading cafeterias...
                  </td>
                </tr>
              ) : cafeterias.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <span className="text-4xl">☕</span>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 font-['Cinzel']">No Cafeterias Added Yet</p>
                      <p className="text-xs text-slate-500 max-w-sm">
                        Click "Add Cafeteria" above to onboard your first college or roadside cafeteria with pay-first token collection.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                cafeterias.map((r) => (
                  <tr key={r.id} className="hover:bg-amber-50/40 dark:hover:bg-slate-950/40 transition-colors">
                    <td className="px-5 py-4 font-bold text-amber-600 dark:text-amber-300">#{r.id.slice(-6).toUpperCase()}</td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white font-['Cinzel'] text-sm">{r.name}</p>
                        <span className="inline-block mt-0.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-black text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase">
                          {r.subCategory || "COLLEGE"} CAFETERIA
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-sans text-xs">
                      <div className="rounded-xl bg-amber-50 dark:bg-slate-950 p-2 border border-amber-500/20 space-y-0.5">
                        <p className="font-bold text-slate-900 dark:text-white">📧 {r.managerEmail}</p>
                        <p className="font-mono text-[11px] font-extrabold text-amber-700 dark:text-amber-400">🔑 {r.managerPassword || "paradise123"}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      📍 {r.latitude?.toFixed(3)}, {r.longitude?.toFixed(3)} ({r.geofenceRadiusMeters}m radius)
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          r.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-400"
                            : "bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-400"
                        }`}
                      >
                        {r.status === "ACTIVE" ? "ACTIVE" : "SUSPENDED"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openManagerPortal(r)}
                          disabled={busyId === r.id}
                          className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-md font-['Cinzel'] transition-all disabled:opacity-50 cursor-pointer"
                        >
                          Launch Cafeteria Portal
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(r)}
                          disabled={busyId === r.id}
                          className="rounded-2xl bg-amber-50 dark:bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 border border-amber-500/20 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          {r.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
