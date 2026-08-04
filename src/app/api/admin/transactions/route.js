const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getAdminSession } = require("@/lib/admin-auth");
const { REVENUE_STATUSES } = require("@/lib/analytics");

async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurants = await db.restaurant.findMany({ orderBy: { createdAt: "asc" } });

  const rows = await Promise.all(
    restaurants.map(async (r) => {
      const orders = await db.order.findMany({
        where: { restaurantId: r.id, status: { in: REVENUE_STATUSES } },
        select: { total: true },
      });
      const sales = orders.reduce((s, o) => s + o.total, 0);
      const commission = Math.round(sales * (r.commissionPercent / 100) * 100) / 100;

      return {
        id: r.id,
        name: r.name,
        status: r.status,
        sales,
        commission,
        commissionPercent: r.commissionPercent,
        dueDate: r.billingDueDate,
        billingStatus: r.billingStatus,
        lastReminderSentAt: r.lastReminderSentAt,
      };
    })
  );

  return NextResponse.json({ transactions: rows });
}

module.exports = { GET };
