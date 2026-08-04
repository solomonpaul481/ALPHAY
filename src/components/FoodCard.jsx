"use client";

import { motion } from "framer-motion";
import { useCart } from "@/lib/cart-context";
import Badge from "./Badge";
import VegDot from "./VegDot";
import QuantitySelector from "./QuantitySelector";

export default function FoodCard({ item, layout = "grid" }) {
  const { addItem, setQuantity, quantityOf } = useCart();
  const quantity = quantityOf(item.id);
  const isWide = layout === "wide";

  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`group relative overflow-hidden rounded-card bg-white shadow-soft border border-purple-50/50 ${
        isWide ? "flex w-[280px] flex-shrink-0 flex-col" : "flex flex-col"
      } ${!item.isAvailable ? "opacity-60" : ""}`}
    >
      <div className={`relative ${isWide ? "h-36" : "aspect-[4/3] max-h-48"} w-full overflow-hidden bg-purple-50/70 flex items-center justify-center`}>
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl bg-purple-50/50">🍽️</div>
        )}
        <div className="absolute left-2.5 top-2.5 z-10">
          <VegDot isVeg={item.isVeg} />
        </div>
        {item.badges?.[0] && (
          <div className="absolute right-2.5 top-2.5 z-10">
            <Badge code={item.badges[0]} />
          </div>
        )}
        {!item.isAvailable && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/50 text-sm font-semibold text-white backdrop-blur-[1px]">
            Currently unavailable
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <h3 className="font-display text-base font-medium leading-snug text-ink">{item.name}</h3>
        <p className="line-clamp-2 text-[13px] leading-snug text-ink2">{item.description}</p>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-ink2">
          <span aria-hidden>⏱</span>
          <span>{item.prepTimeMinutes} mins</span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-mono text-[15px] font-semibold text-ink tabular-nums">
            ₹{item.price}
          </span>

          {item.isAvailable &&
            (quantity > 0 ? (
              <QuantitySelector
                quantity={quantity}
                onIncrease={() => setQuantity(item.id, quantity + 1)}
                onDecrease={() => setQuantity(item.id, quantity - 1)}
                size="sm"
              />
            ) : (
              <button
                type="button"
                onClick={() => addItem(item, 1)}
                className="rounded-full bg-purple px-4 py-1.5 text-sm font-semibold text-white shadow-soft transition-transform active:scale-95"
              >
                Add
              </button>
            ))}
        </div>
      </div>
    </motion.div>
  );
}
