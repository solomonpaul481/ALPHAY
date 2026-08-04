"use client";

export default function CategoryTabs({ categories, accent = "purple" }) {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const borderClass =
    accent === "veg" ? "border-veg/20" : accent === "nonveg" ? "border-nonveg/20" : "border-purple/15";
  const activeBg = accent === "veg" ? "active:bg-veg-tint" : accent === "nonveg" ? "active:bg-nonveg-tint" : "active:bg-purple-50";

  return (
    <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {categories.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => scrollTo(c.id)}
          className={`flex-shrink-0 rounded-full border ${borderClass} bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft transition-colors ${activeBg}`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
