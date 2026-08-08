"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export default function MobileNav({ items }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-purple-50 bg-white/95 dark:bg-slate-900/95 px-2 py-2 backdrop-blur md:hidden">
      {items.map((item) => {
        const active = pathname === item.href;
        const IconComp = ICON_MAP[item.icon] || IconDashboard;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold transition-all ${
              active ? "text-purple" : "text-ink2 hover:text-ink"
            }`}
          >
            <IconComp className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
