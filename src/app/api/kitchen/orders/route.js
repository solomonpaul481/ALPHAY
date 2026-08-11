const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");

async function GET(request) {
  const { searchParams } = new URL(request.url);
  let restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    const manager = await getManagerSession();
    if (manager) {
      restaurantId = manager.restaurantId;
    } else {
      // Fallback to first active restaurant for easy kitchen kiosk access
      const firstRest = await db.restaurant.findFirst({ where: { status: "ACTIVE" } });
      if (firstRest) restaurantId = firstRest.id;
    }
  }

  if (!restaurantId) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, name: true, logoUrl: true },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  // Only query orders for sessions that are STILL ACTIVE (not ended or completed or closed)
  const activeOrders = await db.order.findMany({
    where: {
      restaurantId,
      status: { in: ["PAID", "CONFIRMED", "PREPARING", "READY"] },
      session: {
        endedAt: null,
        status: { in: ["ACTIVE", "BILL_REQUESTED", "BILL_SENT"] },
      },
    },
    include: {
      items: true,
      table: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const formattedOrders = activeOrders.map((order) => ({
    id: order.id,
    orderNumber: order.orderSeq ? `#${order.orderSeq}` : `#${order.id.slice(-4).toUpperCase()}`,
    tableNumber: order.table ? order.table.number : "1",
    status: order.status === "PAID" ? "CONFIRMED" : order.status,
    createdAt: order.createdAt,
    specialInstructions: order.specialInstructions,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      notes: item.notes,
    })),
  }));

  return NextResponse.json({
    restaurant,
    orders: formattedOrders,
  });
}

module.exports = { GET };
