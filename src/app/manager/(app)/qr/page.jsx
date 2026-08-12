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

  const removeTable = async (table) => {
    if (!confirm(`Remove table ${table.number}?`)) return;
    await fetch(`/api/manager/tables/${table.id}`, { method: "DELETE" });
    if (selectedTableNumber === table.number) {
      setSelectedTableNumber("");
    }
    await loadTables();
  };

  const activeSessions = dashboardData?.activeSessions || [];
  const dineInTables = tables.filter((t) => !t.isParcelCounter);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const activeQrTable = selectedTableNumber || (dineInTables[0]?.number || "1");
  const activeQrUrl = `${baseUrl}/r/${restaurantId}?table=${encodeURIComponent(activeQrTable)}`;
  const activeQrImageSrc = `/api/manager/qr/image?table=${encodeURIComponent(activeQrTable)}`;

  // Table occupancy helper
  const getTableSession = (tableNo) => {
    return activeSessions.find((s) => String(s.tableNumber) === String(tableNo));
  };

  const occupiedCount = tables.filter((t) => Boolean(getTableSession(t.number))).length;
  const freeCount = tables.length - occupiedCount;

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

        {/* TAB 1: QR CODES TAB */}
        {activeTab === "qr" && (
          <div className="space-y-6">
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
                  Selected: Table {activeQrTable}
                </span>
                <h3 className="mt-3 font-['Cinzel'] text-xl font-bold text-slate-900 dark:text-white">Table {activeQrTable} QR Code</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">Scanning this code opens the digital menu pre-filled for Table {activeQrTable}.</p>

                {restaurantId && (
                  <div className="mx-auto mt-4 inline-block rounded-2xl border-2 border-amber-500/30 bg-white p-4 shadow-xl text-center">
                    <img
                      src={activeQrImageSrc}
                      alt={`QR Code for Table ${activeQrTable}`}
                      className="h-52 w-52 rounded-xl"
                    />
                    <p className="mt-2 font-mono text-xs font-black text-slate-950 uppercase tracking-wider">
                      TABLE NO. {activeQrTable}
                    </p>
                  </div>
                )}

                <p className="mt-3 break-all font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-amber-50/50 dark:bg-slate-950 px-3 py-2 rounded-xl border border-amber-500/20">
                  {activeQrUrl}
                </p>

                <div className="mt-4 flex justify-center gap-3">
                  <a
                    href={activeQrImageSrc}
                    download={`QR-Table-${activeQrTable}.png`}
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
                              {t.isParcelCounter ? "PARCEL" : `Table ${t.number}`}
                            </span>
                            {isSelected && (
                              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-slate-950 font-['Cinzel']">
                                Active
                              </span>
                            )}
                          </div>
                          {!t.isParcelCounter && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeTable(t);
                              }}
                              className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-rose-100 hover:text-rose-700 cursor-pointer"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        <div className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                          <span>Size: {t.capacity || 4} Seats</span>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t border-amber-500/20 pt-2 text-xs">
                          <span className="font-mono text-[11px] truncate max-w-[130px] text-slate-500 dark:text-slate-400">
                            ?table={t.number}
                          </span>
                          <a
                            href={`/api/manager/qr/image?table=${encodeURIComponent(t.number)}`}
                            download={`QR-Table-${t.number}.png`}
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
                    Live Table Occupancy Status ({tables.length} Tables)
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

              <div className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {tables.map((t) => {
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
                        <span>{t.isParcelCounter ? "Parcel Counter" : "Dining Table"}</span>
                        <span>{isOccupied ? "Dining Active" : "Ready"}</span>
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
