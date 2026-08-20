"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  IconUtensils,
  IconComputer,
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
  "💻": IconComputer,
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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-amber-500/30 bg-white dark:bg-slate-900 px-4 py-6 md:flex shadow-2xl transition-colors">
      <div className="px-2 pb-4 border-b border-amber-500/20">
        <p className="truncate font-['Cinzel'] text-base font-black leading-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 dark:from-amber-200 dark:via-amber-400 dark:to-amber-100">{brand}</p>
        <p className="mt-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 font-['Cinzel']">{subtitle}</p>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-1.5 overflow-y-auto scrollbar-none">
        {items.map((item) => {
          const active = pathname === item.href;
          const IconComp = ICON_MAP[item.icon] || IconDashboard;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                active
                  ? "bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-black shadow-md font-['Cinzel']"
                  : "text-slate-700 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-slate-800 hover:text-amber-700 dark:hover:text-amber-300"
              }`}
            >
              <IconComp className={`h-4 w-4 ${active ? "text-slate-950" : "text-amber-600 dark:text-amber-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-amber-500/20">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer font-['Cinzel']"
        >
          <IconLogout className="h-4 w-4 text-rose-500" />
          Logout
        </button>
      </div>
    </aside>
  );
}

