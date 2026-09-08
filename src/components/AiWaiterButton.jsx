"use client";

import { motion } from "framer-motion";

export default function AiWaiterButton({ onClick, hasCartItems = false }) {
  return (
    <div
      className={`fixed ${
        hasCartItems ? "bottom-32 sm:bottom-34" : "bottom-24"
      } left-3 sm:left-6 z-40 flex items-center gap-2 pointer-events-auto transition-all duration-300`}
    >
      <motion.button
        type="button"
        onClick={onClick}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 350, damping: 22 }}
        className="group relative flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 shadow-xl shadow-amber-500/40 ring-2 ring-amber-300/80 active:ring-amber-400 cursor-pointer"
        aria-label="Open AI Waiter"
      >
        {/* Ambient pulse glow ring */}
        <span className="absolute -inset-1 rounded-2xl bg-amber-400/30 blur-sm animate-pulse group-hover:bg-amber-400/50 transition-all pointer-events-none" />

        {/* Floating AI Sparkle Badge */}
        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 border border-amber-400 text-[10px] text-amber-300 shadow-md">
          ✨
        </span>

        {/* Letter 'A' icon */}
        <span className="relative font-['Cinzel'] text-2xl font-black tracking-tight text-slate-950 drop-shadow-sm select-none">
          A
        </span>
      </motion.button>

      {/* Floating pill label */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        onClick={onClick}
        className="hidden xs:flex items-center gap-1.5 rounded-full bg-slate-900/90 border border-amber-500/40 px-3 py-1.5 text-xs font-black text-amber-300 shadow-lg backdrop-blur-md cursor-pointer hover:bg-slate-900 hover:border-amber-400 transition-all"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="font-['Cinzel'] tracking-wide">AI WAITER</span>
      </motion.div>
    </div>
  );
}
