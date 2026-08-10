const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");

function getStartDate(timeframe) {
  const now = new Date();
  if (timeframe === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (timeframe === "year") {
    return new Date(now.getFullYear(), 0, 1);
  }
  // Default to today
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function GET(request) {
  const manager = await getManagerSession();
  if (!manager) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get("timeframe") || "today"; // today | month | year
  const statusFilter = searchParams.get("status") || "ALL";

  const startDate = getStartDate(timeframe);

  const whereClause = {
    restaurantId: manager.restaurantId,
    createdAt: { gte: startDate },
  };

  if (statusFilter !== "ALL") {
    whereClause.status = statusFilter;
  }

  const orders = await db.order.findMany({
    where: whereClause,
    include: {
      items: true,
      table: true,
      session: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedOrders = orders.map((o) => ({
    id: o.id,
    orderNumber: o.id.slice(-6).toUpperCase(),
    tableNumber: o.table ? o.table.number : "12",
    status: o.status,
    createdAt: o.createdAt,
    subtotal: o.subtotal,
    gstAmount: o.gstAmount,
    total: o.total,
    specialInstructions: o.specialInstructions,
    razorpayPaymentId: o.razorpayPaymentId,
    paymentMethod: o.session ? o.session.paymentMethod : "CASH",
    items: o.items.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      notes: i.notes,
    })),
  }));

  return NextResponse.json({
    timeframe,
    count: formattedOrders.length,
    orders: formattedOrders,
  });
}

module.exports = { GET };
