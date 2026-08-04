"use client";

import { motion } from "framer-motion";

export default function VegToggle({ vegMode, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={vegMode}
      aria-label={vegMode ? "Showing veg menu — switch to non-veg" : "Showing non-veg menu — switch to veg"}
      onClick={() => onChange(!vegMode)}
      className={`relative flex h-9 w-[74px] flex-shrink-0 items-center rounded-full px-1 transition-colors duration-300 ${
        vegMode ? "bg-veg" : "bg-nonveg"
      }`}
    >
      <span className="absolute left-2.5 text-[9px] font-bold tracking-wide text-white">
        {vegMode ? "VEG" : ""}
      </span>
      <span className="absolute right-2 text-[9px] font-bold tracking-wide text-white">
        {vegMode ? "" : "N-VEG"}
      </span>
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white text-sm shadow-soft"
        style={{ marginLeft: vegMode ? 40 : 0 }}
      >
        {vegMode ? "🟢" : "🔴"}
      </motion.span>
    </button>
  );
}
