const BADGE_MAP = {
  BEST_SELLER: { label: "Best Seller", emoji: "🔥", className: "bg-gold/10 text-gold" },
  CHEF_SPECIAL: { label: "Chef Special", emoji: "⭐", className: "bg-purple-50 text-purple" },
  SPICY: { label: "Spicy", emoji: "🥵", className: "bg-nonveg-tint text-nonveg" },
  HEALTHY: { label: "Healthy", emoji: "💚", className: "bg-veg-tint text-veg" },
};

export default function Badge({ code }) {
  const badge = BADGE_MAP[code];
  if (!badge) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}
    >
      <span aria-hidden>{badge.emoji}</span>
      {badge.label}
    </span>
  );
}
