"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ManagerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/manager/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't sign in.");
      router.push("/manager/dashboard");
      router.refresh();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-50 to-cream px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple text-2xl text-white shadow-lift">
            🍽️
          </div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-purple">
            ALPHAY
          </p>
          <h1 className="mt-1 font-display text-2xl font-medium text-ink">Manager Portal</h1>
        </div>

        <form onSubmit={submit} className="mt-7 rounded-card bg-white p-6 shadow-lift">
          <label className="text-xs font-semibold uppercase tracking-wide text-ink2">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            placeholder="manager@yourrestaurant.com"
            className="mt-2 w-full rounded-xl border border-purple/15 bg-cream px-4 py-3 text-sm text-ink placeholder:text-ink2/60 focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/20"
          />

          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink2">
            Password
          </label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            placeholder="••••••••"
            className="mt-2 w-full rounded-xl border border-purple/15 bg-cream px-4 py-3 text-sm text-ink placeholder:text-ink2/60 focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/20"
          />

          {error && (
            <p className="mt-3 rounded-lg bg-nonveg-tint px-3 py-2 text-sm text-nonveg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-purple py-3.5 text-sm font-semibold text-white shadow-soft transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
          <p className="mt-4 text-center text-xs text-ink2">
            Demo login: manager@paradise.alphay.demo / paradise123
          </p>
        </form>
      </motion.div>
    </main>
  );
}
