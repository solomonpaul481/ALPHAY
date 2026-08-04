"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";

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
  const [result, setResult] = useState(null); // { restaurant, manager, customerUrl, qr }

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
      (err) => {
        setError("Could not get current location. Please allow location permissions or enter coordinates manually.");
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
      <div className="rounded-card bg-white p-6 shadow-lift">
        <p className="text-xs font-semibold uppercase tracking-wide text-veg">Restaurant Created</p>
        <h2 className="mt-1 font-display text-xl font-medium text-ink">{result.restaurant.name} is live</h2>
        <p className="mt-1 text-xs text-ink2">
          📍 Location: <code className="font-mono text-purple font-semibold">{result.restaurant.latitude}, {result.restaurant.longitude}</code> | Geofence Radius: <span className="font-semibold text-purple">{result.restaurant.geofenceRadiusMeters}m</span>
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink2">Customer URL</p>
            <a
              href={result.customerUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block break-all rounded-lg bg-cream px-3 py-2 font-mono text-xs text-purple"
            >
              {result.customerUrl}
            </a>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink2">Manager Login</p>
            <p className="mt-1 rounded-lg bg-cream px-3 py-2 font-mono text-xs text-ink">
              {result.manager.email}
            </p>
            <p className="mt-1 text-xs text-ink2">
              Share the password you just set — there's no self-service reset yet, so pass it along securely.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="text-center">
              <img src={result.qr.dineIn} alt="Dine-in QR" className="h-28 w-28 rounded-lg border border-purple-50" />
              <p className="mt-1 text-[11px] text-ink2">Dine-in</p>
            </div>
            <div className="text-center">
              <img src={result.qr.parcel} alt="Parcel QR" className="h-28 w-28 rounded-lg border border-purple-50" />
              <p className="mt-1 text-[11px] text-ink2">Parcel</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 rounded-xl bg-purple px-5 py-2.5 text-sm font-semibold text-white shadow-soft"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-card bg-white p-6 shadow-lift">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-medium text-ink">Add Restaurant</h2>
        <button type="button" onClick={onClose} className="text-sm text-ink2">
          ✕
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Restaurant Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1.5 w-full rounded-lg border border-purple/15 bg-cream px-3 py-2.5 text-sm text-ink focus:border-purple focus:outline-none"
            placeholder="Ace Cafe"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Latitude</label>
          <input
            value={form.latitude}
            onChange={(e) => setForm({ ...form, latitude: e.target.value })}
            className="mt-1.5 w-full rounded-lg border border-purple/15 bg-cream px-3 py-2.5 text-sm text-ink focus:border-purple focus:outline-none"
            placeholder="17.4239"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Longitude</label>
          <input
            value={form.longitude}
            onChange={(e) => setForm({ ...form, longitude: e.target.value })}
            className="mt-1.5 w-full rounded-lg border border-purple/15 bg-cream px-3 py-2.5 text-sm text-ink focus:border-purple focus:outline-none"
            placeholder="78.4738"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={useMyLocation}
            className="rounded-full bg-purple-50 px-3.5 py-1.5 text-xs font-semibold text-purple"
          >
            📍 Use my current location
          </button>
          <span className="ml-2 text-xs text-ink2">
            Or copy coordinates from Google Maps (right-click the spot → numbers at the top).
          </span>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Geofence radius (meters)</label>
          <input
            value={form.geofenceRadiusMeters}
            onChange={(e) => setForm({ ...form, geofenceRadiusMeters: e.target.value })}
            type="number"
            className="mt-1.5 w-full rounded-lg border border-purple/15 bg-cream px-3 py-2.5 text-sm text-ink focus:border-purple focus:outline-none"
            placeholder="150"
          />
          <p className="mt-1 text-[11px] text-ink2">
            Only customers within this radius from the restaurant location can place QR orders.
          </p>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink2">GST %</label>
          <input
            value={form.gstPercent}
            onChange={(e) => setForm({ ...form, gstPercent: e.target.value })}
            type="number"
            className="mt-1.5 w-full rounded-lg border border-purple/15 bg-cream px-3 py-2.5 text-sm text-ink focus:border-purple focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-ink2">ALPHAY Commission %</label>
          <input
            value={form.commissionPercent}
            onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })}
            type="number"
            className="mt-1.5 w-full rounded-lg border border-purple/15 bg-cream px-3 py-2.5 text-sm text-ink focus:border-purple focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2 mt-2 border-t border-purple-50 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink2">First Manager Account</p>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Manager Name</label>
          <input
            value={form.managerName}
            onChange={(e) => setForm({ ...form, managerName: e.target.value })}
            className="mt-1.5 w-full rounded-lg border border-purple/15 bg-cream px-3 py-2.5 text-sm text-ink focus:border-purple focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Manager Email</label>
          <input
            value={form.managerEmail}
            onChange={(e) => setForm({ ...form, managerEmail: e.target.value })}
            type="email"
            className="mt-1.5 w-full rounded-lg border border-purple/15 bg-cream px-3 py-2.5 text-sm text-ink focus:border-purple focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Temporary Password</label>
          <input
            value={form.managerPassword}
            onChange={(e) => setForm({ ...form, managerPassword: e.target.value })}
            type="text"
            className="mt-1.5 w-full rounded-lg border border-purple/15 bg-cream px-3 py-2.5 text-sm text-ink focus:border-purple focus:outline-none"
            placeholder="At least 8 characters"
          />
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-nonveg-tint px-3 py-2 text-sm text-nonveg">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-5 rounded-xl bg-purple px-5 py-3 text-sm font-semibold text-white shadow-soft disabled:opacity-50"
      >
        {saving ? "Creating…" : "Create Restaurant"}
      </button>
    </form>
  );
}

function EditLocationModal({ restaurant, onSaved, onClose }) {
  const [lat, setLat] = useState(String(restaurant.latitude || ""));
  const [lng, setLng] = useState(String(restaurant.longitude || ""));
  const [radius, setRadius] = useState(String(restaurant.geofenceRadiusMeters || "150"));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
      },
      (err) => {
        setError("Could not get current location.");
      },
      { enableHighAccuracy: true }
    );
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${restaurant.id}/location`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          geofenceRadiusMeters: parseInt(radius, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update location.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <form onSubmit={save} className="w-full max-w-md rounded-card bg-white p-6 shadow-lift">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-medium text-ink">Edit Location & Geofence</h3>
          <button type="button" onClick={onClose} className="text-sm text-ink2">✕</button>
        </div>
        <p className="mt-1 text-xs text-ink2">
          Update the physical GPS coordinates and ordering radius for <strong className="text-ink">{restaurant.name}</strong>.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Latitude</label>
            <input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              className="mt-1 w-full rounded-lg border border-purple/15 bg-cream px-3 py-2 text-sm text-ink focus:border-purple focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Longitude</label>
            <input
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              className="mt-1 w-full rounded-lg border border-purple/15 bg-cream px-3 py-2 text-sm text-ink focus:border-purple focus:outline-none"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={useMyLocation}
              className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple"
            >
              📍 Set to my current location
            </button>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Geofence Radius (meters)</label>
            <input
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              type="number"
              className="mt-1 w-full rounded-lg border border-purple/15 bg-cream px-3 py-2 text-sm text-ink focus:border-purple focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg bg-nonveg-tint px-3 py-2 text-sm text-nonveg">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-cream px-4 py-2 text-sm font-semibold text-ink2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-purple px-4 py-2 text-sm font-semibold text-white shadow-soft disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Location"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLocationRestaurant, setEditingLocationRestaurant] = useState(null);

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
        alert(data.error || "Couldn't open the Manager Portal for this restaurant.");
        return;
      }
      window.open("/manager/dashboard", "_blank");
    } finally {
      setBusyId(null);
    }
  };

  const toggleStatus = async (r) => {
    const verb = r.status === "ACTIVE" ? "suspend" : "reactivate";
    if (!confirm(`${verb.charAt(0).toUpperCase() + verb.slice(1)} ${r.name}?`)) return;
    setBusyId(r.id);
    try {
      await fetch(`/api/admin/restaurants/${r.id}/toggle-status`, { method: "POST" });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const deleteRestaurant = async (r) => {
    if (!confirm(`Are you sure you want to delete "${r.name}"? This action cannot be undone and will permanently remove all associated data.`)) return;
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/admin/restaurants/${r.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete restaurant.");
        return;
      }
      await load();
    } catch (err) {
      alert("Couldn't delete restaurant.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Topbar
        title="Restaurants"
        right={
          !showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="rounded-full bg-purple px-4 py-2 text-sm font-semibold text-white shadow-soft"
            >
              + Add Restaurant
            </button>
          )
        }
      />
      <div className="space-y-6 p-6">
        {showAddForm && (
          <AddRestaurantPanel onCreated={load} onClose={() => setShowAddForm(false)} />
        )}

        {editingLocationRestaurant && (
          <EditLocationModal
            restaurant={editingLocationRestaurant}
            onSaved={load}
            onClose={() => setEditingLocationRestaurant(null)}
          />
        )}

        <div className="overflow-x-auto rounded-card bg-white shadow-soft">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-purple-50 text-xs uppercase tracking-wide text-ink2">
                <th className="px-5 py-3 font-semibold">ID No.</th>
                <th className="px-5 py-3 font-semibold">Restaurant Name</th>
                <th className="px-5 py-3 font-semibold">Location & Geofence</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {restaurants === null ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-sm text-ink2">
                    Loading…
                  </td>
                </tr>
              ) : (
                restaurants.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3 font-mono text-xs text-ink2">{r.id.slice(-6).toUpperCase()}</td>
                    <td className="px-5 py-3 font-medium text-ink">{r.name}</td>
                    <td className="px-5 py-3 text-xs">
                      <div className="font-mono text-ink">
                        📍 {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                      </div>
                      <div className="text-ink2 text-[11px] mt-0.5 flex items-center gap-1.5">
                        <span>Radius: <strong>{r.geofenceRadiusMeters}m</strong></span>
                        <button
                          type="button"
                          onClick={() => setEditingLocationRestaurant(r)}
                          className="text-purple font-semibold underline hover:text-purple-deep"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          r.status === "ACTIVE" ? "bg-veg-tint text-veg" : "bg-nonveg-tint text-nonveg"
                        }`}
                      >
                        {r.status === "ACTIVE" ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openManagerPortal(r)}
                          disabled={busyId === r.id}
                          className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple disabled:opacity-50"
                        >
                          Manager Portal
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(r)}
                          disabled={busyId === r.id}
                          className="rounded-full bg-cream px-3 py-1.5 text-xs font-semibold text-ink2 disabled:opacity-50"
                        >
                          {r.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRestaurant(r)}
                          disabled={busyId === r.id}
                          className="rounded-full bg-nonveg-tint px-3 py-1.5 text-xs font-semibold text-nonveg hover:bg-nonveg/10 disabled:opacity-50"
                        >
                          Delete
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
