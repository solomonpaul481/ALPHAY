"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";

export default function FloatingCart({ restaurantId }) {
  const { totalItems, subtotal } = useCart();
  const router = useRouter();

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.button
          type="button"
          onClick={() => router.push(`/r/${restaurantId}/cart`)}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center justify-between rounded-2xl bg-purple px-5 py-3.5 text-white shadow-lift active:scale-[0.98] transition-transform"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-base">
              🛒
            </span>
            {totalItems} {totalItems === 1 ? "item" : "items"}
          </span>
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span className="font-mono tabular-nums">₹{subtotal.toFixed(0)}</span>
            <span className="opacity-90">View Cart →</span>
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
