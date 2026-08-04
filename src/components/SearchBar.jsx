"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function SearchBar({ allItems, restaurantId }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return allItems
      .filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
      .slice(0, 6);
  }, [query, allItems]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-full bg-white px-4 py-3 shadow-soft">
        <span aria-hidden className="text-ink2">
          🔍
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          type="text"
          placeholder="Search for biryani, naan, desserts…"
          className="w-full bg-transparent text-sm text-ink placeholder:text-ink2 focus:outline-none"
        />
      </div>

      {focused && suggestions.length > 0 && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl bg-white shadow-lift">
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
              className="flex w-full items-center gap-3 border-b border-purple-50 px-4 py-3 text-left last:border-0 hover:bg-purple-50"
            >
              <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-purple-50">
                {item.imageUrl && (
                  <Image src={item.imageUrl} alt="" fill className="object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                <p className="text-xs text-ink2">{item.category}</p>
              </div>
              <span className="font-mono text-sm font-semibold text-ink tabular-nums">
                ₹{item.price}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
