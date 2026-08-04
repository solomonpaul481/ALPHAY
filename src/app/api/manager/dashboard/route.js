const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");
const { getRevenueSummary } = require("@/lib/analytics");

function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function GET() {
  const manager = await getManagerSession();
  if (!manager) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const restaurantId = manager.restaurantId;

  const [summary, liveOrders, completedToday, staffCalls] = await Promise.all([
    getRevenueSummary(restaurantId),
    db.order.findMany({
      where: { restaurantId, status: { in: ["CONFIRMED", "PREPARING", "READY"] } },
      include: { items: true, table: true },
      orderBy: { createdAt: "asc" },
    }),
    db.order.count({
      where: { restaurantId, status: "SERVED", createdAt: { gte: startOfDay() } },
    }),
    db.staffCallRequest.findMany({
      where: { restaurantId, status: "PENDING" },
      include: { table: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const activeCount = liveOrders.filter((o) => o.status === "CONFIRMED" || o.status === "PREPARING").length;
  const readyCount = liveOrders.filter((o) => o.status === "READY").length;

  return NextResponse.json({
    restaurantName: manager.restaurant.name,
    todayOrders: summary.today.count,
    todayEarnings: summary.today.total,
    monthEarnings: summary.month.total,
    active: activeCount,
    ready: readyCount,
    completedToday,
    allToday: summary.today.count,
    liveOrders: liveOrders.map((o) => ({
      id: o.id,
      status: o.status,
      table: o.table.number,
      total: o.total,
      createdAt: o.createdAt,
      razorpayPaymentId: o.razorpayPaymentId,
      items: o.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
    })),
    staffCalls: staffCalls.map((c) => ({
      id: c.id,
      type: c.type,
      table: c.table.number,
      createdAt: c.createdAt,
    })),
  });
}

module.exports = { GET };
