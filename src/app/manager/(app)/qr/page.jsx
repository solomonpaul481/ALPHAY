"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";

export default function ManagerQrPage() {
  const [tables, setTables] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [activeTab, setActiveTab] = useState("qr"); // 'qr' | 'tables'
  const [tableInput, setTableInput] = useState("");
  const [sizeInput, setSizeInput] = useState("4");
  const [selectedTableNumber, setSelectedTableNumber] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  const loadTables = async () => {
    const res = await fetch("/api/manager/tables");
    if (res.ok) {
      const data = await res.json();
      setTables(data.tables || []);
      setRestaurantId(data.restaurantId);
      if (!selectedTableNumber && data.tables?.length > 0) {
        setSelectedTableNumber(data.tables[0].number);
      }
    }
  };

  const loadDashboard = async () => {
    const res = await fetch("/api/manager/dashboard");
    if (res.ok) {
      const json = await res.json();
      setDashboardData(json);
    }
  };

  useEffect(() => {
    loadTables();
    loadDashboard();
    const interval = setInterval(loadDashboard, 4000);
    return () => clearInterval(interval);
  }, []);

  const addTableAndGenerateQr = async (e) => {
    if (e) e.preventDefault();
    setError("");
    const cleanNumber = tableInput.trim();
    if (!cleanNumber) {
      setError("Please enter a table number (e.g. 1, A1, 12, P1).");
      return;
    }

    const cleanCap = parseInt(sizeInput.replace(/\D/g, ""), 10) || 4;

    setAdding(true);
    try {
      const existing = tables.find((t) => t.number.toLowerCase() === cleanNumber.toLowerCase());
      if (!existing) {
        const res = await fetch("/api/manager/tables", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ number: cleanNumber, capacity: cleanCap }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to add table.");
        }
        await loadTables();
      }
      setSelectedTableNumber(cleanNumber);
      setTableInput("");
    } catch (err) {
      setError(err.message || "Couldn't add table.");
    } finally {
      setAdding(false);
    }
  };

  const [deletingId, setDeletingId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState({ text: "", isError: false });

  const removeTable = async (table) => {
    if (!table) return;
    if (table.isParcelCounter || String(table.number).trim().toUpperCase() === "PARCEL") {
      alert("The Parcel Takeaway Counter table cannot be deleted.");
      return;
    }
    const ok = window.confirm(
      `Are you sure you want to delete Table ${table.number}?\n\nThis will remove the table and its QR code from the system.`
    );
    if (!ok) return;

    setDeletingId(table.id);
    setFeedbackMsg({ text: "", isError: false });
    setError("");

    try {
      const res = await fetch(`/api/manager/tables/${table.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete table.");
      }

      setFeedbackMsg({
        text: `✓ Table ${table.number} has been deleted successfully.`,
        isError: false,
      });

      if (selectedTableNumber === table.number) {
        setSelectedTableNumber("");
      }
      await loadTables();
      await loadDashboard();
    } catch (err) {
      setFeedbackMsg({
        text: err.message || "Failed to delete table.",
        isError: true,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const activeSessions = dashboardData?.activeSessions || [];
  const dineInTables = tables.filter((t) => !t.isParcelCounter && t.number !== "PARCEL");
  const parcelTable = tables.find((t) => t.isParcelCounter || t.number === "PARCEL");
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const activeQrTable = selectedTableNumber || (dineInTables[0]?.number || "1");
  const isParcelActive = activeQrTable === "PARCEL" || Boolean(tables.find((t) => t.number === activeQrTable)?.isParcelCounter);
  const activeQrUrl = isParcelActive
    ? `${baseUrl}/r/${restaurantId}?type=parcel&table=PARCEL`
    : `${baseUrl}/r/${restaurantId}?table=${encodeURIComponent(activeQrTable)}`;
  const activeQrImageSrc = isParcelActive
    ? `/api/manager/qr/image?type=parcel&table=PARCEL`
    : `/api/manager/qr/image?table=${encodeURIComponent(activeQrTable)}`;

  // Table occupancy helper
  const getTableSession = (tableNo) => {
    return activeSessions.find((s) => String(s.tableNumber) === String(tableNo));
  };

  const occupiedCount = dineInTables.filter((t) => Boolean(getTableSession(t.number))).length;
  const freeCount = dineInTables.length - occupiedCount;

  return (
    <>
      <Topbar title="QR & Tables Management" />
      <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto text-slate-900 dark:text-white">
        {/* TOP TAB NAVIGATION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white dark:bg-slate-900 p-4 shadow-xl border border-amber-500/30 transition-colors">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("qr")}
              className={`rounded-2xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer font-['Cinzel'] flex items-center gap-2 ${
                activeTab === "qr"
                  ? "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 shadow-md"
                  : "bg-amber-50 text-slate-700 border border-amber-400/30 hover:bg-amber-100 dark:bg-slate-950 dark:text-slate-400 dark:border-amber-500/20 dark:hover:text-white"
              }`}
            >
              <span>📱</span>
              <span>QR Codes</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tables")}
              className={`rounded-2xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer font-['Cinzel'] flex items-center gap-2 ${
                activeTab === "tables"
                  ? "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 shadow-md"
                  : "bg-amber-50 text-slate-700 border border-amber-400/30 hover:bg-amber-100 dark:bg-slate-950 dark:text-slate-400 dark:border-amber-500/20 dark:hover:text-white"
              }`}
            >
              <span>🪑</span>
              <span>Tables Live Status</span>
            </button>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs font-bold">
            <span className="rounded-full bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300 px-3 py-1 border border-rose-400 font-['Cinzel']">
              🔴 Occupied: {occupiedCount}
            </span>
            <span className="rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 px-3 py-1 border border-emerald-400 font-['Cinzel']">
              🟢 Free: {freeCount}
            </span>
          </div>
        </div>

        {/* FEEDBACK BANNER */}
        {feedbackMsg.text && (
          <div
            className={`rounded-2xl p-4 text-xs font-bold font-['Cinzel'] flex items-center justify-between border shadow-lg transition-all ${
              feedbackMsg.isError
                ? "bg-rose-100 text-rose-950 border-rose-400 dark:bg-rose-950/80 dark:text-rose-200"
                : "bg-emerald-100 text-emerald-950 border-emerald-400 dark:bg-emerald-950/80 dark:text-emerald-200"
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button
              type="button"
              onClick={() => setFeedbackMsg({ text: "", isError: false })}
              className="text-base font-bold opacity-70 hover:opacity-100 cursor-pointer ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 1: QR CODES TAB */}
        {activeTab === "qr" && (
          <div className="space-y-6">
            {/* DEDICATED PARCEL TAKEAWAY QR CODE BANNER */}
            <div className="rounded-3xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-slate-900 border-2 border-amber-500/40 p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute right-0 top-0 -mr-12 -mt-12 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-400 border border-amber-500/40 font-['Cinzel']">
                    <span>📦</span> Dedicated Takeaway System
                  </div>
                  <h2 className="font-['Cinzel'] text-2xl font-black text-slate-900 dark:text-white">
                    Parcel & Takeaway Counter QR Code
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    Place this QR code at your takeaway counter or entrance. Customers scan this QR to order parcel takeaway with <strong>isolated customer sessions</strong> and a synchronized <strong>4-digit pickup token</strong>. These orders route directly to the Parcel Category and will never display a table number.
                  </p>
                  <p className="font-mono text-[11px] text-amber-600 dark:text-amber-400 bg-black/20 px-3 py-1.5 rounded-xl border border-amber-500/20 break-all inline-block">
                    {baseUrl}/r/{restaurantId}?type=parcel&table=PARCEL
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-white dark:bg-slate-950 p-4 rounded-2xl border border-amber-500/40 shadow-xl">
                  <div className="text-center">
                    <img
                      src="/api/manager/qr/image?type=parcel&table=PARCEL"
                      alt="Parcel Takeaway QR"
                      className="h-28 w-28 rounded-lg mx-auto"
                    />
                    <p className="mt-1 font-mono text-[10px] font-black text-slate-950 dark:text-amber-300 uppercase">
                      PARCEL QR
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <a
                      href="/api/manager/qr/image?type=parcel&table=PARCEL"
                      download="QR-Parcel-Takeaway.png"
                      className="rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 px-4 py-2 text-xs font-black text-slate-950 shadow-md font-['Cinzel'] text-center hover:opacity-90"
                    >
                      ⬇ Download Sticker
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTableNumber("PARCEL");
                      }}
                      className="rounded-xl bg-amber-50 dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-900 dark:text-white border border-amber-500/30 hover:border-amber-500 font-['Cinzel'] text-center cursor-pointer"
                    >
                      👁 View Full Preview
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* TABLE GENERATOR FORM CARD */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-amber-500/30 transition-colors">
              <div className="max-w-2xl">
                <h2 className="font-['Cinzel'] text-lg font-extrabold text-slate-900 dark:text-white">
                  Generate Per-Table QR Code & Specify Table Size
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Enter table number and seating capacity (e.g., <code className="font-mono text-amber-600 dark:text-amber-400 font-bold">Table 12</code>, <code className="font-mono text-amber-600 dark:text-amber-400 font-bold">4 Seats</code>) to generate an automatic instant QR sticker.
                </p>

                <form onSubmit={addTableAndGenerateQr} className="mt-4 grid gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-5">
                    <label className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 font-['Cinzel']">Table Number</label>
                    <input
                      value={tableInput}
                      onChange={(e) => setTableInput(e.target.value)}
                      placeholder="e.g. 1, A1, 12, P1"
                      className="mt-1 w-full rounded-2xl border border-amber-500/30 bg-amber-50/50 dark:bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 font-['Cinzel']">Table Size / Capacity</label>
                    <select
                      value={sizeInput}
                      onChange={(e) => setSizeInput(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-amber-500/30 bg-amber-50/50 dark:bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="2">2 Seats (Small)</option>
                      <option value="4">4 Seats (Standard)</option>
                      <option value="6">6 Seats (Family)</option>
                      <option value="8">8 Seats (Large Group)</option>
                      <option value="12">12+ Seats (Banquet)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3 flex items-end">
                    <button
                      type="submit"
                      disabled={adding || !tableInput.trim()}
                      className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-2.5 text-xs font-black text-slate-950 font-['Cinzel'] shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {adding ? "Generating…" : "⚡ Generate QR"}
                    </button>
                  </div>
                </form>
                {error && <p className="mt-3 rounded-xl bg-rose-100 text-rose-900 dark:bg-rose-950/80 p-2.5 text-xs font-bold border border-rose-400">{error}</p>}
              </div>
            </div>

            {/* ACTIVE QR CODE PREVIEW & GRID */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 text-center shadow-xl border border-amber-500/30 lg:col-span-1 transition-colors">
                <span className="inline-block rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 px-3 py-1 font-mono text-xs font-bold border border-amber-300 dark:border-amber-500/30">
                  Selected: {isParcelActive ? "📦 PARCEL TAKEAWAY COUNTER" : `Table ${activeQrTable}`}
                </span>
                <h3 className="mt-3 font-['Cinzel'] text-xl font-bold text-slate-900 dark:text-white">
                  {isParcelActive ? "Parcel Takeaway QR Code" : `Table ${activeQrTable} QR Code`}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isParcelActive
                    ? "Scanning this code opens takeaway ordering with 4-digit pickup code isolation."
                    : `Scanning this code opens the digital menu pre-filled for Table ${activeQrTable}.`}
                </p>

                {restaurantId && (
                  <div className="mx-auto mt-4 inline-block rounded-2xl border-2 border-amber-500/30 bg-white p-4 shadow-xl text-center">
                    <img
                      src={activeQrImageSrc}
                      alt={isParcelActive ? "QR Code for Parcel Takeaway" : `QR Code for Table ${activeQrTable}`}
                      className="h-52 w-52 rounded-xl"
                    />
                    <p className="mt-2 font-mono text-xs font-black text-slate-950 uppercase tracking-wider">
                      {isParcelActive ? "PARCEL TAKEAWAY COUNTER" : `TABLE NO. ${activeQrTable}`}
                    </p>
                  </div>
                )}

                <p className="mt-3 break-all font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-amber-50/50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-amber-500/20">
                  {activeQrUrl}
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-2.5">
                  <a
                    href={activeQrImageSrc}
                    download={isParcelActive ? "QR-Parcel-Takeaway.png" : `QR-Table-${activeQrTable}.png`}
                    className="rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 px-4 py-2 text-xs font-black text-slate-950 shadow-md font-['Cinzel']"
                  >
                    ⬇ Download PNG
                  </a>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="rounded-2xl bg-amber-50 dark:bg-slate-950 px-4 py-2 text-xs font-bold text-slate-900 dark:text-white border border-amber-500/30 font-['Cinzel'] cursor-pointer"
                  >
                    🖨 Print QR Sticker
                  </button>

                  {!isParcelActive && (
                    <button
                      type="button"
                      onClick={() => {
                        const tableObj = tables.find((t) => t.number === activeQrTable);
                        if (tableObj) removeTable(tableObj);
                      }}
                      disabled={deletingId === tables.find((t) => t.number === activeQrTable)?.id}
                      className="rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/80 px-4 py-2 text-xs font-black text-rose-600 dark:text-rose-300 border border-rose-400/40 font-['Cinzel'] cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <span>🗑️</span>
                      <span>
                        {deletingId === tables.find((t) => t.number === activeQrTable)?.id
                          ? "Deleting..."
                          : `Delete Table ${activeQrTable}`}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* ALL TABLES GRID VIEW */}
              <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-amber-500/30 lg:col-span-2 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-['Cinzel'] text-base font-extrabold text-slate-900 dark:text-white">All Restaurant Tables ({tables.length})</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Click any table below to preview, download, or print its QR code.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="rounded-2xl bg-amber-50 dark:bg-slate-950 px-4 py-2 text-xs font-bold text-slate-900 dark:text-white border border-amber-500/30 hover:border-amber-500 cursor-pointer font-['Cinzel']"
                  >
                    🖨 Print All Table QRs
                  </button>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {tables.map((t) => {
                    const isSelected = selectedTableNumber === t.number;
                    const isParcel = t.isParcelCounter || t.number === "PARCEL";
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTableNumber(t.number)}
                        className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                          isSelected
                            ? "border-amber-500 bg-amber-50/80 dark:bg-slate-950 shadow-md ring-2 ring-amber-500/40"
                            : "border-amber-500/20 bg-amber-50/20 dark:bg-slate-950/60 hover:border-amber-500/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-base font-black text-slate-900 dark:text-white">
                              {isParcel ? "📦 PARCEL COUNTER" : `Table ${t.number}`}
                            </span>
                            {isSelected && (
                              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-slate-950 font-['Cinzel']">
                                Active
                              </span>
                            )}
                          </div>
                          {!isParcel && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeTable(t);
                              }}
                              disabled={deletingId === t.id}
                              title={`Delete Table ${t.number}`}
                              className="flex items-center gap-1 rounded-xl bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:hover:bg-rose-900/90 px-2.5 py-1 text-[11px] font-black border border-rose-300 dark:border-rose-500/40 cursor-pointer transition-all disabled:opacity-50 font-['Cinzel']"
                            >
                              <span>🗑️</span>
                              <span>{deletingId === t.id ? "..." : "Delete"}</span>
                            </button>
                          )}
                        </div>

                        <div className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          <span>{isParcel ? "Takeaway Pickup Desk" : `Size: ${t.capacity || 4} Seats`}</span>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-amber-500/20 pt-2 text-xs">
                          <span className="font-mono text-[11px] truncate max-w-[130px] text-slate-500 dark:text-slate-400">
                            {isParcel ? "?type=parcel&table=PARCEL" : `?table=${t.number}`}
                          </span>
                          <a
                            href={isParcel ? "/api/manager/qr/image?type=parcel&table=PARCEL" : `/api/manager/qr/image?table=${encodeURIComponent(t.number)}`}
                            download={isParcel ? "QR-Parcel-Takeaway.png" : `QR-Table-${t.number}.png`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-bold text-amber-600 dark:text-amber-400 hover:underline font-['Cinzel']"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TABLES LIVE STATUS TAB (PALE RED OCCUPIED / PALE GREEN FREE) */}
        {activeTab === "tables" && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-amber-500/30 transition-colors">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-4">
                <div>
                  <h2 className="font-['Cinzel'] text-xl font-extrabold text-slate-900 dark:text-white">
                    Live Dining Table Occupancy Status ({dineInTables.length} Tables)
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    Real-time status: Occupied tables are highlighted in pale red, and free tables are in pale green.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-200 px-3 py-1 text-xs font-black border border-rose-400 font-['Cinzel']">
                    Occupied (Pale Red)
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 px-3 py-1 text-xs font-black border border-emerald-400 font-['Cinzel']">
                    Free (Pale Green)
                  </span>
                </div>
              </div>

              {parcelTable && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 font-['Cinzel']">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📦</span>
                    <div>
                      <h4 className="text-sm font-black text-amber-500 dark:text-amber-400">
                        Takeaway & Parcel Counter: Active
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                        Parcel orders do not occupy dining tables. All takeaway orders are tracked under the Parcel tab with 4-digit pickup tokens.
                      </p>
                    </div>
                  </div>
                  <a
                    href="/manager/parcel"
                    className="rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 transition-all"
                  >
                    Open Parcel Counter ➜
                  </a>
                </div>
              )}

              <div className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {dineInTables.map((t) => {
                  const sess = getTableSession(t.number);
                  const isOccupied = Boolean(sess);

                  return (
                    <div
                      key={t.id}
                      className={`rounded-3xl p-5 shadow-xl border-2 flex flex-col justify-between transition-all ${
                        isOccupied
                          ? "bg-rose-100 text-rose-950 border-rose-400 dark:bg-rose-950/85 dark:text-rose-100 dark:border-rose-500/70 ring-2 ring-rose-500/30"
                          : "bg-emerald-100 text-emerald-950 border-emerald-400 dark:bg-emerald-950/85 dark:text-emerald-100 dark:border-emerald-500/70"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between border-b border-current/20 pb-3">
                          <div>
                            <h3 className="font-['Cinzel'] text-lg font-black tracking-wide">
                              Table #{t.number}
                            </h3>
                            <p className="text-xs font-bold opacity-80 mt-0.5 font-mono">
                              Size: {t.capacity || 4} Seats
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider font-['Cinzel'] ${
                              isOccupied
                                ? "bg-rose-600 text-white shadow-md animate-pulse"
                                : "bg-emerald-600 text-white shadow-md"
                            }`}
                          >
                            {isOccupied ? "OCCUPIED 🔴" : "FREE 🟢"}
                          </span>
                        </div>

                        {isOccupied ? (
                          <div className="mt-3 space-y-1.5 font-mono text-xs">
                            <div className="flex justify-between font-bold">
                              <span>Token:</span>
                              <span>#{sess.id.slice(-6).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between font-bold">
                              <span>Items Ordered:</span>
                              <span>{sess.items?.length || 0} items</span>
                            </div>
                            <div className="flex justify-between font-black text-sm pt-1 border-t border-rose-400/40">
                              <span>Current Bill:</span>
                              <span>₹{(sess.totalAmount || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-4 p-3 rounded-2xl bg-emerald-200/50 dark:bg-emerald-900/40 text-center font-mono text-xs font-bold opacity-90">
                            Available for guests
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-current/20 flex justify-between items-center text-xs font-bold font-['Cinzel']">
                        <span>Dining Table</span>
                        <div className="flex items-center gap-2">
                          <span>{isOccupied ? "Dining Active" : "Ready"}</span>
                          {!isOccupied && (
                            <button
                              type="button"
                              onClick={() => removeTable(t)}
                              disabled={deletingId === t.id}
                              className="ml-2 px-2 py-0.5 rounded-lg bg-rose-200/60 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 hover:bg-rose-300 text-[10px] font-black font-['Cinzel'] cursor-pointer"
                              title={`Delete Table ${t.number}`}
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
