export default function StatCard({ label, value, sub, accent = "purple", onClick }) {
  const accentClass =
    {
      purple: "bg-purple-50 text-purple",
      veg: "bg-veg-tint text-veg",
      nonveg: "bg-nonveg-tint text-nonveg",
      gold: "bg-gold/10 text-gold",
    }[accent] || "bg-purple-50 text-purple";

  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex flex-col gap-1 rounded-card bg-white p-5 text-left shadow-soft ${
        onClick ? "transition-transform hover:-translate-y-0.5 active:scale-[0.99]" : ""
      }`}
    >
      <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${accentClass}`}>
        {label}
      </span>
      <span className="mt-1 font-mono text-2xl font-semibold tabular-nums text-ink">{value}</span>
      {sub && <span className="text-xs text-ink2">{sub}</span>}
    </Comp>
  );
}
