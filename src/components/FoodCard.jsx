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

  // Normalize badges
  const badgeList = [];
  if (item.isTodaysSpecial) badgeList.push("CHEF_SPECIAL");
  if (item.isPopular) badgeList.push("POPULAR");
  if (item.badges) {
    const split = item.badges.split(",").map((b) => b.trim());
    split.forEach((b) => {
      if (b && !badgeList.includes(b)) badgeList.push(b);
    });
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`group relative overflow-hidden rounded-2xl bg-white shadow-soft hover:shadow-lift border border-purple-50/70 transition-all ${
        isWide ? "flex w-[290px] flex-shrink-0 flex-col" : "flex flex-col h-full"
      } ${!item.isAvailable ? "opacity-60" : ""}`}
    >
      {/* Image Container */}
      <div className={`relative ${isWide ? "h-40" : "aspect-[4/3] max-h-48"} w-full overflow-hidden bg-purple-50/60`}>
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-108"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl bg-gradient-to-br from-purple-50 to-purple-100/50">
            🍽️
          </div>
        )}

        <div className="absolute left-3 top-3 z-10">
          <VegDot isVeg={item.isVeg} />
        </div>

        {badgeList.length > 0 && (
          <div className="absolute right-3 top-3 z-10 flex flex-col gap-1 items-end">
            <Badge code={badgeList[0]} />
          </div>
        )}

        {!item.isAvailable && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/60 text-xs font-bold text-white backdrop-blur-[2px]">
            OUT OF STOCK
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="font-display text-base font-bold leading-snug text-ink group-hover:text-purple transition-colors">
            {item.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink2">
            {item.description || "Freshly prepared delicious item."}
          </p>
        </div>

        <div className="mt-4 pt-2 border-t border-purple-50/60 flex items-center justify-between gap-2">
          <div>
            <span className="font-mono text-base font-bold text-ink tabular-nums">
              ₹{item.price}
            </span>
            {item.prepTimeMinutes && (
              <span className="block text-[11px] font-medium text-ink2">
                ⏱ {item.prepTimeMinutes} min
              </span>
            )}
          </div>

          {item.isAvailable &&
            (quantity > 0 ? (
              <QuantitySelector
                quantity={quantity}
                onIncrease={() => setQuantity(item.id, quantity + 1)}
                onDecrease={() => setQuantity(item.id, quantity - 1)}
                size="sm"
              />
            ) : (
              <motion.button
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={() => addItem(item, 1)}
                className="rounded-full bg-purple px-4 py-1.5 text-xs font-bold text-white shadow-soft hover:bg-purple-deep transition-all"
              >
                + Add
              </motion.button>
            ))}
        </div>
      </div>
    </motion.div>
  );
}
