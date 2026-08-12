"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";
import { IconBuilding, IconPlus, IconSettings, IconLogout } from "@/components/Icons";

const EMPTY_FORM = {
  name: "",
  latitude: "",
  longitude: "",
  geofenceRadiusMeters: "150",
  gstPercent: "5",
  commissionPercent: "5",
  managerName: "",
  managerEmail: "",
  managerPassword: "",
};

function AddRestaurantPanel({ onCreated, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
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
      setError("Restaurant name and GPS location coordinates are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      onCreated();
    } catch (err) {
      setError(err.message || "Couldn't create restaurant.");
    } finally {
      setSaving(false);
    }
  };

  if (result) {
    return (
      <div className="rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-lift border border-purple-50">
        <span className="text-xs font-bold uppercase tracking-wider text-veg">✓ Venue Onboarded</span>
        <h2 className="mt-1 font-display text-2xl font-bold text-ink">{result.restaurant.name}</h2>
        <p className="mt-1 text-xs text-ink2">
          GPS Coordinates: <code className="font-mono text-purple font-bold">{result.restaurant.latitude}, {result.restaurant.longitude}</code>
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase text-ink2">Customer Digital Menu Link</p>
            <a
              href={result.customerUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block break-all rounded-2xl bg-purple-50 p-3 font-mono text-xs font-bold text-purple"
            >
              {result.customerUrl}
            </a>

            <p className="mt-4 text-xs font-bold uppercase text-ink2">Manager Login Credentials</p>
            <p className="mt-1 rounded-2xl bg-purple-50 p-3 font-mono text-xs font-bold text-ink">
              {result.manager.email}
            </p>
          </div>

          <div className="flex gap-4">
            <div className="text-center">
              <img src={result.qr.dineIn} alt="Dine-in QR" className="h-28 w-28 rounded-2xl border border-purple-100 p-1" />
              <p className="mt-1 text-[11px] font-bold text-ink2">Dine-in QR</p>
            </div>
            <div className="text-center">
              <img src={result.qr.parcel} alt="Parcel QR" className="h-28 w-28 rounded-2xl border border-purple-100 p-1" />
              <p className="mt-1 text-[11px] font-bold text-ink2">Parcel QR</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-2xl bg-purple px-6 py-3 text-xs font-bold text-white shadow-soft"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-lift border border-purple-50">
      <div className="flex items-center justify-between border-b border-purple-50 pb-3">
        <h2 className="font-display text-lg font-bold text-ink">Onboard New Restaurant Venue</h2>
        <button type="button" onClick={onClose} className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-ink2">
          ✕
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-bold uppercase text-ink2">Restaurant Venue Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1.5 w-full rounded-2xl border border-purple/20 bg-purple-50/40 px-4 py-3 text-xs font-bold text-ink focus:border-purple focus:outline-none"
            placeholder="e.g. Sapphire Fine Dining"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-ink2">Latitude</label>
          <input
            value={form.latitude}
            onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            className="mt-1.5 w-full rounded-2xl border border-purple/20 bg-purple-50/40 px-4 py-3 text-xs font-bold text-ink focus:border-purple focus:outline-none"
            placeholder="17.4239"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-ink2">Longitude</label>
          <input
            value={form.longitude}
            onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            className="mt-1.5 w-full rounded-2xl border border-purple/20 bg-purple-50/40 px-4 py-3 text-xs font-bold text-ink focus:border-purple focus:outline-none"
            placeholder="78.4738"
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={useMyLocation}
            className="rounded-full bg-purple-50 px-4 py-2 text-xs font-bold text-purple"
          >
            📍 Use Current Device GPS
          </button>
        </div>

        <div>
          <label className="text-xs font-bold uppercase text-ink2">Geofence Radius (meters)</label>
          <input
            value={form.geofenceRadiusMeters}
            onChange={(e) => setForm({ ...form, geofenceRadiusMeters: e.target.value })}
            type="number"
            className="mt-1.5 w-full rounded-2xl border border-purple/20 bg-purple-50/40 px-4 py-3 text-xs font-bold text-ink focus:border-purple focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-ink2">GST Rate %</label>
          <input
            value={form.gstPercent}
            onChange={(e) => setForm({ ...form, gstPercent: e.target.value })}
            type="number"
            className="mt-1.5 w-full rounded-2xl border border-purple/20 bg-purple-50/40 px-4 py-3 text-xs font-bold text-ink focus:border-purple focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-bold uppercase text-ink2">ALPHAY Platform Commission %</label>
          <input
            value={form.commissionPercent}
            onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })}
            type="number"
            className="mt-1.5 w-full rounded-2xl border border-purple/20 bg-purple-50/40 px-4 py-3 text-xs font-bold text-ink focus:border-purple focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2 mt-2 border-t border-purple-50 pt-4">
          <p className="text-xs font-bold uppercase text-purple">Initial Manager Account</p>
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-ink2">Manager Name</label>
          <input
            value={form.managerName}
            onChange={(e) => setForm({ ...form, managerName: e.target.value })}
            className="mt-1.5 w-full rounded-2xl border border-purple/20 bg-purple-50/40 px-4 py-3 text-xs font-bold text-ink focus:border-purple focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase text-ink2">Manager Email</label>
          <input
            value={form.managerEmail}
            onChange={(e) => setForm({ ...form, managerEmail: e.target.value })}
            type="email"
            className="mt-1.5 w-full rounded-2xl border border-purple/20 bg-purple-50/40 px-4 py-3 text-xs font-bold text-ink focus:border-purple focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-bold uppercase text-ink2">Password</label>
          <input
            value={form.managerPassword}
            onChange={(e) => setForm({ ...form, managerPassword: e.target.value })}
            type="text"
            className="mt-1.5 w-full rounded-2xl border border-purple/20 bg-purple-50/40 px-4 py-3 text-xs font-bold text-ink focus:border-purple focus:outline-none"
          />
        </div>
      </div>

      {error && <p className="mt-4 rounded-xl bg-nonveg-tint p-3 text-xs font-bold text-nonveg">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-6 rounded-2xl bg-purple px-6 py-3.5 text-xs font-bold text-white shadow-lift disabled:opacity-50"
      >
        {saving ? "Onboarding..." : "Onboard Venue"}
      </button>
    </form>
  );
}

function EditRestaurantModal({ restaurant, onUpdated, onClose }) {
  const [form, setForm] = useState({
    name: restaurant?.name || "",
    latitude: String(restaurant?.latitude || ""),
    longitude: String(restaurant?.longitude || ""),
    geofenceRadiusMeters: String(restaurant?.geofenceRadiusMeters || "150"),
    gstPercent: String(restaurant?.gstPercent || "5"),
    commissionPercent: String(restaurant?.commissionPercent || "5"),
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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
        setError("Could not get location from device. Please enter coordinates manually.");
      },
      { enableHighAccuracy: true }
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.latitude || !form.longitude) {
      setError("Restaurant name and GPS location coordinates are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${restaurant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
          geofenceRadiusMeters: parseInt(form.geofenceRadiusMeters, 10),
          gstPercent: parseFloat(form.gstPercent),
          commissionPercent: parseFloat(form.commissionPercent),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || "Couldn't update restaurant venue.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-2xl border border-purple-50 text-ink">
        <div className="flex items-center justify-between border-b border-purple-50 pb-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple">Edit Restaurant Details</span>
            <h2 className="font-display text-xl font-bold text-ink">{restaurant.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-ink2 cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-bold uppercase text-ink2">Restaurant Venue Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1.5 w-full rounded-2xl border border-purple/20 bg-purple-50/40 px-4 py-3 text-xs font-bold text-ink focus:border-purple focus:outline-none"
              placeholder="e.g. Paradise Biryani"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-ink2">GPS Latitude</label>
            <input
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              className="mt-1.5 w-full rounded-2xl border border-purple/20 bg-purple-50/40 px-4 py-3 text-xs font-bold text-ink focus:border-purple focus:outline-none"
              placeholder="17.4239"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-ink2">GPS Longitude</label>
            <input
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              className="mt-1.5 w-full rounded-2xl border border-purple/20 bg-purple-50/40 px-4 py-3 text-xs font-bold text-ink focus:border-purple focus:outline-none"
              placeholder="78.4738"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={useMyLocation}
              className="rounded-full bg-purple-50 px-4 py-2 text-xs font-bold text-purple hover:bg-purple-100 cursor-pointer"
            >
              📍 Use Current Device GPS
            </button>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-ink2">Geofence Radius (meters)</label>
            <input
              value={form.geofenceRadiusMeters}
              onChange={(e) => setForm({ ...form, geofenceRadiusMeters: e.target.value })}
              type="number"
              className="mt-1.5 w-full rounded-2xl border border-purple/20 bg-purple-50/40 px-4 py-3 text-xs font-bold text-ink focus:border-purple focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-ink2">GST Rate %</label>
            <input
              value={form.gstPercent}
              onChange={(e) => setForm({ ...form, gstPercent: e.target.value })}
              type="number"
              className="mt-1.5 w-full rounded-2xl border border-purple/20 bg-purple-50/40 px-4 py-3 text-xs font-bold text-ink focus:border-purple focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-bold uppercase text-ink2">ALPHAY Platform Commission %</label>
            <input
              value={form.commissionPercent}
              onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })}
              type="number"
              className="mt-1.5 w-full rounded-2xl border border-purple/20 bg-purple-50/40 px-4 py-3 text-xs font-bold text-ink focus:border-purple focus:outline-none"
            />
          </div>

          {error && <div className="sm:col-span-2 rounded-xl bg-nonveg-tint p-3 text-xs font-bold text-nonveg">{error}</div>}

          <div className="sm:col-span-2 mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-purple-50 px-5 py-3 text-xs font-bold text-ink2 hover:bg-purple-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-2xl bg-purple px-6 py-3 text-xs font-bold text-white shadow-lift disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);

  const load = async () => {
    const res = await fetch("/api/admin/restaurants");
    if (res.ok) setRestaurants((await res.json()).restaurants);
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
        alert(data.error || "Couldn't open Manager Portal.");
        return;
      }
      window.open("/manager/dashboard", "_blank");
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
        title="Venue Management"
        right={
          !showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 rounded-2xl bg-purple px-4 py-2.5 text-xs font-bold text-white shadow-soft hover:bg-purple-deep transition-all cursor-pointer"
            >
              <IconPlus className="h-4 w-4" />
              <span>Add Restaurant</span>
            </button>
          )
        }
      />
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {showAddForm && (
          <AddRestaurantPanel onCreated={load} onClose={() => setShowAddForm(false)} />
        )}

        <div className="overflow-x-auto rounded-3xl bg-white dark:bg-slate-900 shadow-xl border border-amber-500/30">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-amber-500/20 bg-amber-50/80 dark:bg-slate-950/80 font-['Cinzel'] text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
                <th className="px-5 py-4">Venue ID</th>
                <th className="px-5 py-4">Venue Name</th>
                <th className="px-5 py-4">Manager Credentials</th>
                <th className="px-5 py-4">GPS Location</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100 dark:divide-slate-800 font-semibold text-slate-900 dark:text-white">
              {restaurants === null ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
                    Loading venues...
                  </td>
                </tr>
              ) : (
                restaurants.map((r) => (
                  <tr key={r.id} className="hover:bg-amber-50/40 dark:hover:bg-slate-950/40 transition-colors">
                    <td className="px-5 py-4 font-bold text-amber-600 dark:text-amber-300">#{r.id.slice(-6).toUpperCase()}</td>
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">{r.name}</td>
                    <td className="px-5 py-4 font-sans text-xs">
                      <div className="rounded-xl bg-amber-50 dark:bg-slate-950 p-2 border border-amber-500/20 space-y-0.5">
                        <p className="font-bold text-slate-900 dark:text-white">📧 {r.managerEmail}</p>
                        <p className="font-mono text-[11px] font-extrabold text-amber-700 dark:text-amber-400">🔑 {r.managerPassword || "—"}</p>
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
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingRestaurant(r)}
                          disabled={busyId === r.id}
                          className="rounded-2xl bg-amber-50 dark:bg-slate-950 px-3.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white border border-amber-500/30 hover:border-amber-500 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openManagerPortal(r)}
                          disabled={busyId === r.id}
                          className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-md font-['Cinzel'] transition-all disabled:opacity-50 cursor-pointer"
                        >
                          Launch Portal
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(r)}
                          disabled={busyId === r.id}
                          className="rounded-2xl bg-amber-50 dark:bg-slate-950 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 border border-amber-500/20 hover:text-slate-900 dark:hover:text-white cursor-pointer"
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

      {editingRestaurant && (
        <EditRestaurantModal
          restaurant={editingRestaurant}
          onUpdated={load}
          onClose={() => setEditingRestaurant(null)}
        />
      )}
    </>
  );
}

