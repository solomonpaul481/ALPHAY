"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";

export default function AdminTransactionsPage() {
  const [rows, setRows] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    const res = await fetch("/api/admin/transactions");
    if (res.ok) setRows((await res.json()).transactions);
  };

  useEffect(() => {
    load();
  }, []);

  const togglePaymentStatus = async (r) => {
    const isCurrentlyDone = ["DONE", "PAID", "ACTIVE"].includes(r.billingStatus);
    const nextStatus = isCurrentlyDone ? "PENDING" : "DONE";
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/admin/transactions/${r.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to update payment status.");
        return;
      }
      await load();
    } catch (err) {
      alert("Error updating payment status.");
    } finally {
      setBusyId(null);
    }
  };

  const sendReminder = async (r) => {
    setBusyId(r.id);
    try {
      await fetch(`/api/admin/transactions/${r.id}/remind`, { method: "POST" });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const toggleRestaurantStatus = async (r) => {
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

  return (
    <>
      <Topbar title="Transactions & Financials" />
      <div className="p-6">
        <div className="overflow-x-auto rounded-card bg-white shadow-soft">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-purple-50 text-xs uppercase tracking-wide text-ink2">
                <th className="px-5 py-3.5 font-semibold">NAME</th>
                <th className="px-5 py-3.5 font-semibold">SALES</th>
                <th className="px-5 py-3.5 font-semibold">COMMISSION</th>
                <th className="px-5 py-3.5 font-semibold">RESTAURANT STATUS</th>
                <th className="px-5 py-3.5 font-semibold">PAYMENT STATUS</th>
                <th className="px-5 py-3.5 font-semibold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {rows === null ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-ink2">
                    Loading transactions…
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const isDone = ["DONE", "PAID", "ACTIVE"].includes(r.billingStatus);
                  return (
                    <tr key={r.id}>
                      <td className="px-5 py-3.5 font-medium text-ink">{r.name}</td>
                      <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-ink">
                        ₹{r.sales.toFixed(0)}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs tabular-nums text-purple font-semibold">
                        ₹{r.commission.toFixed(0)}{" "}
                        <span className="text-ink2/60 font-normal">({r.commissionPercent}%)</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            r.status === "ACTIVE" ? "bg-veg-tint text-veg" : "bg-nonveg-tint text-nonveg"
                          }`}
                        >
                          {r.status === "ACTIVE" ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => togglePaymentStatus(r)}
                          disabled={busyId === r.id}
                          title="Click to change payment status"
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all hover:scale-105 disabled:opacity-50 ${
                            isDone
                              ? "bg-veg-tint text-veg border border-veg/20"
                              : "bg-gold/10 text-gold border border-gold/20"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${isDone ? "bg-veg" : "bg-gold"}`} />
                          {isDone ? "Done" : "Pending"}
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          <button
                            type="button"
                            onClick={() => togglePaymentStatus(r)}
                            disabled={busyId === r.id}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                              isDone
                                ? "bg-gold/10 text-gold hover:bg-gold/20"
                                : "bg-veg-tint text-veg hover:bg-veg/20"
                            }`}
                          >
                            {isDone ? "Mark Pending" : "Mark Done"}
                          </button>
                          <button
                            type="button"
                            onClick={() => sendReminder(r)}
                            disabled={busyId === r.id}
                            className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple disabled:opacity-50 hover:bg-purple/10"
                          >
                            Send Reminder
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleRestaurantStatus(r)}
                            disabled={busyId === r.id}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                              r.status === "ACTIVE"
                                ? "bg-nonveg-tint text-nonveg hover:bg-nonveg/20"
                                : "bg-veg-tint text-veg hover:bg-veg/20"
                            }`}
                          >
                            {r.status === "ACTIVE" ? "Suspend" : "Reactivate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

