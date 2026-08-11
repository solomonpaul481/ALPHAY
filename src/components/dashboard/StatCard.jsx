export default function StatCard({ label, value, sub, accent = "gold", onClick }) {
  const accentClass =
    {
      purple: "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-['Cinzel']",
      veg: "bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-['Cinzel']",
      nonveg: "bg-rose-950/80 text-rose-400 border border-rose-500/40 font-['Cinzel']",
      gold: "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md font-['Cinzel']",
    }[accent] || "bg-slate-950 text-amber-400 border border-amber-500/30 font-['Cinzel']";

  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`flex flex-col gap-1 rounded-3xl bg-slate-900 p-5 text-left shadow-xl border border-amber-500/20 transition-all ${
        onClick ? "hover:border-amber-400 hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer" : ""
      }`}
    >
      <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${accentClass}`}>
        {label}
      </span>
      <span className="mt-2 font-mono text-2xl sm:text-3xl font-black tabular-nums text-white">{value}</span>
      {sub && <span className="text-xs font-semibold text-slate-400 font-mono">{sub}</span>}
    </Comp>
  );
}
