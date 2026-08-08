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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-purple-50 bg-white px-4 py-6 md:flex">
      <div className="flex items-center gap-2.5 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple text-lg text-white">
          🍽️
        </div>
        <div>
          <p className="font-display text-sm font-semibold leading-none text-ink">{brand}</p>
          <p className="mt-1 text-xs text-ink2">{subtitle}</p>
        </div>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-purple text-white" : "text-ink2 hover:bg-purple-50 hover:text-ink"
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mb-3 px-2">
        <ThemeSwitcher />
      </div>

      <button
        type="button"
        onClick={logout}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink2 transition-colors hover:bg-nonveg-tint hover:text-nonveg"
      >
        <span aria-hidden>↩</span>
        Logout
      </button>
    </aside>
  );
}
