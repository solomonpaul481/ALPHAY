"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

const ERROR_MESSAGES = {
  invalid_state: "Your sign-in session expired. Please try again.",
  not_allowed: "That Google account isn't authorized for the ALPHAY admin portal.",
  oauth_failed: "Google sign-in failed. Please try again.",
};

function AdminLoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="mt-8 rounded-card bg-white p-6 shadow-lift">
      {error && (
        <p className="mb-4 rounded-lg bg-nonveg-tint px-3 py-2 text-sm text-nonveg">
          {ERROR_MESSAGES[error] || "Something went wrong. Please try again."}
        </p>
      )}
      <a
        href="/api/admin/auth/google"
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-ink/10 bg-white py-3.5 text-sm font-semibold text-ink shadow-soft transition-transform active:scale-[0.98]"
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
        Sign in with Google
      </a>
      <p className="mt-4 text-xs text-ink2">
        Needs <code className="rounded bg-cream px-1 py-0.5">GOOGLE_CLIENT_ID</code> /{" "}
        <code className="rounded bg-cream px-1 py-0.5">GOOGLE_CLIENT_SECRET</code> configured — see README.
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-deep to-ink px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-lift">
          🅰️
        </div>
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-purple-tint">
          ALPHAY
        </p>
        <h1 className="mt-1 font-display text-3xl font-medium text-white">Admin Portal</h1>
        <p className="mt-2 text-sm text-white/60">
          Sign in with the Google account authorized to manage ALPHAY restaurants.
        </p>

        <Suspense fallback={<div className="mt-8 rounded-card bg-white p-6 text-sm text-ink2">Loading…</div>}>
          <AdminLoginContent />
        </Suspense>
      </motion.div>
    </main>
  );
}
