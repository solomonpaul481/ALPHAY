"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeSwitcher from "@/components/ThemeSwitcher";

export default function Sidebar({ brand, subtitle, items, logoutHref }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch(logoutHref, { method: "POST" });
    router.push(logoutHref.includes("admin") ? "/admin/login" : "/manager/login");
    router.refresh();
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-purple-50 bg-white px-4 py-6 md:flex shadow-soft">
      <div className="flex items-center gap-3 px-2 pb-4 border-b border-purple-50">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple text-xl text-white shadow-soft">
          🍽️
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold leading-tight text-ink">{brand}</p>
          <p className="mt-0.5 text-xs font-semibold text-purple">{subtitle}</p>
        </div>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto scrollbar-none">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                active
                  ? "bg-purple text-white shadow-soft"
                  : "text-ink2 hover:bg-purple-50 hover:text-ink"
              }`}
            >
              <span className="text-base" aria-hidden>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-purple-50 space-y-3">
        <div className="px-2">
          <ThemeSwitcher />
        </div>

        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-ink2 transition-colors hover:bg-nonveg-tint hover:text-nonveg"
        >
          <span className="text-base" aria-hidden>↩</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
