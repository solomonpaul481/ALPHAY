export default function VegDot({ isVeg }) {
  const color = isVeg ? "border-veg" : "border-nonveg";
  const dot = isVeg ? "bg-veg" : "bg-nonveg";
  return (
    <span
      className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border-2 ${color}`}
      aria-label={isVeg ? "Vegetarian" : "Non-vegetarian"}
      title={isVeg ? "Vegetarian" : "Non-vegetarian"}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
    </span>
  );
}
