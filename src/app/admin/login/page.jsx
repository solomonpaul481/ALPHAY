"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { IconBuilding } from "@/components/Icons";

const ERROR_MESSAGES = {
  invalid_state: "Your sign-in session expired. Please try again.",
  not_allowed: "That Google account isn't authorized for the ALPHAX admin portal.",
  oauth_failed: "Google sign-in failed. Please try again.",
};

function AdminLoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="mt-8 rounded-3xl bg-white dark:bg-slate-900 p-7 shadow-2xl border border-purple-100 dark:border-slate-800">
      {error && (
        <p className="mb-4 rounded-xl bg-nonveg-tint p-3 text-xs font-bold text-nonveg">
          {ERROR_MESSAGES[error] || "Something went wrong. Please try again."}
        </p>
      )}
      <a
        href="/api/admin/auth/google"
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-purple-100 dark:border-slate-700 bg-white dark:bg-slate-800 py-4 text-xs font-bold text-ink shadow-soft transition-all hover:bg-purple-50 dark:hover:bg-slate-700 cursor-pointer"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18z"
          />
          <path
            fill="#FBBC05"
            d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03l3.05-2.33z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.97l3.05 2.33C4.66 5.17 6.65 3.58 9 3.58z"
          />
        </svg>
        Sign in with Google Account
      </a>
      <p className="mt-4 text-[11px] text-ink2">
        Requires <code className="rounded bg-purple-50 dark:bg-slate-800 px-1 py-0.5">GOOGLE_CLIENT_ID</code> configured in environment.
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-950 via-slate-900 to-black px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple text-3xl text-white shadow-xl">
          <IconBuilding className="h-8 w-8 text-white" />
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-purple-tint">
          ALPHAX
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-white">Platform Admin</h1>
        <p className="mt-2 text-xs font-semibold text-white/60">
          Sign in with authorized Google credentials to manage platform venues.
        </p>

        <Suspense fallback={<div className="mt-8 rounded-3xl bg-white p-6 text-xs text-ink2">Loading...</div>}>
          <AdminLoginContent />
        </Suspense>
      </motion.div>
    </main>
  );
}
