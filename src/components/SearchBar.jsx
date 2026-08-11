"use client";

import { useMemo, useState } from "react";
import { IconSearch } from "./Icons";

export default function SearchBar({ allItems, restaurantId }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return allItems
      .filter((i) => {
        const nameMatch = i.name?.toLowerCase().includes(q);
        const catMatch = i.category ? i.category.toLowerCase().includes(q) : false;
        return nameMatch || catMatch;
      })
      .slice(0, 6);
  }, [query, allItems]);

  return (
    <div className="relative">
      <div className="flex items-center gap-3 rounded-2xl bg-white dark:bg-slate-800 px-4 py-3.5 shadow-soft border border-purple-50">
        <IconSearch className="h-5 w-5 text-purple" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          type="text"
          placeholder="Search for biryani, starters, drinks…"
          className="w-full bg-transparent text-sm font-semibold text-ink placeholder:text-ink2 focus:outline-none"
        />
      </div>

      {focused && suggestions.length > 0 && (
        <div className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-lift border border-purple-50">
          {suggestions.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setQuery("");
                document.getElementById(`item-${item.id}`)?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }}
              className="flex w-full items-center gap-3 border-b border-purple-50 px-4 py-3 text-left last:border-0 hover:bg-purple-50 dark:hover:bg-slate-700/60 transition-colors"
            >
              <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl bg-purple-50">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-bold text-purple">
                    ALPHAY
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{item.name}</p>
                <p className="text-xs text-ink2">{item.category}</p>
              </div>
              <span className="font-mono text-sm font-bold text-purple tabular-nums">
                ₹{item.price}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
