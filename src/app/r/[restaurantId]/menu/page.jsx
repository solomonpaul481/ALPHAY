"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createApiClient } from "@/lib/api-client";
import FoodCard from "@/components/FoodCard";
import FloatingCart from "@/components/FloatingCart";
import SearchBar from "@/components/SearchBar";
import CallStaffButton from "@/components/CallStaffButton";
import { useCart } from "@/lib/cart-context";

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
  }, []);

  // Consolidate veg and non-veg groups
  const vegGroups = menu?.veg || {};
  const nonVegGroups = menu?.nonVeg || {};

  const allVegItems = useMemo(() => Object.values(vegGroups).flat(), [vegGroups]);
  const allNonVegItems = useMemo(() => Object.values(nonVegGroups).flat(), [nonVegGroups]);
  const allItems = useMemo(() => [...allVegItems, ...allNonVegItems], [allVegItems, allNonVegItems]);

  // Unique categories for navigation
  const categories = useMemo(() => {
    const set = new Set(["All"]);
    Object.keys(vegGroups).forEach((c) => set.add(c));
    Object.keys(nonVegGroups).forEach((c) => set.add(c));
    return Array.from(set);
  }, [vegGroups, nonVegGroups]);

  // Today's special items
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
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center bg-cream">
        <p className="text-4xl">🍽️</p>
        <h2 className="mt-3 font-display text-xl font-bold text-ink">Unable to load menu</h2>
        <p className="mt-1 text-sm text-ink2">
          We couldn't retrieve the menu right now. Please refresh or enter your table number again.
        </p>
        <button
          type="button"
          onClick={() => router.push(`/r/${restaurantId}`)}
          className="mt-6 rounded-2xl bg-purple px-6 py-3 text-sm font-semibold text-white shadow-soft"
        >
          Re-enter Table Number
        </button>
      </main>
    );
  }

  if (!menu) {
    return (
      <main className="min-h-screen bg-cream px-4 pt-6">
        <div className="animate-pulse space-y-4 max-w-lg mx-auto">
          <div className="h-12 w-full rounded-2xl bg-purple-50" />
          <div className="h-12 w-full rounded-2xl bg-purple-50" />
          <div className="h-44 w-full rounded-2xl bg-purple-50" />
          <div className="h-64 w-full rounded-2xl bg-purple-50" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream pb-32">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 border-b border-purple-50/80 bg-white/95 px-4 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple text-xl text-white shadow-soft">
              {menu.restaurantLogo ? (
                <img src={menu.restaurantLogo} alt={menu.restaurantName} className="h-6 w-6 object-contain" />
              ) : (
                "🍽️"
              )}
            </div>
            <div>
              <h1 className="font-display text-base font-bold leading-none text-ink">
                {menu.restaurantName}
              </h1>
              <p className="mt-1 font-mono text-xs font-semibold text-purple">
                Table #{menu.tableNumber}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push(`/r/${restaurantId}/cart`)}
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-50 text-xl shadow-soft hover:bg-purple-100 transition-colors"
            aria-label="View Cart"
          >
            🛒
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple text-[11px] font-bold text-white shadow-sm">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-4">
        {/* Prominent Search Bar */}
        <SearchBar allItems={allItems} restaurantId={restaurantId} />

        {/* VEG / NON-VEG Main Filter Tabs */}
        <div className="mt-5 flex rounded-2xl bg-white p-1.5 shadow-soft border border-purple-50">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
              activeTab === "ALL"
                ? "bg-purple text-white shadow-soft"
                : "text-ink2 hover:text-ink"
            }`}
          >
            🍽️ ALL ITEMS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("VEG")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
              activeTab === "VEG"
                ? "bg-veg text-white shadow-soft"
                : "text-veg hover:bg-veg-tint/50"
            }`}
          >
            🟢 100% VEG
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("NON_VEG")}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
              activeTab === "NON_VEG"
                ? "bg-nonveg text-white shadow-soft"
                : "text-nonveg hover:bg-nonveg-tint/50"
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
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-ink text-white shadow-soft"
                    : "bg-white text-ink2 border border-purple-50 hover:bg-purple-50 hover:text-ink"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* TODAY'S SPECIAL CAROUSEL */}
        {todaysSpecials.length > 0 && selectedCategory === "All" && (
          <section className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h2 className="font-display text-lg font-bold text-ink">Today's Special</h2>
              </div>
              <span className="font-mono text-xs text-purple font-semibold">Chef's Choice</span>
            </div>
            <div className="scrollbar-none -mx-4 flex gap-4 overflow-x-auto px-4 pb-3">
              {todaysSpecials.map((item) => (
                <FoodCard key={item.id} item={item} layout="wide" />
              ))}
            </div>
          </section>
        )}

        {/* MENU SECTIONS */}
        <div className="mt-8 space-y-10">
          {/* 🟢 VEG SECTION */}
          {(activeTab === "ALL" || activeTab === "VEG") && (
            <section className="rounded-3xl bg-veg-tint/30 p-5 border border-veg/20">
              <div className="flex items-center gap-2.5 border-b border-veg/20 pb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-veg text-xs font-bold text-white">
                  🟢
                </span>
                <h2 className="font-display text-xl font-bold text-veg">VEGETARIAN SELECTION</h2>
              </div>

              {Object.keys(vegGroups).length === 0 ? (
                <p className="mt-4 text-xs text-ink2">No vegetarian dishes found.</p>
              ) : (
                Object.keys(vegGroups).map((catName) => {
                  if (selectedCategory !== "All" && selectedCategory !== catName) return null;
                  const items = vegGroups[catName];
                  if (!items || items.length === 0) return null;

                  return (
                    <div key={catName} className="mt-6">
                      <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-veg">
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
            <section className="rounded-3xl bg-nonveg-tint/30 p-5 border border-nonveg/20">
              <div className="flex items-center gap-2.5 border-b border-nonveg/20 pb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-nonveg text-xs font-bold text-white">
                  🔴
                </span>
                <h2 className="font-display text-xl font-bold text-nonveg">NON-VEGETARIAN SELECTION</h2>
              </div>

              {Object.keys(nonVegGroups).length === 0 ? (
                <p className="mt-4 text-xs text-ink2">No non-vegetarian dishes found.</p>
              ) : (
                Object.keys(nonVegGroups).map((catName) => {
                  if (selectedCategory !== "All" && selectedCategory !== catName) return null;
                  const items = nonVegGroups[catName];
                  if (!items || items.length === 0) return null;

                  return (
                    <div key={catName} className="mt-6">
                      <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-nonveg">
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

      {/* Floating Sticky Cart Indicator */}
      <FloatingCart restaurantId={restaurantId} />

      {/* Call Waiter Helper */}
      <CallStaffButton restaurantId={restaurantId} />
    </main>
  );
}
