"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createApiClient } from "@/lib/api-client";
import FoodCard from "@/components/FoodCard";
import CategoryCard from "@/components/CategoryCard";
import FloatingCart from "@/components/FloatingCart";
import SearchBar from "@/components/SearchBar";
import CallStaffButton from "@/components/CallStaffButton";
import { useCart } from "@/lib/cart-context";
import { IconCart, IconSparkles, IconArrowLeft, IconSearch, IconBook, IconListView, IconCardView } from "@/components/Icons";

function MenuContent() {

  const { restaurantId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const api = createApiClient(restaurantId);
  const { totalItems } = useCart();

  const urlTable = searchParams ? searchParams.get("table") : null;

  const [menu, setMenu] = useState(null);
  const [loadError, setLoadError] = useState(false);

  // Toggle state: false = 🔴 NON-VEG ONLY (default opening page) | true = 🟢 VEG ONLY
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  // View option state: "cart" = Constant Card View (default) | "list" = Item Details List View
  const [viewMode, setViewMode] = useState("cart");

  useEffect(() => {
    if (!restaurantId) return;
    const query = urlTable ? `?table=${encodeURIComponent(urlTable)}` : "";
    api
      .getMenu(query)
      .then((data) => {
        setMenu(data);
      })
      .catch((err) => {
        console.error("Menu fetch error:", err);
        setLoadError(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, urlTable]);


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
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-slate-950 text-white">
        <h1 className="text-xl font-bold font-['Cinzel']">Failed to Load Menu</h1>
        <p className="mt-2 text-xs text-slate-400">
          Unable to fetch restaurant details. Please scan table QR again.
        </p>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-amber-400 text-sm font-bold font-['Cinzel'] tracking-widest">
        Loading Menu...
      </div>
    );
  }

  const currentCategoryItems = expandedCategory ? activeGroups[expandedCategory] || [] : [];
  const filteredCategoryItems = searchQuery.trim()
    ? currentCategoryItems.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : currentCategoryItems;

  return (
    <main className="min-h-screen bg-slate-950 text-white pb-36 font-sans select-none">
      {/* HIGH CONTRAST TOP APPBAR */}
      <header className="sticky top-0 z-30 border-b border-amber-500/30 bg-slate-950/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            {menu.logoUrl ? (
              <img
                src={menu.logoUrl}
                alt={menu.restaurantName}
                className="h-10 w-10 rounded-2xl object-cover border border-amber-500/40 shadow-md"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-md">
                <IconBook className="h-5 w-5" />
              </div>
            )}
            <div>
              <h1 className="text-sm sm:text-base font-extrabold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 font-['Cinzel'] tracking-wider">
                {menu.restaurantName}
              </h1>
              <div className="flex items-center gap-2 text-[11px] font-bold text-amber-400 font-mono">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span>TABLE #{menu.tableNumber || "1"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* TOP RIGHT VEG / NON-VEG SWITCH TOGGLE */}
            <div className="flex items-center gap-1.5 rounded-2xl bg-slate-950 p-1 border border-amber-500/30">
              <span className={`text-[10px] font-black px-1 ${isVegOnly ? "text-emerald-400" : "text-rose-400"}`}>
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
              className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-md hover:bg-amber-400 transition-all cursor-pointer"
              aria-label="View Cart"
            >
              <IconCart className="h-4 w-4 text-slate-950" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-slate-950 text-[10px] font-black text-amber-400 border border-amber-400 shadow-md animate-bounce">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CATEGORIES HOME VIEW */}
      <div className="mx-auto max-w-2xl px-3 sm:px-4 pt-3">
        {/* TOP RIGHT VIEW OPTION SWITCHER (BELOW APPBAR WITH ONLY SVG ICONS) */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-bold text-slate-400 font-['Cinzel'] tracking-wider">
            View Mode
          </span>
          <div className="inline-flex rounded-2xl bg-slate-900 p-1 border border-amber-500/30 shadow-md">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex h-8 w-10 items-center justify-center rounded-xl transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="List View"
              aria-label="List View"
            >
              <IconListView className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cart")}
              className={`flex h-8 w-10 items-center justify-center rounded-xl transition-all cursor-pointer ${
                viewMode === "cart"
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Cart / Card View"
              aria-label="Cart / Card View"
            >
              <IconCardView className="h-4 w-4" />
            </button>
          </div>
        </div>

        <SearchBar allItems={allItems} restaurantId={restaurantId} />

        {/* TODAY'S SPECIAL CAROUSEL */}
        {todaysSpecials.length > 0 && !expandedCategory && (
          <section className="mt-5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <IconSparkles className="h-4 w-4 text-amber-400" />
                <h2 className="text-base font-extrabold text-white font-['Cinzel'] tracking-wider">Chef's Specials</h2>
              </div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest font-['Cinzel']">Today's Special</span>
            </div>
            <div className="scrollbar-none -mx-3 flex gap-3 overflow-x-auto px-3 pb-2">
              {todaysSpecials.map((item) => (
                <FoodCard key={item.id} item={item} layout="wide" viewMode={viewMode} />
              ))}
            </div>
          </section>
        )}

        {/* CATEGORIES GRID: TWO CATEGORIES IN A ROW WITH SIMPLIFIED CARDS */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2 font-['Cinzel']">
              <span className={`inline-block h-3 w-3 rounded-full ${isVegOnly ? "bg-emerald-400" : "bg-rose-400"}`} />
              {isVegOnly ? "Vegetarian Categories" : "Non-Vegetarian Categories"}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
            {categoryNames.length === 0 ? (
              <p className="col-span-2 py-6 text-center text-xs font-bold text-slate-400">
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

      {/* FULLSCREEN EXPANDED CATEGORY VIEW WITH APP BAR & ELEVATED ITEMS */}
      <AnimatePresence>
        {expandedCategory && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex flex-col bg-slate-950 overflow-y-auto"
          >
            {/* EXPANDED VIEW APP BAR AT TOP OF SCREEN */}
            <header className="sticky top-0 z-40 border-b border-amber-500/20 bg-slate-900/95 px-4 py-3 shadow-md backdrop-blur-md">
              <div className="mx-auto flex max-w-2xl items-center justify-between">
                {/* Back Button: Just an arrow icon (←) */}
                <button
                  type="button"
                  onClick={() => setExpandedCategory(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all cursor-pointer shadow-xs"
                  aria-label="Back"
                >
                  <IconArrowLeft className="h-5 w-5" />
                </button>

                {/* Category Name in Top Center of App Bar */}
                <div className="text-center">
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight font-['Cinzel']">
                    {expandedCategory}
                  </h2>
                  <p className="text-[10px] font-bold text-amber-300/80">
                    {filteredCategoryItems.length} {filteredCategoryItems.length === 1 ? "Dish" : "Dishes"} Available
                  </p>
                </div>

                {/* Top Right Cart Badge */}
                <button
                  type="button"
                  onClick={() => router.push(`/r/${restaurantId}/cart`)}
                  className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-md hover:bg-amber-400 transition-all cursor-pointer"
                >
                  <IconCart className="h-4 w-4 text-slate-950" />
                  {totalItems > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-slate-950 text-[10px] font-black text-amber-400 border border-amber-400 shadow-sm">
                      {totalItems}
                    </span>
                  )}
                </button>
              </div>
            </header>

            {/* EXPANDED CATEGORY CONTENT BODY */}
            <div className="mx-auto w-full max-w-2xl flex-1 px-3 sm:px-4 py-4 pb-36">
              {/* Top Filter and View Mode Switcher inside Category */}
              <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <IconSearch className="absolute left-3.5 top-3.5 h-4 w-4 text-amber-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search dishes in ${expandedCategory}...`}
                    className="w-full rounded-2xl border border-amber-500/20 bg-slate-900 pl-10 pr-4 py-3 text-xs font-extrabold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 shadow-sm"
                  />
                </div>

                <div className="inline-flex self-end sm:self-auto rounded-2xl bg-slate-900 p-1 border border-amber-500/30 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-black transition-all cursor-pointer ${
                      viewMode === "list"
                        ? "bg-amber-500 text-slate-950 shadow-sm"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <span>📋</span>
                    <span>1. List View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("cart")}
                    className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-black transition-all cursor-pointer ${
                      viewMode === "cart"
                        ? "bg-amber-500 text-slate-950 shadow-sm"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <span>🎴</span>
                    <span>2. Cart View</span>
                  </button>
                </div>
              </div>

              {/* ITEMS GRID / LIST */}
              {filteredCategoryItems.length === 0 ? (
                <div className="rounded-3xl bg-slate-900 p-8 text-center border border-amber-500/20 mt-4">
                  <p className="text-xs font-bold text-slate-400">
                    No items found matching your search.
                  </p>
                </div>
              ) : viewMode === "list" ? (
                <div className="flex flex-col gap-2.5">
                  {filteredCategoryItems.map((item) => (
                    <FoodCard key={item.id} item={item} viewMode="list" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
                  {filteredCategoryItems.map((item) => (
                    <FoodCard key={item.id} item={item} viewMode="cart" />
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

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950 text-amber-400 text-sm font-bold font-['Cinzel'] tracking-widest">
          Loading Menu...
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  );
}

