"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { IconCart, IconArrowRight, IconSparkles } from "./Icons";

export default function FloatingCart({ restaurantId }) {
  const { totalItems, subtotal } = useCart();
  const router = useRouter();

  return (
    <div className="fixed inset-x-3 sm:inset-x-4 bottom-3 z-40 mx-auto max-w-lg flex flex-col gap-2 pointer-events-none">
      {/* 1. Floating Cart Bar (Appears when items added to cart) */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.button
            type="button"
            onClick={() => router.push(`/r/${restaurantId}/cart`)}
            initial={{ y: 30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="pointer-events-auto w-full flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 p-3.5 text-slate-950 shadow-2xl shadow-amber-500/30 border border-amber-300/60 ring-2 ring-amber-500/30 active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950/20 text-slate-950 backdrop-blur-md">
                <IconCart className="h-5 w-5 text-slate-950" />
                <span className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-slate-950 text-[10px] font-black text-amber-400 border border-amber-400 shadow-sm animate-pulse">
                  {totalItems}
                </span>
              </div>
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-wider text-slate-950/90 flex items-center gap-1 font-['Cinzel']">
                  <IconSparkles className="h-3 w-3 text-slate-950" />
                  {totalItems} {totalItems === 1 ? "ITEM IN CART" : "ITEMS IN CART"}
                </p>
                <p className="font-mono text-sm font-black text-slate-950 tabular-nums leading-tight">
                  ₹{subtotal.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl bg-slate-950/15 px-3 py-1.5 text-xs font-black text-slate-950 backdrop-blur-md font-['Cinzel'] tracking-wider">
              <span>VIEW CART</span>
              <IconArrowRight className="h-4 w-4 text-slate-950" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* 2. Floating Order Details / My Session Button at Bottom of Screen */}
      <motion.button
        type="button"
        onClick={() => router.push(`/r/${restaurantId}/track`)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="pointer-events-auto w-full flex items-center justify-between rounded-2xl bg-slate-900/95 border border-amber-500/40 px-4 py-2.5 text-amber-300 shadow-xl backdrop-blur-md hover:bg-slate-900 active:scale-[0.98] transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs">
            📋
          </div>
          <span className="text-xs font-extrabold font-['Cinzel'] tracking-wider text-amber-200">
            Track Order & Table Bill
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
          <span>Track Now</span>
          <IconArrowRight className="h-3.5 w-3.5 text-amber-400" />
        </div>
      </motion.button>
    </div>
  );
}
