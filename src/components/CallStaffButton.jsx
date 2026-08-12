"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createApiClient } from "@/lib/api-client";

const OPTIONS = [
  { type: "WAITER", label: "Call Waiter", emoji: "🙋" },
  { type: "WATER", label: "Request Water", emoji: "💧" },
  { type: "HELP", label: "SOS Help", emoji: "🆘" },
];

export default function CallStaffButton({ restaurantId }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(null);
  const api = createApiClient(restaurantId);

  const send = async (type) => {
    setOpen(false);
    try {
      await api.callStaff(type);
      setSent(type);
      setTimeout(() => setSent(null), 3000);
    } catch (err) {
      // Silently ignored — the button remains available to retry.
    }
  };

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {sent && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl bg-ink px-3.5 py-2 text-xs font-medium text-white shadow-lift"
          >
            {OPTIONS.find((o) => o.type === sent)?.label} sent — staff notified.
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-lift"
          >
            {OPTIONS.map((o) => (
              <button
                key={o.type}
                type="button"
                onClick={() => send(o.type)}
                className="flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-ink transition-colors hover:bg-purple-50"
              >
                <span aria-hidden>{o.emoji}</span>
                {o.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white shadow-lift"
        aria-label="Need assistance?"
      >
        {open ? "✕" : "🔔"}
      </motion.button>
    </div>
  );
}
