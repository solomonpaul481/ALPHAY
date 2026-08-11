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
    <main className="min-h-screen w-full bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6 lg:p-12 relative overflow-hidden">
      {/* Background Gold Ambient Glows */}
      <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-5xl rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-2xl overflow-hidden grid lg:grid-cols-12 backdrop-blur-md"
      >
        {/* Desktop Showcase Hero Side (Aspect Ratio Widescreen Point of View) */}
        <div className="lg:col-span-7 bg-gradient-to-br from-slate-950 via-slate-900 to-black p-8 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-amber-500/20 relative">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 p-1 border border-amber-500/40 shadow-lg">
              <img src="/logo-gold.png" alt="ALPHAY" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <p className="font-['Cinzel'] text-xs font-black uppercase tracking-[0.25em] text-amber-400">
                ALPHAX PLATFORM
              </p>
              <h2 className="text-xl font-extrabold font-['Cinzel'] text-white tracking-wider">
                Manager Portal
              </h2>
            </div>
          </div>

          <div className="my-8 lg:my-12">
            <span className="inline-block rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-amber-400 border border-amber-500/20 mb-3 font-['Cinzel']">
              ⚡ Desktop Operations Suite
            </span>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 font-['Cinzel'] leading-tight tracking-wide">
              Complete Venue Control & Real-time Dining Management
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Sign in with your venue credentials assigned during onboarding to manage orders, live table billing, QR menus, analytics, and staff.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="rounded-2xl bg-slate-950/80 p-3.5 border border-amber-500/20 text-amber-300">
                <span className="block text-[10px] text-slate-400 font-sans uppercase">Orders & Tables</span>
                <span className="font-bold font-['Cinzel']">Live Sync</span>
              </div>
              <div className="rounded-2xl bg-slate-950/80 p-3.5 border border-amber-500/20 text-amber-300">
                <span className="block text-[10px] text-slate-400 font-sans uppercase">Revenue & Analytics</span>
                <span className="font-bold font-['Cinzel']">Real-time</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] font-bold text-slate-500 font-mono flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span>ALPHAY Venue Management • Secure Manager Authentication</span>
          </div>
        </div>

        {/* Credentials Form Side */}
        <div className="lg:col-span-5 p-8 lg:p-10 flex flex-col justify-center bg-slate-900">
          <div className="mb-6">
            <h3 className="text-xl font-extrabold text-white font-['Cinzel'] tracking-wide">
              Sign In to Your Account
            </h3>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              Enter email & password configured by Administrator
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-amber-300 font-['Cinzel']">
                Manager Email Address
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="manager@yourrestaurant.com"
                className="mt-1.5 w-full rounded-2xl border border-amber-500/30 bg-slate-950 px-4 py-3.5 text-xs font-bold text-white placeholder:text-slate-600 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-inner"
              />
            </div>

            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-amber-300 font-['Cinzel']">
                Password
              </label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-2xl border border-amber-500/30 bg-slate-950 px-4 py-3.5 text-xs font-bold text-white placeholder:text-slate-600 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 shadow-inner"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-rose-950/80 border border-rose-500/40 p-3 text-xs font-bold text-rose-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-4 text-xs font-black text-slate-950 shadow-lg font-['Cinzel'] tracking-wider transition-all transform active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {loading ? "AUTHENTICATING..." : "SIGN IN TO MANAGER PORTAL"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] font-bold text-slate-400">
              Demo Credentials: <code className="text-amber-400 font-mono">manager@paradise.alphay.demo</code> / <code className="text-amber-400 font-mono">paradise123</code>
            </p>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
