"use client";

import { useCart } from "@/lib/cart-context";
import Badge from "./Badge";
import VegDot from "./VegDot";
import QuantitySelector from "./QuantitySelector";
import { IconPlus, IconMinus, IconClock } from "./Icons";

export default function FoodCard({ item, layout = "grid" }) {
  const { addItem, setQuantity, quantityOf } = useCart();
  const quantity = quantityOf(item.id);
  const isWide = layout === "wide";

  const badgeList = [];
  if (item.isTodaysSpecial) badgeList.push("CHEF_SPECIAL");
  if (item.isPopular) badgeList.push("POPULAR");

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 ${
        isWide ? "w-[220px] flex-shrink-0" : "w-full"
      } ${!item.isAvailable ? "opacity-60" : ""}`}
    >
      {/* Photo Container with Bottom Right Swiggy ADD Button */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] font-black text-slate-400 bg-slate-100">
            ALPHAX DISH
          </div>
        )}

        {/* Top Left Veg/Non-Veg Badge */}
        <div className="absolute left-2 top-2 z-10">
          <VegDot isVeg={item.isVeg} />
        </div>

        {/* Top Right Chef/Popular Badge */}
        {badgeList.length > 0 && (
          <div className="absolute right-2 top-2 z-10 scale-90 origin-top-right">
            <Badge code={badgeList[0]} />
          </div>
        )}

        {!item.isAvailable && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/70 text-[11px] font-black text-white backdrop-blur-xs">
            OUT OF STOCK
          </div>
        )}
      </div>

      {/* Item Details Body */}
      <div className="flex flex-1 flex-col justify-between p-3">
        <div>
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {item.name}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-slate-500">
            {item.description || "Fresh chef's special dish."}
          </p>
        </div>

        {/* Price & Swiggy-Style ADD Button at Bottom Right */}
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
          <div>
            <span className="font-mono text-sm sm:text-base font-black text-slate-900 tabular-nums">
              ₹{item.price}
            </span>
            {item.prepTimeMinutes && (
              <span className="block text-[10px] font-bold text-slate-400">
                ~{item.prepTimeMinutes}m
              </span>
            )}
          </div>

          {/* Interactive Bottom Right ADD / Quantity Button */}
          {item.isAvailable && (
            <div>
              {quantity > 0 ? (
                <div className="flex items-center rounded-xl bg-indigo-600 text-white font-mono text-xs font-black shadow-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity(item.id, quantity - 1)}
                    className="px-2 py-1.5 hover:bg-indigo-700 active:bg-indigo-800 transition-colors cursor-pointer"
                  >
                    <IconMinus className="h-3 w-3" />
                  </button>
                  <span className="px-1.5 text-xs">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(item.id, quantity + 1)}
                    className="px-2 py-1.5 hover:bg-indigo-700 active:bg-indigo-800 transition-colors cursor-pointer"
                  >
                    <IconPlus className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => addItem(item, 1)}
                  className="flex items-center gap-1 rounded-xl border-2 border-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white px-3 py-1.5 text-xs font-black text-emerald-700 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <span>ADD</span>
                  <IconPlus className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
