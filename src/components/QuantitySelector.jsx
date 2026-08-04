export default function QuantitySelector({ quantity, onIncrease, onDecrease, size = "md" }) {
  const pad = size === "sm" ? "px-2.5 py-1 text-sm" : "px-3 py-1.5";
  return (
    <div className={`inline-flex items-center rounded-full bg-purple-50 ${pad} gap-3`}>
      <button
        type="button"
        onClick={onDecrease}
        aria-label="Decrease quantity"
        className="flex h-5 w-5 items-center justify-center rounded-full text-purple font-bold leading-none active:scale-90 transition-transform"
      >
        −
      </button>
      <span className="min-w-[1ch] text-center font-mono font-semibold text-ink tabular-nums">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        aria-label="Increase quantity"
        className="flex h-5 w-5 items-center justify-center rounded-full text-purple font-bold leading-none active:scale-90 transition-transform"
      >
        +
      </button>
    </div>
  );
}
