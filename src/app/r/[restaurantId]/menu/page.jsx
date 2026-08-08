"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createApiClient } from "@/lib/api-client";
import FoodCard from "@/components/FoodCard";
import FloatingCart from "@/components/FloatingCart";
import SearchBar from "@/components/SearchBar";
import CallStaffButton from "@/components/CallStaffButton";
import { useCart } from "@/lib/cart-context";
import { IconUtensils, IconCart, IconSparkles } from "@/components/Icons";

export default function MenuPage() {
  const { restaurantId } = useParams();
  const router = useRouter();
  const api = createApiClient(restaurantId);
  const { totalItems } = useCart();

  const [menu, setMenu] = useState(null);
  const [loadError, setLoadError] = useState(false);

  // Toggle state: true = 🟢 VEG ONLY | false = 🔴 NON-VEG ONLY
  const [isVegOnly, setIsVegOnly] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    if (!restaurantId) return;
    api
      .getMenu()
      .then((data) => {
        setMenu(data);
      })
      .catch((err) => {
        if (err.status === 401) {
          router.replace(`/r/${restaurantId}`);
        } else {
          setLoadError(true);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const vegGroups = menu?.veg || {};
  const nonVegGroups = menu?.nonVeg || {};

  const allVegItems = useMemo(() => Object.values(vegGroups).flat(), [vegGroups]);
  const allNonVegItems = useMemo(() => Object.values(nonVegGroups).flat(), [nonVegGroups]);
  const allItems = useMemo(() => [...allVegItems, ...allNonVegItems], [allVegItems, allNonVegItems]);

  const activeGroups = isVegOnly ? vegGroups : nonVegGroups;

  const categories = useMemo(() => {
    const set = new Set(["All"]);
    Object.keys(activeGroups).forEach((c) => set.add(c));
    return Array.from(set);
  }, [activeGroups]);

  const todaysSpecials = useMemo(() => {
    const list = [...(menu?.todaysSpecial || []), ...(menu?.recommended || [])];
    const uniqueMap = new Map();
    list.forEach((item) => uniqueMap.set(item.id, item));
    let result = Array.from(uniqueMap.values());
    if (isVegOnly) result = result.filter((i) => i.isVeg);
    else result = result.filter((i) => !i.isVeg);
    return result;
  }, [menu, isVegOnly]);

  if (loadError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center bg-slate-50 text-slate-900">
        <IconUtensils className="h-12 w-12 text-indigo-600 mb-3" />
        <h2 className="text-xl font-extrabold text-slate-900">Unable to load menu</h2>
        <p className="mt-1 text-xs text-slate-500">
          Session expired or table not found. Please re-enter your table number.
        </p>
        <button
          type="button"
          onClick={() => router.push(`/r/${restaurantId}`)}
          className="mt-6 rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-700"
        >
          Re-enter Table Number
        </button>
      </main>
    );
  }

  if (!menu) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 pt-6 text-slate-900">
        <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
          <div className="h-14 w-full rounded-2xl bg-slate-200" />
          <div className="h-12 w-full rounded-2xl bg-slate-200" />
          <div className="h-44 w-full rounded-2xl bg-slate-200" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-36 text-slate-900 transition-colors">
      {/* Light Customer Sticky Header with Prominent Table Badge & Top Right Veg Toggle */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-xs backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
              {menu.restaurantLogo ? (
                <img src={menu.restaurantLogo} alt={menu.restaurantName} className="h-6 w-6 object-contain" />
              ) : (
                <IconUtensils className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold leading-tight text-slate-900">
                {menu.restaurantName}
              </h1>
              {/* TABLE NUMBER BADGE */}
              <div className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
                <span>TABLE #{menu.tableNumber || "12"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* TOP RIGHT VEG / NON-VEG SWITCH TOGGLE */}
            <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 p-1 border border-slate-200">
              <span className={`text-[10px] font-black px-1 ${isVegOnly ? "text-emerald-700" : "text-rose-700"}`}>
                {isVegOnly ? "🟢 VEG" : "🔴 NON-VEG"}
              </span>
              <button
                type="button"
                onClick={() => setIsVegOnly(!isVegOnly)}
                aria-label="Toggle Veg / Non-Veg mode"
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  isVegOnly ? "bg-emerald-600" : "bg-rose-600"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isVegOnly ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* CART ICON BUTTON */}
            <button
              type="button"
              onClick={() => router.push(`/r/${restaurantId}/cart`)}
              className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200 transition-all cursor-pointer"
              aria-label="View Cart"
            >
              <IconCart className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white shadow-md">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-3 sm:px-4 pt-3">
        <SearchBar allItems={allItems} restaurantId={restaurantId} />

        {/* Category Pill Filters */}
        <div className="scrollbar-none -mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-md"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-400"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* TODAY'S SPECIAL CAROUSEL */}
        {todaysSpecials.length > 0 && selectedCategory === "All" && (
          <section className="mt-5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <IconSparkles className="h-4 w-4 text-amber-500" />
                <h2 className="text-base font-extrabold text-slate-900">Chef's Specials</h2>
              </div>
              <span className="text-[11px] font-bold text-indigo-600">Today's Special</span>
            </div>
            <div className="scrollbar-none -mx-3 flex gap-3 overflow-x-auto px-3 pb-2">
              {todaysSpecials.map((item) => (
                <FoodCard key={item.id} item={item} layout="wide" />
              ))}
            </div>
          </section>
        )}

        {/* MENU ITEMS GRID: EXACTLY 2 ITEMS IN A ROW */}
        <div className="mt-5 space-y-6">
          <section
            className={`rounded-3xl p-3.5 sm:p-4 border ${
              isVegOnly
                ? "bg-emerald-50/40 border-emerald-200/80"
                : "bg-rose-50/40 border-rose-200/80"
            }`}
          >
            <div className="flex items-center gap-2 border-b pb-2.5 border-slate-200">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black text-white ${
                  isVegOnly ? "bg-emerald-600" : "bg-rose-600"
                }`}
              >
                {isVegOnly ? "🟢" : "🔴"}
              </span>
              <h2
                className={`text-base font-extrabold ${
                  isVegOnly ? "text-emerald-900" : "text-rose-900"
                }`}
              >
                {isVegOnly ? "VEGETARIAN DISHES" : "NON-VEGETARIAN DISHES"}
              </h2>
            </div>

            {Object.keys(activeGroups).length === 0 ? (
              <p className="mt-4 text-xs font-medium text-slate-500">
                No items found in this section.
              </p>
            ) : (
              Object.keys(activeGroups).map((catName) => {
                if (selectedCategory !== "All" && selectedCategory !== catName) return null;
                const items = activeGroups[catName];
                if (!items || items.length === 0) return null;

                return (
                  <div key={catName} className="mt-4">
                    <h3
                      className={`mb-2.5 text-[11px] font-black uppercase tracking-wider ${
                        isVegOnly ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {catName}
                    </h3>
                    {/* TWO ITEMS IN A ROW GRID */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {items.map((item) => (
                        <FoodCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </div>
      </div>

      <FloatingCart restaurantId={restaurantId} />
      <CallStaffButton restaurantId={restaurantId} />
    </main>
  );
}
