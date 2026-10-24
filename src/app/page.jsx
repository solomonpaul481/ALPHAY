import { db } from "@/lib/db";

export default async function HomePage() {
  let restaurant = null;
  let cafeteria = null;

  try {
    restaurant = await db.restaurant.findFirst({
      where: { category: "RESTAURANT", status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
    });
    if (!restaurant) {
      restaurant = await db.restaurant.findFirst({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
      });
    }

    cafeteria = await db.restaurant.findFirst({
      where: { category: "CAFETERIA", status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
    });
  } catch (err) {
    // DB error fallback
  }

  const services = [
    {
      title: "🏬 Restaurant Self-Ordering",
      tagline: "Full-Service Dining & Takeaway",
      desc: "Table QR scanning, digital menu, post-meal bill request for dine-in, instant kitchen ticket routing, and pre-paid takeaway parcel counters.",
      accent: "border-purple/30 bg-purple-50/70",
      href: restaurant ? `/r/${restaurant.id}` : null,
      cta: "Open Restaurant Experience",
      badge: "Dine-In Pay-Later + Parcel",
    },
    {
      title: "☕ Cafeteria Self-Ordering",
      tagline: "College & Roadside Express Canteens",
      desc: "Fast-moving self-service flow for college cafeterias, roadside cafes, and food courts. Customers must pay first (both dine-in & parcel), get an instant 4-digit pickup token, and collect at the food counter.",
      accent: "border-amber-500/40 bg-amber-50/80",
      href: cafeteria ? `/r/${cafeteria.id}` : (restaurant ? `/r/${restaurant.id}` : null),
      cta: "Open Cafeteria Experience (Pay-First)",
      badge: "100% Pay-First & Token Pickup",
    },
  ];

  const portals = [
    {
      title: "Manager Portal",
      desc: "Kitchen display, live order queues, live cafeteria pickup tokens, menu editing, table QRs, and analytics for a restaurant or cafeteria.",
      href: "/manager/login",
      cta: "Open Manager Portal",
      accent: "border-purple/20 bg-white",
      credentials: "Restaurant: manager@paradise.alphax.demo / paradise123  |  Cafeteria: cafeteria@alphay.demo / cafeteria123",
    },
    {
      title: "Admin Portal — ALPHAY",
      desc: "Platform-wide management: separate categories for Restaurants and Cafeterias, venue onboarding, billing, commission, and analytics.",
      href: "/admin/login",
      cta: "Open Admin Portal",
      accent: "border-amber-500/30 bg-white",
      credentials: "Sign in with Google OAuth",
    },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-50 via-cream to-amber-50/40 px-4 py-16 text-ink">
      <div className="w-full max-w-2xl">
        <div className="text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-purple">ALPHAY</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-medium text-ink">
            Smart Self-Ordering Platform
          </h1>
          <p className="mt-2 text-sm text-ink2 max-w-lg mx-auto">
            One unified platform supporting both <strong>Full-Service Restaurants</strong> and fast-paced <strong>College & Roadside Cafeterias</strong>.
          </p>
        </div>

        {/* SERVICES SECTION */}
        <div className="mt-10">
          <p className="text-xs font-bold uppercase tracking-wider text-purple mb-3 text-center">
            Platform Services
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((svc) => (
              <div key={svc.title} className={`rounded-card border p-5 shadow-soft flex flex-col justify-between ${svc.accent}`}>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple bg-white px-2.5 py-0.5 rounded-full border border-purple/20">
                      {svc.badge}
                    </span>
                  </div>
                  <h2 className="mt-2 font-display text-lg font-bold text-ink">{svc.title}</h2>
                  <p className="text-xs font-semibold text-purple-700 mt-0.5">{svc.tagline}</p>
                  <p className="mt-2 text-xs text-ink2 leading-relaxed">{svc.desc}</p>
                </div>
                {svc.href ? (
                  <a
                    href={svc.href}
                    className="mt-5 block rounded-xl bg-purple px-4 py-2.5 text-center text-xs font-semibold text-white shadow-soft hover:bg-purple-deep transition-all"
                  >
                    {svc.cta} ↗
                  </a>
                ) : (
                  <p className="mt-5 block rounded-xl bg-white px-4 py-2.5 text-center text-xs font-semibold text-ink2">
                    Run database setup first
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* MANAGEMENT PORTALS SECTION */}
        <div className="mt-10">
          <p className="text-xs font-bold uppercase tracking-wider text-ink2 mb-3 text-center">
            Management & Governance Portals
          </p>
          <div className="space-y-4">
            {portals.map((p) => (
              <div key={p.title} className={`rounded-card border p-5 shadow-soft ${p.accent}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-base font-bold text-ink">{p.title}</h3>
                    <p className="mt-1 text-xs text-ink2 max-w-md">{p.desc}</p>
                  </div>
                  <a
                    href={p.href}
                    className="rounded-xl bg-purple px-4 py-2.5 text-center text-xs font-semibold text-white shadow-soft hover:bg-purple-deep transition-all"
                  >
                    {p.cta} ↗
                  </a>
                </div>
                {p.credentials && (
                  <div className="mt-3 pt-3 border-t border-purple/10 text-[11px] font-mono text-ink2 bg-purple-50/40 p-2 rounded-lg">
                    🔑 {p.credentials}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
