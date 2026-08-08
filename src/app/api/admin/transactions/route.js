const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getAdminSession } = require("@/lib/admin-auth");
const { REVENUE_STATUSES } = require("@/lib/analytics");

function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfYear() {
  const d = new Date();
  d.setMonth(0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurants = await db.restaurant.findMany({ orderBy: { createdAt: "asc" } });

  const [dailyOrders, monthlyOrders, yearlyOrders] = await Promise.all([
    db.order.findMany({
      where: { status: { in: REVENUE_STATUSES }, createdAt: { gte: startOfDay() } },
      include: { restaurant: true },
    }),
    db.order.findMany({
      where: { status: { in: REVENUE_STATUSES }, createdAt: { gte: startOfMonth() } },
      include: { restaurant: true },
    }),
    db.order.findMany({
      where: { status: { in: REVENUE_STATUSES }, createdAt: { gte: startOfYear() } },
      include: { restaurant: true },
    }),
  ]);

  const dailyEarnings = dailyOrders.reduce((sum, o) => sum + o.total, 0);
  const dailyFee = dailyOrders.reduce(
    (sum, o) => sum + Math.round(o.total * (o.restaurant.commissionPercent / 100) * 100) / 100,
    0
  );

  const monthlyEarnings = monthlyOrders.reduce((sum, o) => sum + o.total, 0);
  const monthlyFee = monthlyOrders.reduce(
    (sum, o) => sum + Math.round(o.total * (o.restaurant.commissionPercent / 100) * 100) / 100,
    0
  );

  const yearlyEarnings = yearlyOrders.reduce((sum, o) => sum + o.total, 0);
  const yearlyFee = yearlyOrders.reduce(
    (sum, o) => sum + Math.round(o.total * (o.restaurant.commissionPercent / 100) * 100) / 100,
    0
  );

  const rows = await Promise.all(
    restaurants.map(async (r) => {
      const whereClause = {
        restaurantId: r.id,
        status: { in: REVENUE_STATUSES },
      };

      if (r.lastSettledAt) {
        whereClause.createdAt = { gt: r.lastSettledAt };
      }

      const orders = await db.order.findMany({
        where: whereClause,
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

  return NextResponse.json({
    summary: {
      dailyEarnings,
      dailyFee,
      monthlyEarnings,
      monthlyFee,
      yearlyEarnings,
      yearlyFee,
    },
    transactions: rows,
  });
}

module.exports = { GET };
