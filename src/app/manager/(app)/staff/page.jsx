"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";

const DEPARTMENTS = ["KITCHEN", "CLEANING", "SERVICE", "MANAGEMENT"];
const EMPTY_FORM = { empCode: "", name: "", department: "KITCHEN", salary: "" };

export default function ManagerStaffPage() {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState({});

  const load = async () => {
    const res = await fetch("/api/manager/staff");
    if (res.ok) setStaff((await res.json()).staff);
  };

  useEffect(() => {
    load();
  }, []);

  const addStaff = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.empCode || !form.name || !form.salary) {
      setError("Employee ID, name, and salary are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/manager/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(err.message || "Couldn't add staff member.");
    } finally {
      setSaving(false);
    }
  };

  const saveSalary = async (member) => {
    const salary = editing[member.id];
    if (salary === undefined || Number(salary) === member.salary) return;
    await fetch(`/api/manager/staff/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salary }),
    });
    setEditing((e) => ({ ...e, [member.id]: undefined }));
    await load();
  };

  const changeDepartment = async (member, department) => {
    await fetch(`/api/manager/staff/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ department }),
    });
    await load();
  };

  const removeStaff = async (member) => {
    if (!confirm(`Remove ${member.name} from staff?`)) return;
    await fetch(`/api/manager/staff/${member.id}`, { method: "DELETE" });
    await load();
  };

  return (
    <>
      <Topbar title="Staff" />
      <div className="grid gap-6 p-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-card bg-white p-5 shadow-soft">
          <h2 className="font-display text-base font-medium text-ink">Add Employee</h2>
          <form onSubmit={addStaff} className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Employee ID</label>
              <input
                value={form.empCode}
                onChange={(e) => setForm({ ...form, empCode: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-purple/15 bg-cream px-3 py-2.5 text-sm text-ink focus:border-purple focus:outline-none"
                placeholder="115"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-purple/15 bg-cream px-3 py-2.5 text-sm text-ink focus:border-purple focus:outline-none"
                placeholder="Employee's name"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-purple/15 bg-cream px-3 py-2.5 text-sm text-ink focus:border-purple focus:outline-none"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0) + d.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Salary (₹/mo)</label>
              <input
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                type="number"
                min="0"
                className="mt-1.5 w-full rounded-lg border border-purple/15 bg-cream px-3 py-2.5 text-sm text-ink focus:border-purple focus:outline-none"
                placeholder="15000"
              />
            </div>
            {error && <p className="rounded-lg bg-nonveg-tint px-3 py-2 text-sm text-nonveg">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-purple py-3 text-sm font-semibold text-white shadow-soft disabled:opacity-50"
            >
              {saving ? "Adding…" : "Add Employee"}
            </button>
          </form>
        </div>

        <div className="rounded-card bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-purple-50 text-xs uppercase tracking-wide text-ink2">
                  <th className="px-5 py-3 font-semibold">Emp. ID</th>
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-5 py-3 font-semibold">Department</th>
                  <th className="px-5 py-3 font-semibold">Salary</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50">
                {staff.map((s) => (
                  <tr key={s.id}>
                    <td className="px-5 py-3 font-mono text-ink">{s.empCode}</td>
                    <td className="px-5 py-3 font-medium text-ink">{s.name}</td>
                    <td className="px-5 py-3">
                      <select
                        value={s.department}
                        onChange={(e) => changeDepartment(s, e.target.value)}
                        className="rounded-lg border border-purple/15 bg-cream px-2 py-1 text-xs text-ink"
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d.charAt(0) + d.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <input
                        value={editing[s.id] ?? s.salary}
                        onChange={(e) => setEditing((ed) => ({ ...ed, [s.id]: e.target.value }))}
                        onBlur={() => saveSalary(s)}
                        type="number"
                        className="w-24 rounded-lg border border-purple/15 bg-cream px-2 py-1 font-mono text-xs text-ink"
                      />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => removeStaff(s)}
                        className="rounded-full bg-cream px-2.5 py-1.5 text-xs font-semibold text-ink2 hover:bg-nonveg-tint hover:text-nonveg"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-ink2">
                      No staff added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
