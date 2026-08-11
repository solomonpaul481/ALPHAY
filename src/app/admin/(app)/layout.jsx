import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import FullscreenButton from "@/components/FullscreenButton";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📋" },
  { href: "/admin/restaurants", label: "Restaurants", icon: "🏬" },
  { href: "/admin/transactions", label: "Transactions", icon: "💳" },
  { href: "/admin/analytics", label: "Analytics", icon: "📈" },
];

export default async function AdminAppLayout({ children }) {
  const admin = await getAdminSession();
  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <Sidebar
        brand="ALPHAY"
        subtitle="Platform Admin"
        items={NAV_ITEMS}
        logoutHref="/api/admin/auth/logout"
      />
      <MobileNav items={NAV_ITEMS} />
      <div className="pb-24 md:ml-60 md:pb-0">{children}</div>
      <FullscreenButton />
    </div>
  );
}
