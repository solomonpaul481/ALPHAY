const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");

async function GET(request) {
  const { searchParams } = new URL(request.url);
  let restaurantId = searchParams.get("restaurantId");

  if (!restaurantId) {
    const manager = await getManagerSession();
    if (!manager) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    restaurantId = manager.restaurantId;
  }

  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true, name: true, logoUrl: true },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const activeOrders = await db.order.findMany({
    where: {
      restaurantId,
      status: { in: ["CONFIRMED", "PREPARING", "READY"] },
    },
    include: {
      items: true,
      table: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const formattedOrders = activeOrders.map((order) => ({
    id: order.id,
    orderNumber: order.id.slice(-6).toUpperCase(),
    tableNumber: order.table.number,
    status: order.status,
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
