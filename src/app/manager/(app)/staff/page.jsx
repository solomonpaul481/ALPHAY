"use client";

import { useEffect, useState } from "react";
import Topbar from "@/components/dashboard/Topbar";

const DEPARTMENTS = ["KITCHEN", "CLEANING", "SERVICE", "MANAGEMENT"];
const GENDERS = ["Male", "Female", "Other"];

const EMPTY_FORM = {
  empCode: "",
  name: "",
  department: "KITCHEN",
  salary: "",
  gender: "Male",
  phone: "",
};

function EditStaffModal({ member, onClose, onSaved }) {
  const [form, setForm] = useState({
    empCode: member.empCode || "",
    name: member.name || "",
    department: member.department || "KITCHEN",
    salary: String(member.salary || ""),
    gender: member.gender || "Male",
    phone: member.phone || "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.empCode || !form.name || !form.salary) {
      setError("Employee ID, name, and salary are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/manager/staff/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update employee.");
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/40 p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
          <h3 className="font-['Cinzel'] text-lg font-extrabold text-white">Edit Employee Details</h3>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-800 p-2 text-xs font-bold text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label className="text-[11px] font-black uppercase text-amber-400 font-['Cinzel']">Employee ID (Emp Code)</label>
            <input
              value={form.empCode}
              onChange={(e) => setForm({ ...form, empCode: e.target.value })}
              className="mt-1 w-full rounded-2xl border border-amber-500/30 bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-black uppercase text-amber-400 font-['Cinzel']">Full Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-2xl border border-amber-500/30 bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-black uppercase text-amber-400 font-['Cinzel']">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="mt-1 w-full rounded-2xl border border-amber-500/30 bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase text-amber-400 font-['Cinzel']">Phone Number</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="mt-1 w-full rounded-2xl border border-amber-500/30 bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-black uppercase text-amber-400 font-['Cinzel']">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="mt-1 w-full rounded-2xl border border-amber-500/30 bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0) + d.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase text-amber-400 font-['Cinzel']">Salary (₹/mo)</label>
              <input
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                type="number"
                className="mt-1 w-full rounded-2xl border border-amber-500/30 bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white focus:border-amber-400 focus:outline-none font-mono"
              />
            </div>
          </div>

          {error && <p className="rounded-xl bg-rose-950/80 border border-rose-500/40 p-2.5 text-xs font-bold text-rose-300">{error}</p>}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl bg-slate-800 py-3 text-xs font-bold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3 text-xs font-black text-slate-950 font-['Cinzel'] shadow-md disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ManagerStaffPage() {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

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

  const removeStaff = async (member) => {
    if (!confirm(`Remove ${member.name} from staff?`)) return;
    await fetch(`/api/manager/staff/${member.id}`, { method: "DELETE" });
    await load();
  };

  return (
    <>
      <Topbar title="Staff Management" />
      <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[340px_1fr] max-w-7xl mx-auto text-slate-900 dark:text-white">
        {/* ADD EMPLOYEE FORM CARD */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-xl border border-amber-500/30 transition-colors">
          <h2 className="font-['Cinzel'] text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <span>👥</span>
            <span>Add New Employee</span>
          </h2>
          <form onSubmit={addStaff} className="mt-4 space-y-3">
            <div>
              <label className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 font-['Cinzel']">Employee ID (Emp Code)</label>
              <input
                value={form.empCode}
                onChange={(e) => setForm({ ...form, empCode: e.target.value })}
                className="mt-1 w-full rounded-2xl border border-amber-500/30 bg-amber-50/50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                placeholder="101"
              />
            </div>
            <div>
              <label className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 font-['Cinzel']">Full Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-2xl border border-amber-500/30 bg-amber-50/50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                placeholder="Employee Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 font-['Cinzel']">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="mt-1 w-full rounded-2xl border border-amber-500/30 bg-amber-50/50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                >
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 font-['Cinzel']">Phone Number</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="mt-1 w-full rounded-2xl border border-amber-500/30 bg-amber-50/50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 font-['Cinzel']">Department</label>
              <select
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="mt-1 w-full rounded-2xl border border-amber-500/30 bg-amber-50/50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0) + d.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase text-amber-600 dark:text-amber-400 font-['Cinzel']">Salary (₹/mo)</label>
              <input
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                type="number"
                min="0"
                className="mt-1 w-full rounded-2xl border border-amber-500/30 bg-amber-50/50 dark:bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:border-amber-500 focus:outline-none font-mono"
                placeholder="18000"
              />
            </div>

            {error && <p className="rounded-xl bg-rose-100 text-rose-900 dark:bg-rose-950/80 border border-rose-400 dark:border-rose-500/40 p-2.5 text-xs font-bold">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3.5 text-xs font-black text-slate-950 font-['Cinzel'] shadow-md cursor-pointer disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add Employee"}
            </button>
          </form>
        </div>

        {/* STAFF DIRECTORY TABLE */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 shadow-xl border border-amber-500/30 overflow-hidden transition-colors">
          <div className="px-6 py-4 border-b border-amber-500/20">
            <h3 className="font-['Cinzel'] text-lg font-extrabold text-slate-900 dark:text-white">Staff Directory</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Manage employee details, department, phone, and monthly compensation.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-amber-200 dark:border-slate-800 bg-amber-50/90 dark:bg-slate-950/80 font-['Cinzel'] text-[11px] font-black uppercase text-amber-800 dark:text-amber-400">
                  <th className="px-5 py-3.5">Emp ID</th>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Gender</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Salary</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-semibold">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-amber-300 font-bold">#{s.empCode}</td>
                    <td className="px-5 py-3.5 font-bold text-white font-['Cinzel']">{s.name}</td>
                    <td className="px-5 py-3.5 text-slate-300">{s.gender || "—"}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-300">{s.phone || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-black text-amber-400 border border-amber-500/30 font-['Cinzel']">
                        {s.department}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-emerald-400">₹{s.salary.toFixed(0)}/mo</td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingMember(s)}
                        className="rounded-xl bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 transition-all cursor-pointer font-['Cinzel']"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStaff(s)}
                        className="rounded-xl bg-rose-950/60 px-3 py-1.5 text-xs font-bold text-rose-400 border border-rose-500/30 hover:bg-rose-900 transition-all cursor-pointer font-['Cinzel']"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-xs font-bold text-slate-400 font-['Cinzel']">
                      No employees onboarded yet. Fill out form to add your first staff member.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editingMember && (
        <EditStaffModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSaved={load}
        />
      )}
    </>
  );
}
