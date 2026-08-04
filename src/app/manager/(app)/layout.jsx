import { redirect } from "next/navigation";
import { getManagerSession } from "@/lib/manager-auth";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import FullscreenButton from "@/components/FullscreenButton";

const NAV_ITEMS = [
  { href: "/manager/dashboard", label: "Dashboard", icon: "📋" },
  { href: "/manager/analytics", label: "Analytics", icon: "📈" },
  { href: "/manager/menu", label: "Menu", icon: "🍽️" },
  { href: "/manager/qr", label: "QR & Tables", icon: "🔗" },
  { href: "/manager/staff", label: "Staff", icon: "👥" },
];

export default async function ManagerAppLayout({ children }) {
  const manager = await getManagerSession();
  if (!manager) {
    redirect("/manager/login");
  }

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar
        brand={manager.restaurant.name}
        subtitle="Manager Portal"
        items={NAV_ITEMS}
        logoutHref="/api/manager/auth/logout"
      />
      <MobileNav items={NAV_ITEMS} />
      <div className="pb-20 md:ml-60 md:pb-0">{children}</div>
      <FullscreenButton />
    </div>
  );
}
