"use client";

import { useCart } from "@/lib/cart-context";
import Badge from "./Badge";
import VegDot from "./VegDot";
import QuantitySelector from "./QuantitySelector";
import { IconPlus, IconClock } from "./Icons";

export default function FoodCard({ item, layout = "grid" }) {
  const { addItem, setQuantity, quantityOf } = useCart();
  const quantity = quantityOf(item.id);
  const isWide = layout === "wide";

  const badgeList = [];
  if (item.isTodaysSpecial) badgeList.push("CHEF_SPECIAL");
  if (item.isPopular) badgeList.push("POPULAR");
  if (item.badges) {
    const split = Array.isArray(item.badges)
      ? item.badges
      : String(item.badges).split(",").map((b) => b.trim());
    split.forEach((b) => {
      if (b && !badgeList.includes(b)) badgeList.push(b);
    });
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all ${
        isWide ? "flex w-[280px] flex-shrink-0 flex-col" : "flex flex-col h-full"
      } ${!item.isAvailable ? "opacity-60" : ""}`}
    >
      {/* Image Header */}
      <div className={`relative ${isWide ? "h-36" : "aspect-[4/3] max-h-44"} w-full overflow-hidden bg-slate-100 dark:bg-zinc-800`}>
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-black text-slate-400 dark:text-zinc-600 bg-slate-100 dark:bg-zinc-800">
            ALPHAX DISH
          </div>
        )}

        <div className="absolute left-3 top-3 z-10">
          <VegDot isVeg={item.isVeg} />
        </div>

        {badgeList.length > 0 && (
          <div className="absolute right-3 top-3 z-10">
            <Badge code={badgeList[0]} />
          </div>
        )}

        {!item.isAvailable && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/70 text-xs font-black text-white backdrop-blur-xs">
            UNAVAILABLE
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {item.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-500 dark:text-zinc-400 leading-relaxed">
            {item.description || "Prepared fresh with quality ingredients."}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between gap-2">
          <div>
            <span className="font-mono text-base font-black text-slate-900 dark:text-white tabular-nums">
              ₹{item.price}
            </span>
            {item.prepTimeMinutes && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-zinc-500 mt-0.5">
                <IconClock className="h-3 w-3" />
                <span>{item.prepTimeMinutes}m</span>
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
              <button
                type="button"
                onClick={() => addItem(item, 1)}
                className="flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-xs transition-all cursor-pointer"
              >
                <IconPlus className="h-3.5 w-3.5" />
                <span>ADD</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
