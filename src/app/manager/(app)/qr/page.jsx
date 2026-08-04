"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";

export default function ManagerQrPage() {
  const [tables, setTables] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [tableInput, setTableInput] = useState("");
  const [selectedTableNumber, setSelectedTableNumber] = useState("");
  const [renaming, setRenaming] = useState({});
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const res = await fetch("/api/manager/tables");
    if (res.ok) {
      const data = await res.json();
      setTables(data.tables);
      setRestaurantId(data.restaurantId);
      if (!selectedTableNumber && data.tables.length > 0) {
        setSelectedTableNumber(data.tables[0].number);
      }
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addTableAndGenerateQr = async (e) => {
    if (e) e.preventDefault();
    setError("");
    const cleanNumber = tableInput.trim();
    if (!cleanNumber) {
      setError("Please enter a table number (e.g. 1, A1, 12, P1).");
      return;
    }

    setAdding(true);
    try {
      // Check if table already exists
      const existing = tables.find((t) => t.number.toLowerCase() === cleanNumber.toLowerCase());
      if (!existing) {
        const res = await fetch("/api/manager/tables", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ number: cleanNumber }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to add table.");
        }
        await load();
      }
      setSelectedTableNumber(cleanNumber);
      setTableInput("");
    } catch (err) {
      setError(err.message || "Couldn't add table.");
    } finally {
      setAdding(false);
    }
  };

  const renameTable = async (table) => {
    const number = renaming[table.id];
    if (!number || number === table.number) return;
    await fetch(`/api/manager/tables/${table.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number }),
    });
    setRenaming((r) => ({ ...r, [table.id]: undefined }));
    if (selectedTableNumber === table.number) {
      setSelectedTableNumber(number);
    }
    await load();
  };

  const removeTable = async (table) => {
    if (!confirm(`Remove table ${table.number}?`)) return;
    await fetch(`/api/manager/tables/${table.id}`, { method: "DELETE" });
    if (selectedTableNumber === table.number) {
      setSelectedTableNumber("");
    }
    await load();
  };

  const dineInTables = tables.filter((t) => !t.isParcelCounter);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const activeQrTable = selectedTableNumber || (dineInTables[0]?.number || "1");
  const activeQrUrl = `${baseUrl}/r/${restaurantId}?table=${encodeURIComponent(activeQrTable)}`;
  const activeQrImageSrc = `/api/manager/qr/image?table=${encodeURIComponent(activeQrTable)}`;

  return (
    <>
      <Topbar title="Per-Table QR Code Generator" />
      <div className="space-y-6 p-6">
        {/* AUTOMATIC TABLE QR GENERATOR INPUT */}
        <div className="rounded-card bg-white p-6 shadow-soft">
          <div className="max-w-xl">
            <h2 className="font-display text-lg font-medium text-ink">Generate Per-Table QR Code</h2>
            <p className="mt-1 text-xs text-ink2">
              Enter any table number (e.g. <code className="font-semibold text-purple font-mono">1</code>, <code className="font-semibold text-purple font-mono">A1</code>, <code className="font-semibold text-purple font-mono">12</code>, <code className="font-semibold text-purple font-mono">P1</code>) to generate an automatic QR code that directly links to that table.
            </p>

            <form onSubmit={addTableAndGenerateQr} className="mt-4 flex gap-3 sm:flex-row flex-col">
              <input
                value={tableInput}
                onChange={(e) => setTableInput(e.target.value)}
                placeholder="Enter Table No. (e.g. 1 or A1)"
                className="flex-1 rounded-xl border border-purple/15 bg-cream px-4 py-3 text-sm font-semibold text-ink focus:border-purple focus:outline-none"
              />
              <button
                type="submit"
                disabled={adding || !tableInput.trim()}
                className="rounded-xl bg-purple px-6 py-3 text-sm font-semibold text-white shadow-soft transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                {adding ? "Generating…" : "⚡ Generate QR Code"}
              </button>
            </form>
            {error && <p className="mt-3 rounded-lg bg-nonveg-tint px-3 py-2 text-xs text-nonveg">{error}</p>}
          </div>
        </div>

        {/* ACTIVE QR CODE PREVIEW CARD */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-card bg-white p-6 text-center shadow-soft lg:col-span-1">
            <span className="inline-block rounded-full bg-purple-50 px-3 py-1 font-mono text-xs font-semibold text-purple">
              Selected: Table {activeQrTable}
            </span>
            <h3 className="mt-3 font-display text-xl font-medium text-ink">Table {activeQrTable} QR Code</h3>
            <p className="mt-1 text-xs text-ink2">Scanning this code opens the menu pre-filled for Table {activeQrTable}.</p>

            {restaurantId && (
              <div className="mx-auto mt-4 inline-block rounded-2xl border-2 border-purple-50 bg-white p-4 shadow-lift text-center">
                <img
                  src={activeQrImageSrc}
                  alt={`QR Code for Table ${activeQrTable}`}
                  className="h-52 w-52 rounded-xl"
                />
                <p className="mt-2 font-mono text-xs font-bold text-ink uppercase tracking-wider">
                  TABLE NO. {activeQrTable}
                </p>
              </div>
            )}

            <p className="mt-3 break-all font-mono text-[11px] text-ink2 bg-cream px-3 py-2 rounded-lg">
              {activeQrUrl}
            </p>

            <div className="mt-4 flex justify-center gap-3">
              <a
                href={activeQrImageSrc}
                download={`QR-Table-${activeQrTable}.png`}
                className="rounded-full bg-purple px-4 py-2 text-xs font-semibold text-white shadow-soft"
              >
                ⬇ Download PNG
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-full bg-purple-50 px-4 py-2 text-xs font-semibold text-purple"
              >
                🖨 Print QR Sticker
              </button>
            </div>
          </div>

          {/* ALL TABLES GRID VIEW */}
          <div className="rounded-card bg-white p-6 shadow-soft lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-medium text-ink">All Restaurant Tables ({tables.length})</h3>
                <p className="text-xs text-ink2">Click any table below to preview and print its specific QR code.</p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-full bg-cream px-4 py-2 text-xs font-semibold text-ink shadow-soft hover:bg-purple-50 hover:text-purple"
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
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      isSelected
                        ? "border-purple bg-purple-50/40 shadow-soft"
                        : "border-purple-50 bg-cream/30 hover:border-purple/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-ink">
                          {t.isParcelCounter ? "PARCEL" : `Table ${t.number}`}
                        </span>
                        {isSelected && <span className="rounded-full bg-purple px-2 py-0.5 text-[10px] font-semibold text-white">Active</span>}
                      </div>
                      {!t.isParcelCounter && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTable(t);
                          }}
                          aria-label={`Remove table ${t.number}`}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-ink2 hover:bg-nonveg-tint hover:text-nonveg"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-purple-50 pt-2 text-xs text-ink2">
                      <span className="font-mono text-[11px] truncate max-w-[140px]">
                        ?table={t.number}
                      </span>
                      <a
                        href={`/api/manager/qr/image?table=${encodeURIComponent(t.number)}`}
                        download={`QR-Table-${t.number}.png`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold text-purple hover:underline"
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
    </>
  );
}
