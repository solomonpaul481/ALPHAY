import { redirect } from "next/navigation";
import { getManagerSession } from "@/lib/manager-auth";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import FullscreenButton from "@/components/FullscreenButton";

const NAV_ITEMS = [
  { href: "/manager/dashboard", label: "Dashboard", icon: "📋" },
  { href: "/manager/orders", label: "Orders", icon: "🛎️" },
  { href: "/kitchen", label: "Kitchen Display", icon: "👨‍🍳" },
  { href: "/manager/transactions", label: "Transactions", icon: "💳" },
  { href: "/manager/menu", label: "Menu Management", icon: "🍽️" },
  { href: "/manager/qr", label: "QR & Tables", icon: "🔗" },
  { href: "/manager/analytics", label: "Analytics", icon: "📈" },
  { href: "/manager/staff", label: "Staff", icon: "👥" },
  { href: "/manager/settings", label: "Settings", icon: "⚙️" },
];

export default async function ManagerAppLayout({ children }) {
  const manager = await getManagerSession();
  if (!manager) {
    redirect("/manager/login");
  }

  return (
    <div className="min-h-screen bg-amber-50/20 dark:bg-black text-slate-900 dark:text-white selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200">
      <Sidebar
        brand={manager.restaurant.name}
        subtitle="ALPHAX Manager Portal"
        items={NAV_ITEMS}
        logoutHref="/api/manager/auth/logout"
      />
      <MobileNav items={NAV_ITEMS} />
      <div className="pb-24 md:ml-60 md:pb-0">{children}</div>
      <FullscreenButton />
    </div>
  );
}
