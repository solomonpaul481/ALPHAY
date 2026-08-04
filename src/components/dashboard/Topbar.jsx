import ThemeSwitcher from "@/components/ThemeSwitcher";

export default function Topbar({ title, right }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-purple-50 bg-cream px-6 py-4 transition-colors">
      <h1 className="font-display text-xl font-medium text-ink">{title}</h1>
      <div className="flex items-center gap-3">
        <ThemeSwitcher />
        {right}
      </div>
    </header>
  );
}
