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
  const [activeTab, setActiveTab] = useState("ALL"); // ALL | VEG | NON_VEG
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

  const categories = useMemo(() => {
    const set = new Set(["All"]);
    Object.keys(vegGroups).forEach((c) => set.add(c));
    Object.keys(nonVegGroups).forEach((c) => set.add(c));
    return Array.from(set);
  }, [vegGroups, nonVegGroups]);

  const todaysSpecials = useMemo(() => {
    const list = [...(menu?.todaysSpecial || []), ...(menu?.recommended || [])];
    const uniqueMap = new Map();
    list.forEach((item) => uniqueMap.set(item.id, item));
    let result = Array.from(uniqueMap.values());
    if (activeTab === "VEG") result = result.filter((i) => i.isVeg);
    if (activeTab === "NON_VEG") result = result.filter((i) => !i.isVeg);
    return result;
  }, [menu, activeTab]);

  if (loadError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center bg-slate-50 dark:bg-zinc-950">
        <IconUtensils className="h-12 w-12 text-indigo-600 mb-3" />
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Unable to load menu</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
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
      <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 px-4 pt-6">
        <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
          <div className="h-14 w-full rounded-2xl bg-slate-200 dark:bg-zinc-800" />
          <div className="h-12 w-full rounded-2xl bg-slate-200 dark:bg-zinc-800" />
          <div className="h-44 w-full rounded-2xl bg-slate-200 dark:bg-zinc-800" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-36 text-slate-900 dark:text-white transition-colors">
      {/* High-Contrast Header with Prominent Table Badge */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-4 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md">
              {menu.restaurantLogo ? (
                <img src={menu.restaurantLogo} alt={menu.restaurantName} className="h-6 w-6 object-contain" />
              ) : (
                <IconUtensils className="h-5 w-5 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-base font-extrabold leading-tight text-slate-900 dark:text-white">
                {menu.restaurantName}
              </h1>
              {/* PROMINENT HIGH CONTRAST TABLE NUMBER BADGE */}
              <div className="mt-0.5 inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-2.5 py-0.5 text-[11px] font-black text-white shadow-xs">
                <span>TABLE #{menu.tableNumber || "12"}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/r/${restaurantId}/cart`)}
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
            aria-label="View Cart"
          >
            <IconCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-black text-white shadow-md">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-4">
        <SearchBar allItems={allItems} restaurantId={restaurantId} />

        {/* High-Contrast Interactive Veg / Non-Veg Tabs */}
        <div className="mt-4 flex rounded-2xl bg-white dark:bg-zinc-900 p-1.5 shadow-sm border border-slate-200 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "ALL"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            ALL DISHES
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("VEG")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "VEG"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            }`}
          >
            🟢 100% VEG
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("NON_VEG")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "NON_VEG"
                ? "bg-rose-600 text-white shadow-md"
                : "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            }`}
          >
            🔴 NON-VEG
          </button>
        </div>

        {/* Category Pill Filters */}
        <div className="scrollbar-none -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                    : "bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 hover:border-slate-400"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* TODAY'S SPECIAL HORIZONTAL SECTION */}
        {todaysSpecials.length > 0 && selectedCategory === "All" && (
          <section className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <IconSparkles className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Today's Special</h2>
              </div>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Chef's Special</span>
            </div>
            <div className="scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 pb-3">
              {todaysSpecials.map((item) => (
                <FoodCard key={item.id} item={item} layout="wide" />
              ))}
            </div>
          </section>
        )}

        {/* MENU SECTIONS */}
        <div className="mt-6 space-y-8">
          {/* 🟢 VEG SECTION */}
          {(activeTab === "ALL" || activeTab === "VEG") && (
            <section className="rounded-3xl bg-emerald-50/40 dark:bg-emerald-950/20 p-5 border border-emerald-200 dark:border-emerald-900/50">
              <div className="flex items-center gap-2.5 border-b border-emerald-200 dark:border-emerald-900/50 pb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white">
                  🟢
                </span>
                <h2 className="text-lg font-extrabold text-emerald-800 dark:text-emerald-300">
                  VEGETARIAN DISHES
                </h2>
              </div>

              {Object.keys(vegGroups).length === 0 ? (
                <p className="mt-4 text-xs font-medium text-slate-500 dark:text-zinc-400">
                  No vegetarian items found.
                </p>
              ) : (
                Object.keys(vegGroups).map((catName) => {
                  if (selectedCategory !== "All" && selectedCategory !== catName) return null;
                  const items = vegGroups[catName];
                  if (!items || items.length === 0) return null;

                  return (
                    <div key={catName} className="mt-5">
                      <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        {catName}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {items.map((item) => (
                          <FoodCard key={item.id} item={item} />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          )}

          {/* 🔴 NON-VEG SECTION */}
          {(activeTab === "ALL" || activeTab === "NON_VEG") && (
            <section className="rounded-3xl bg-rose-50/40 dark:bg-rose-950/20 p-5 border border-rose-200 dark:border-rose-900/50">
              <div className="flex items-center gap-2.5 border-b border-rose-200 dark:border-rose-900/50 pb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-xs font-black text-white">
                  🔴
                </span>
                <h2 className="text-lg font-extrabold text-rose-800 dark:text-rose-300">
                  NON-VEGETARIAN DISHES
                </h2>
              </div>

              {Object.keys(nonVegGroups).length === 0 ? (
                <p className="mt-4 text-xs font-medium text-slate-500 dark:text-zinc-400">
                  No non-vegetarian items found.
                </p>
              ) : (
                Object.keys(nonVegGroups).map((catName) => {
                  if (selectedCategory !== "All" && selectedCategory !== catName) return null;
                  const items = nonVegGroups[catName];
                  if (!items || items.length === 0) return null;

                  return (
                    <div key={catName} className="mt-5">
                      <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                        {catName}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {items.map((item) => (
                          <FoodCard key={item.id} item={item} />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </section>
          )}
        </div>
      </div>

      <FloatingCart restaurantId={restaurantId} />
      <CallStaffButton restaurantId={restaurantId} />
    </main>
  );
}
