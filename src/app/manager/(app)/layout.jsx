import { redirect } from "next/navigation";
import { getManagerSession } from "@/lib/manager-auth";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";
import FullscreenButton from "@/components/FullscreenButton";

const NAV_ITEMS = [
  { href: "/manager/dashboard", label: "Dashboard", icon: "💻" },
  { href: "/manager/orders", label: "Orders", icon: "🛎️" },
  { href: "/manager/cafeteria", label: "Cafeteria", icon: "☕" },
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

  const isSuspended = manager.restaurant?.status === "SUSPENDED";
  const isCafeteria = manager.restaurant?.category === "CAFETERIA";
  const venueType = isCafeteria ? "Cafeteria" : "Restaurant";

  if (isSuspended) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute top-1/3 -left-20 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 -right-20 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-xl w-full rounded-3xl bg-slate-900/95 border-2 border-rose-500/60 p-6 sm:p-10 text-center shadow-2xl backdrop-blur-md space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/20 text-rose-500 text-4xl border border-rose-500/40 shadow-inner animate-pulse">
            🚫
          </div>

          <div className="space-y-2">
            <span className="inline-block rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 px-3.5 py-1 text-xs font-black uppercase font-['Cinzel'] tracking-wider">
              Account Suspended
            </span>
            <h1 className="text-2xl sm:text-3xl font-black font-['Cinzel'] text-white">
              Your {venueType} has been suspended
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-md mx-auto leading-relaxed">
              Your {venueType.toLowerCase()} <strong className="text-amber-400 font-bold">{manager.restaurant.name}</strong> has been suspended by ALPHAY administration. Online ordering, customer QR scanning, and order processing are paused.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950/80 border border-rose-500/30 p-4 text-left space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Venue Name:</span>
              <span className="font-bold text-white">{manager.restaurant.name}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Category:</span>
              <span className="font-bold text-amber-400">{manager.restaurant.category}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Status:</span>
              <span className="font-bold text-rose-400">SUSPENDED</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Account Email:</span>
              <span className="font-bold text-slate-200">{manager.email}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <p className="text-xs text-slate-400">
              Please contact the ALPHAY Administrator or support team to reactivate your venue.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="mailto:support@alphay.demo?subject=Account%20Reactivation%20Request"
                className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 px-6 py-3 text-xs font-black text-slate-950 font-['Cinzel'] transition-all shadow-md cursor-pointer"
              >
                Contact Administrator ✉️
              </a>
              <a
                href="/api/manager/auth/logout"
                className="rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-6 py-3 text-xs font-bold text-slate-300 transition-all cursor-pointer"
              >
                Sign Out 🚪
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50/20 dark:bg-black text-slate-900 dark:text-white selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200">
      <Sidebar
        brand={manager.restaurant.name}
        subtitle="ALPHAY Manager Portal"
        items={NAV_ITEMS}
        logoutHref="/api/manager/auth/logout"
      />
      <MobileNav items={NAV_ITEMS} />
      <div className="pb-24 md:ml-60 md:pb-0">{children}</div>
      <FullscreenButton />
    </div>
  );
}
