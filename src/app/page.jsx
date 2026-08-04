import { db } from "@/lib/db";

export default async function HomePage() {
  let restaurant = null;
  try {
    restaurant = await db.restaurant.findFirst({ where: { status: "ACTIVE" }, orderBy: { createdAt: "asc" } });
  } catch (err) {
    // DB not migrated/seeded yet — the cards below still render with a helpful note.
  }

  const tiers = [
    {
      title: "Customer Portal",
      desc: "Scan → menu → cart → pay → track. The QR-ordering flow a diner sees at the table.",
      href: restaurant ? `/r/${restaurant.id}` : null,
      cta: restaurant ? "Open Customer App" : "Run `npm run seed` first",
      accent: "border-nonveg/20 bg-nonveg-tint/40",
      label: "Places orders",
    },
    {
      title: "Manager Portal",
      desc: "Fulfills what customers order: live queue, analytics, menu, QR codes & tables, staff — for one restaurant.",
      href: "/manager/login",
      cta: "Open Manager Portal",
      accent: "border-purple/20 bg-purple-50",
      label: "Runs one restaurant",
    },
    {
      title: "Admin Portal — ALPHAY",
      desc: "Oversees every restaurant on the platform: onboarding, analytics, status, billing & commission.",
      href: "/admin/login",
      cta: "Open Admin Portal",
      accent: "border-gold/30 bg-gold/10",
      label: "Oversees every restaurant",
    },
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-50 to-cream px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.25em] text-purple">ALPHAY</p>
          <h1 className="mt-2 font-display text-3xl font-medium text-ink">Restaurant Self-Ordering Platform</h1>
          <p className="mt-2 text-sm text-ink2">
            One shared database, three tiers — an order placed by a customer flows up to the
            restaurant that fulfills it, which rolls up into the platform that oversees it all.
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center">
          {tiers.map((t, i) => (
            <div key={t.title} className="flex w-full flex-col items-center">
              <div className={`w-full rounded-card border p-5 shadow-soft ${t.accent}`}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink2">{t.label}</p>
                <h2 className="mt-1 font-display text-lg font-medium text-ink">{t.title}</h2>
                <p className="mt-1.5 text-xs text-ink2">{t.desc}</p>
                {t.href ? (
                  <a
                    href={t.href}
                    className="mt-4 inline-block rounded-xl bg-purple px-4 py-2.5 text-center text-xs font-semibold text-white shadow-soft"
                  >
                    {t.cta}
                  </a>
                ) : (
                  <p className="mt-4 inline-block rounded-xl bg-white px-4 py-2.5 text-center text-xs font-semibold text-ink2">
                    {t.cta}
                  </p>
                )}
              </div>
              {i < tiers.length - 1 && (
                <div className="flex h-8 w-0.5 flex-shrink-0 items-center justify-center bg-purple/20">
                  <span className="flex h-4 w-4 rotate-90 items-center justify-center text-purple/50" aria-hidden>
                    ▶
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
