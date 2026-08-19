const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getAdminSession } = require("@/lib/admin-auth");
const { REVENUE_STATUSES } = require("@/lib/analytics");

async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurants = await db.restaurant.findMany({
    include: { managers: true },
    orderBy: { createdAt: "asc" },
  });

  let allOrdersCount = 0;
  let totalCommissionEarned = 0;
  let activeCount = 0;
  let suspendedCount = 0;

  const restaurantsData = await Promise.all(
    restaurants.map(async (r) => {
      if (r.status === "ACTIVE") activeCount++;
      else suspendedCount++;

      const orders = await db.order.findMany({
        where: { restaurantId: r.id, status: { in: REVENUE_STATUSES } },
        select: { id: true, total: true },
      });

      const count = orders.length;
      const earnings = orders.reduce((sum, o) => sum + o.total, 0);
      const commission = Math.round(earnings * (r.commissionPercent / 100) * 100) / 100;

      allOrdersCount += count;
      totalCommissionEarned += commission;

      const primaryManager = r.managers[0] || null;

      return {
        id: r.id,
        name: r.name,
        latitude: r.latitude,
        longitude: r.longitude,
        geofenceRadiusMeters: r.geofenceRadiusMeters,
        gstPercent: r.gstPercent,
        managerName: primaryManager?.name || "Manager",
        managerEmail: primaryManager?.email || "—",
        managerPassword: primaryManager?.rawPassword || "paradise123",
        orders: count,
        earnings,
        commission,
        commissionPercent: r.commissionPercent,
        status: r.status,
      };
    })
  );

  const totalRestaurantsEarning = restaurantsData.reduce((sum, r) => sum + r.earnings, 0);

  return NextResponse.json({
    admin: { name: admin.name, email: admin.email, avatarUrl: admin.avatarUrl },
    allOrders: allOrdersCount,
    restaurantsEarning: Math.round(totalRestaurantsEarning * 100) / 100,
    yourCommission: Math.round(totalCommissionEarned * 100) / 100,
    noOfRestaurants: restaurants.length,
    active: activeCount,
    suspended: suspendedCount,
    restaurants: restaurantsData,
  });
}

module.exports = { GET };
