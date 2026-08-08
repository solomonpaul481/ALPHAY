"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { IconCart, IconArrowRight } from "./Icons";

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
          className="fixed inset-x-4 bottom-4 z-40 mx-auto flex max-w-md items-center justify-between rounded-2xl bg-purple px-5 py-3.5 text-white shadow-lift active:scale-[0.98] transition-transform cursor-pointer"
        >
          <span className="flex items-center gap-2.5 text-sm font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white">
              <IconCart className="h-5 w-5" />
            </span>
            <span>{totalItems} {totalItems === 1 ? "Item" : "Items"}</span>
          </span>
          <span className="flex items-center gap-2 text-sm font-bold">
            <span className="font-mono tabular-nums">₹{subtotal.toFixed(0)}</span>
            <span className="flex items-center gap-1 opacity-90">
              View Cart <IconArrowRight className="h-4 w-4" />
            </span>
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
