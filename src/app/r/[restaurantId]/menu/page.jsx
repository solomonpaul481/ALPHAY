"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createApiClient } from "@/lib/api-client";
import FoodCard from "@/components/FoodCard";
import CategoryCard from "@/components/CategoryCard";
import FloatingCart from "@/components/FloatingCart";
import SearchBar from "@/components/SearchBar";
import CallStaffButton from "@/components/CallStaffButton";
import { useCart } from "@/lib/cart-context";
import { IconUtensils, IconCart, IconSparkles, IconArrowLeft, IconSearch } from "@/components/Icons";

export default function MenuPage() {
  const { restaurantId } = useParams();
  const router = useRouter();
  const api = createApiClient(restaurantId);
  const { totalItems } = useCart();

  const [menu, setMenu] = useState(null);
  const [loadError, setLoadError] = useState(false);

  // Toggle state: true = 🟢 VEG ONLY | false = 🔴 NON-VEG ONLY
  const [isVegOnly, setIsVegOnly] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Intercept browser back button when inside an expanded category view to return to Categories Menu Home
  useEffect(() => {
    if (expandedCategory) {
      window.history.pushState({ category: expandedCategory }, "");
      const handlePopState = () => {
        setExpandedCategory(null);
      };
      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [expandedCategory]);

  const vegGroups = menu?.veg || {};
  const nonVegGroups = menu?.nonVeg || {};

  const allVegItems = useMemo(() => Object.values(vegGroups).flat(), [vegGroups]);
  const allNonVegItems = useMemo(() => Object.values(nonVegGroups).flat(), [nonVegGroups]);
  const allItems = useMemo(() => [...allVegItems, ...allNonVegItems], [allVegItems, allNonVegItems]);

  const activeGroups = isVegOnly ? vegGroups : nonVegGroups;

  const categoryNames = useMemo(() => Object.keys(activeGroups), [activeGroups]);

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
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white">
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
      <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 px-4 pt-6 text-slate-900 dark:text-white">
        <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
          <div className="h-14 w-full rounded-2xl bg-slate-200 dark:bg-zinc-800" />
          <div className="h-12 w-full rounded-2xl bg-slate-200 dark:bg-zinc-800" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 w-full rounded-3xl bg-slate-200 dark:bg-zinc-800" />
            <div className="h-32 w-full rounded-3xl bg-slate-200 dark:bg-zinc-800" />
            <div className="h-32 w-full rounded-3xl bg-slate-200 dark:bg-zinc-800" />
            <div className="h-32 w-full rounded-3xl bg-slate-200 dark:bg-zinc-800" />
          </div>
        </div>
      </main>
    );
  }

  const currentCategoryItems = expandedCategory ? activeGroups[expandedCategory] || [] : [];
  const filteredCategoryItems = searchQuery.trim()
    ? currentCategoryItems.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : currentCategoryItems;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-36 text-slate-900 dark:text-white transition-colors">
      {/* Light Customer Sticky Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-4 py-3 shadow-xs backdrop-blur-md">
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
              <h1 className="text-sm sm:text-base font-extrabold leading-tight text-slate-900 dark:text-white">
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
            <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 dark:bg-zinc-800 p-1 border border-slate-200 dark:border-zinc-700">
              <span className={`text-[10px] font-black px-1 ${isVegOnly ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
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
              className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all cursor-pointer"
              aria-label="View Cart"
            >
              <IconCart className="h-4 w-4" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white shadow-md animate-bounce">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CATEGORIES HOME VIEW */}
      <div className="mx-auto max-w-2xl px-3 sm:px-4 pt-3">
        <SearchBar allItems={allItems} restaurantId={restaurantId} />

        {/* TODAY'S SPECIAL CAROUSEL */}
        {todaysSpecials.length > 0 && !expandedCategory && (
          <section className="mt-5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <IconSparkles className="h-4 w-4 text-amber-500" />
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Chef's Specials</h2>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">Today's Special</span>
            </div>
            <div className="scrollbar-none -mx-3 flex gap-3 overflow-x-auto px-3 pb-2">
              {todaysSpecials.map((item) => (
                <FoodCard key={item.id} item={item} layout="wide" />
              ))}
            </div>
          </section>
        )}

        {/* CATEGORIES GRID: TWO CATEGORIES IN A ROW WITH 3D ELEVATED CARDS */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span className={`inline-block h-3 w-3 rounded-full ${isVegOnly ? "bg-emerald-500" : "bg-rose-500"}`} />
              {isVegOnly ? "Vegetarian Categories" : "Non-Vegetarian Categories"}
            </h2>
            <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">2 per row · 3D Cards</span>
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
            {categoryNames.length === 0 ? (
              <p className="col-span-2 py-6 text-center text-xs font-bold text-slate-500 dark:text-zinc-400">
                No categories available in this mode.
              </p>
            ) : (
              categoryNames.map((catName) => (
                <CategoryCard
                  key={catName}
                  categoryName={catName}
                  items={activeGroups[catName] || []}
                  isVegOnly={isVegOnly}
                  onClick={() => {
                    setExpandedCategory(catName);
                    setSearchQuery("");
                  }}
                />
              ))
            )}
          </div>
        </section>
      </div>

      {/* FULLSCREEN EXPANDED CATEGORY VIEW WITH APP BAR & 2-COLUMN ELEVATED ITEMS */}
      <AnimatePresence>
        {expandedCategory && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex flex-col bg-slate-50 dark:bg-zinc-950 overflow-y-auto"
          >
            {/* EXPANDED VIEW APP BAR AT TOP OF SCREEN */}
            <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 px-4 py-3 shadow-md backdrop-blur-md">
              <div className="mx-auto flex max-w-2xl items-center justify-between">
                {/* Back Button: Returns user to Categories Menu Home screen */}
                <button
                  type="button"
                  onClick={() => setExpandedCategory(null)}
                  className="flex items-center gap-2 rounded-2xl bg-indigo-50 dark:bg-zinc-800 px-3.5 py-2 text-xs font-black text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-zinc-700 hover:bg-indigo-100 dark:hover:bg-zinc-700 transition-all cursor-pointer shadow-xs"
                >
                  <IconArrowLeft className="h-4 w-4" />
                  <span>Categories Menu</span>
                </button>

                {/* Category Name in Top Center of App Bar */}
                <div className="text-center">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    {expandedCategory}
                  </h2>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                    {filteredCategoryItems.length} {filteredCategoryItems.length === 1 ? "Dish" : "Dishes"} Available
                  </p>
                </div>

                {/* Top Right Cart Badge */}
                <button
                  type="button"
                  onClick={() => router.push(`/r/${restaurantId}/cart`)}
                  className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  <IconCart className="h-4 w-4" />
                  {totalItems > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-900 shadow-sm">
                      {totalItems}
                    </span>
                  )}
                </button>
              </div>
            </header>

            {/* EXPANDED CATEGORY CONTENT BODY */}
            <div className="mx-auto w-full max-w-2xl flex-1 px-3 sm:px-4 py-4 pb-36">
              {/* Optional Search filter inside category */}
              <div className="mb-4 relative">
                <IconSearch className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search dishes in ${expandedCategory}...`}
                  className="w-full rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-10 pr-4 py-3 text-xs font-extrabold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm"
                />
              </div>

              {/* ITEMS GRID: TWO ITEMS IN A ROW WITH ELEVATED FOOD CARDS */}
              {filteredCategoryItems.length === 0 ? (
                <div className="rounded-3xl bg-white dark:bg-zinc-900 p-8 text-center border border-slate-200 dark:border-zinc-800 mt-4">
                  <p className="text-xs font-bold text-slate-500 dark:text-zinc-400">
                    No items found matching your search.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
                  {filteredCategoryItems.map((item) => (
                    <FoodCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>

            {/* PERSISTENT FLOATING CART OPTION INSIDE EXPANDED CATEGORY PAGE */}
            <FloatingCart restaurantId={restaurantId} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* PERSISTENT FLOATING CART OPTION ON CATEGORIES MENU PAGE */}
      <FloatingCart restaurantId={restaurantId} />
      <CallStaffButton restaurantId={restaurantId} />
    </main>
  );
}
