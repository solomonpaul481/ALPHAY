"use client";

import { useCart } from "@/lib/cart-context";
import Badge from "./Badge";
import VegDot from "./VegDot";
import { IconPlus, IconMinus } from "./Icons";

export default function FoodCard({ item, layout = "grid", viewMode = "cart" }) {
  const { addItem, setQuantity, quantityOf } = useCart();
  const quantity = quantityOf(item.id);
  const isWide = layout === "wide";
  const isList = viewMode === "list";

  const badgeList = [];
  if (item.isTodaysSpecial) badgeList.push("CHEF_SPECIAL");
  if (item.isPopular) badgeList.push("POPULAR");

  if (isList) {
    return (
      <div
        className={`group relative flex items-center justify-between overflow-hidden rounded-2xl bg-slate-900 border-b-2 border-r border-amber-500/30 p-3 sm:p-3.5 shadow-md hover:border-amber-400 transition-all ${
          !item.isAvailable ? "opacity-60" : ""
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="flex-shrink-0">
            <VegDot isVeg={item.isVeg} />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-extrabold text-white font-['Cinzel'] tracking-wide truncate leading-tight">
              {item.name}
            </h3>
            <span className="font-mono text-xs sm:text-sm font-black text-amber-400 tabular-nums">
              ₹{item.price}
            </span>
          </div>
        </div>

        {/* Add option */}
        {item.isAvailable ? (
          <div className="flex-shrink-0">
            {quantity > 0 ? (
              <div className="flex items-center rounded-xl bg-amber-500 text-slate-950 font-mono text-xs font-black shadow-xs border-b-2 border-amber-700 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity(item.id, quantity - 1)}
                  className="px-2 py-1 hover:bg-amber-400 transition-colors cursor-pointer"
                >
                  <IconMinus className="h-3 w-3 text-slate-950" />
                </button>
                <span className="px-1.5 text-xs text-slate-950 font-extrabold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(item.id, quantity + 1)}
                  className="px-2 py-1 hover:bg-amber-400 transition-colors cursor-pointer"
                >
                  <IconPlus className="h-3 w-3 text-slate-950" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => addItem(item, 1)}
                className="flex items-center gap-1 rounded-xl border border-amber-500 bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 px-3 py-1.5 text-xs font-black text-amber-300 shadow-xs transition-all cursor-pointer font-['Cinzel']"
              >
                <span>ADD</span>
                <IconPlus className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <span className="text-[10px] font-bold text-slate-500 font-['Cinzel'] flex-shrink-0">OUT OF STOCK</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-slate-900 border-b-4 border-r-2 border-amber-500/30 shadow-xl hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:border-amber-400 hover:-translate-y-1 transition-all duration-300 ${
        isWide ? "w-[220px] flex-shrink-0" : "w-full"
      } ${!item.isAvailable ? "opacity-60" : ""}`}
    >
      {/* 3D Glass Accent Gold Glow */}
      <div className="absolute -top-8 -right-8 h-20 w-20 rounded-full bg-amber-500/15 blur-lg pointer-events-none group-hover:scale-125 transition-transform" />

      {/* Photo Container with Bottom Right ADD Button */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-108"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] font-black text-amber-400/80 bg-slate-950 font-['Cinzel'] tracking-widest">
            ALPHAY DISH
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
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 text-[11px] font-black text-white backdrop-blur-xs font-['Cinzel']">
            OUT OF STOCK
          </div>
        )}
      </div>

      {/* Item Details Body */}
      <div className="flex flex-1 flex-col justify-between p-3.5">
        <div>
          <h3 className="text-xs sm:text-sm font-extrabold text-white leading-snug line-clamp-1 group-hover:text-amber-400 transition-colors font-['Cinzel'] tracking-wide">
            {item.name}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-slate-400">
            {item.description || "Fresh chef's special dish."}
          </p>
        </div>

        {/* Price & Gold ADD Button at Bottom Right */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-1">
          <div>
            <span className="font-mono text-sm sm:text-base font-black text-amber-400 tabular-nums">
              ₹{item.price}
            </span>
            {item.prepTimeMinutes && (
              <span className="block text-[10px] font-bold text-slate-500">
                ~{item.prepTimeMinutes}m
              </span>
            )}
          </div>

          {/* Interactive Bottom Right Gold ADD / Quantity Button */}
          {item.isAvailable && (
            <div>
              {quantity > 0 ? (
                <div className="flex items-center rounded-2xl bg-amber-500 text-slate-950 font-mono text-xs font-black shadow-md border-b-2 border-amber-700 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity(item.id, quantity - 1)}
                    className="px-2 py-1.5 hover:bg-amber-400 transition-colors cursor-pointer"
                  >
                    <IconMinus className="h-3 w-3 text-slate-950" />
                  </button>
                  <span className="px-1.5 text-xs text-slate-950 font-extrabold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(item.id, quantity + 1)}
                    className="px-2 py-1.5 hover:bg-amber-400 transition-colors cursor-pointer"
                  >
                    <IconPlus className="h-3 w-3 text-slate-950" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => addItem(item, 1)}
                  className="flex items-center gap-1 rounded-2xl border-2 border-amber-500 bg-amber-500/15 hover:bg-amber-500 hover:text-slate-950 px-3 py-1.5 text-xs font-black text-amber-300 shadow-sm border-b-4 border-b-amber-600 transition-all active:translate-y-0.5 cursor-pointer font-['Cinzel']"
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
