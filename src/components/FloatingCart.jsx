"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { IconCart, IconArrowRight, IconSparkles } from "./Icons";

export default function FloatingCart({ restaurantId }) {
  const { totalItems, subtotal } = useCart();
  const router = useRouter();

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.button
          type="button"
          onClick={() => router.push(`/r/${restaurantId}/cart`)}
          initial={{ y: 90, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 90, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed inset-x-3 sm:inset-x-4 bottom-4 z-40 mx-auto flex max-w-lg items-center justify-between rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-3.5 sm:p-4 text-white shadow-2xl shadow-indigo-600/30 ring-1 ring-white/30 active:scale-[0.98] transition-all cursor-pointer"
        >
          {/* Left Side: Cart Icon & Item Count */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-md">
              <IconCart className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-black text-white shadow-sm animate-pulse">
                {totalItems}
              </span>
            </div>
            <div className="text-left">
              <p className="text-xs font-black uppercase tracking-wider text-indigo-100 flex items-center gap-1">
                <IconSparkles className="h-3 w-3 text-amber-300" />
                {totalItems} {totalItems === 1 ? "ITEM ADDED" : "ITEMS ADDED"}
              </p>
              <p className="font-mono text-base font-black text-white tabular-nums leading-tight">
                ₹{subtotal.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Right Side: View Cart Button */}
          <div className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-xs font-extrabold text-white backdrop-blur-md hover:bg-white/25 transition-colors">
            <span>VIEW CART</span>
            <IconArrowRight className="h-4 w-4" />
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
