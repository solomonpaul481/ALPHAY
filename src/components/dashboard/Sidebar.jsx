"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconUtensils,
  IconDashboard,
  IconOrders,
  IconChef,
  IconTransactions,
  IconAnalytics,
  IconQrCode,
  IconStaff,
  IconSettings,
  IconBuilding,
  IconLogout,
} from "@/components/Icons";

const ICON_MAP = {
  "📋": IconDashboard,
  "🛎️": IconOrders,
  "👨‍🍳": IconChef,
  "💳": IconTransactions,
  "🍽️": IconUtensils,
  "🔗": IconQrCode,
  "📈": IconAnalytics,
  "👥": IconStaff,
  "⚙️": IconSettings,
  "🏬": IconBuilding,
};

export default function Sidebar({ brand, subtitle, items, logoutHref }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch(logoutHref, { method: "POST" });
    router.push(logoutHref.includes("admin") ? "/admin/login" : "/manager/login");
    router.refresh();
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-purple-50 bg-white dark:bg-slate-900 px-4 py-6 md:flex shadow-soft">
      <div className="px-2 pb-4 border-b border-purple-50">
        <p className="truncate font-display text-base font-bold leading-tight text-ink">{brand}</p>
        <p className="mt-0.5 text-xs font-semibold text-purple">{subtitle}</p>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto scrollbar-none">
        {items.map((item) => {
          const active = pathname === item.href;
          const IconComp = ICON_MAP[item.icon] || IconDashboard;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                active
                  ? "bg-purple text-white shadow-soft"
                  : "text-ink2 hover:bg-purple-50 dark:hover:bg-slate-800 hover:text-ink"
              }`}
            >
              <IconComp className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-purple-50">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-ink2 transition-colors hover:bg-nonveg-tint hover:text-nonveg cursor-pointer"
        >
          <IconLogout className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}

