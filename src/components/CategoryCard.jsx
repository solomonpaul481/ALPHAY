"use client";

import { motion } from "framer-motion";

const DEFAULT_CATEGORY_IMAGES = {
  "Starters": "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=400&q=80",
  "Appetizers": "https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=400&q=80",
  "Biryani": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80",
  "Rice": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80",
  "Main Course": "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=400&q=80",
  "Curries": "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=400&q=80",
  "Pizzas": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80",
  "Burgers": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80",
  "Breads": "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=400&q=80",
  "Naan": "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=400&q=80",
  "Desserts": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80",
  "Beverages": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80",
  "Drinks": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80",
};

export default function CategoryCard({ categoryName, items = [], isVegOnly = true, onClick }) {
  const firstItemWithImg = items.find((i) => i.imageUrl)?.imageUrl;
  const imageUrl = firstItemWithImg || DEFAULT_CATEGORY_IMAGES[categoryName] || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&q=80";

  return (
    <motion.div
      layoutId={`category-card-${categoryName}`}
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="group relative flex h-28 w-full overflow-hidden rounded-3xl bg-slate-900 p-3.5 shadow-xl border-b-4 border-r-2 border-amber-500/30 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all duration-300 cursor-pointer select-none"
    >
      {/* 3D Depth Top-Right Gold Glow */}
      <div className="absolute -top-12 -right-12 h-28 w-28 rounded-full bg-amber-500/15 blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

      {/* Left Side: Category Name ONLY */}
      <div className="relative z-10 flex h-full flex-1 items-center pr-2">
        <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug line-clamp-2 group-hover:text-amber-400 transition-colors font-['Cinzel'] tracking-wide">
          {categoryName}
        </h3>
      </div>

      {/* Right Side: Category Image */}
      <div className="relative h-full w-20 sm:w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-850 border border-slate-800">
        <img
          src={imageUrl}
          alt={categoryName}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
        />
        {/* Bottom Fade Gradient Mask */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-slate-900 pointer-events-none" />
      </div>
    </motion.div>
  );
}
