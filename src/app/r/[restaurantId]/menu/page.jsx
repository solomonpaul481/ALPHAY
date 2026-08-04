"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createApiClient } from "@/lib/api-client";
import FoodCard from "@/components/FoodCard";
import FloatingCart from "@/components/FloatingCart";
import CategoryTabs from "@/components/CategoryTabs";
import SearchBar from "@/components/SearchBar";
import CallStaffButton from "@/components/CallStaffButton";
import VegToggle from "@/components/VegToggle";
import { useCart } from "@/lib/cart-context";

function Row({ title, items }) {
  if (!items?.length) return null;
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-medium text-ink">{title}</h2>
      <div className="scrollbar-none -mx-4 mt-3 flex gap-3.5 overflow-x-auto px-4 pb-2">
        {items.map((item) => (
          <FoodCard key={item.id} item={item} layout="wide" />
        ))}
      </div>
    </section>
  );
}

function MenuBlock({ title, themeClass, groups, prefix }) {
  const categoryNames = Object.keys(groups || {});
  if (categoryNames.length === 0) return null;
  return (
    <section className="mt-10">
      <div className={`rounded-2xl px-4 py-3 ${themeClass}`}>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
      </div>
      {categoryNames.map((catName) => (
        <div key={catName} id={`${prefix}-${catName}`} className="mt-6">
          <h3 className="mb-3 font-display text-base font-medium text-ink2">{catName}</h3>
          <div className="grid grid-cols-2 gap-3">
            {groups[catName].map((item) => (
              <div key={item.id} id={`item-${item.id}`}>
                <FoodCard item={item} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export default function MenuPage() {
  const { restaurantId } = useParams();
  const router = useRouter();
  const api = createApiClient(restaurantId);
  const { totalItems } = useCart();

  const [menu, setMenu] = useState(null);
  const [loadError, setLoadError] = useState(false);
  // Default OFF → non-veg theme, per the brief.
  const [vegMode, setVegMode] = useState(false);

  useEffect(() => {
    api
      .getMenu()
      .then(setMenu)
      .catch((err) => {
        if (err.status === 401) {
          router.replace(`/r/${restaurantId}`);
        } else {
          setLoadError(true);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Everything on this page — search, promo rows, category chips, the menu
  // itself — is scoped to whichever side of the toggle is active.
  const activeGroups = vegMode ? menu?.veg : menu?.nonVeg;
  const prefix = vegMode ? "veg" : "nonveg";

  const activeItems = useMemo(() => {
    if (!activeGroups) return [];
    return Object.values(activeGroups).flat();
  }, [activeGroups]);

  const categoryChips = useMemo(() => {
    if (!activeGroups) return [];
    return Object.keys(activeGroups).map((name) => ({ id: `${prefix}-${name}`, label: name }));
  }, [activeGroups, prefix]);

  const filterByMode = (items) => (items || []).filter((i) => i.isVeg === vegMode);

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-sm text-ink2">
          We couldn't load the menu right now. Please refresh, or rescan the table QR code.
        </p>
      </main>
    );
  }

  if (!menu) {
    return (
      <main className="min-h-screen px-4 pt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-40 rounded-lg bg-purple-50" />
          <div className="h-12 w-full rounded-full bg-purple-50" />
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 w-40 flex-shrink-0 rounded-card bg-purple-50" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen pb-28 transition-colors duration-500 ${vegMode ? "bg-veg-tint/20" : "bg-nonveg-tint/20"}`}>
      <header
        className={`sticky top-0 z-30 flex items-center justify-between border-b bg-cream/90 px-4 py-3.5 backdrop-blur transition-colors duration-300 ${
          vegMode ? "border-veg/15" : "border-nonveg/15"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple text-lg text-white">
            🍽️
          </div>
          <div>
            <p className="font-display text-sm font-semibold leading-none text-ink">
              {menu.restaurantName}
            </p>
            <p className="mt-1 text-xs text-ink2">Table {menu.tableNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <VegToggle vegMode={vegMode} onChange={setVegMode} />
          <button
            type="button"
            onClick={() => router.push(`/r/${restaurantId}/cart`)}
            className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-soft"
            aria-label="View cart"
          >
            🛒
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple text-[11px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="px-4 pt-4">
        <SearchBar allItems={activeItems} restaurantId={restaurantId} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={vegMode ? "veg" : "nonveg"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          <div className="mt-4 px-4">
            <CategoryTabs categories={categoryChips} accent={vegMode ? "veg" : "nonveg"} />
          </div>

          <div className="px-4">
            <Row title="Today's Special" items={filterByMode(menu.todaysSpecial)} />
            <Row title="Recommended For You" items={filterByMode(menu.recommended)} />
            <Row title="Popular Dishes" items={filterByMode(menu.popular)} />

            {vegMode ? (
              <MenuBlock title="VEG MENU" themeClass="bg-veg-tint text-veg" groups={menu.veg} prefix="veg" />
            ) : (
              <MenuBlock
                title="NON VEG MENU"
                themeClass="bg-nonveg-tint text-nonveg"
                groups={menu.nonVeg}
                prefix="nonveg"
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <FloatingCart restaurantId={restaurantId} />
      <CallStaffButton restaurantId={restaurantId} />
    </main>
  );
}
