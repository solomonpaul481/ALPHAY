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

  // Query cancelled items/orders for active dining sessions
  const cancelledOrdersAndItems = await db.order.findMany({
    where: {
      restaurantId,
      session: {
        endedAt: null,
      },
      OR: [
        { status: "CANCELLED" },
        { items: { some: { isCancelled: true } } },
      ],
    },
    include: {
      items: true,
      table: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const cancelledList = [];
  cancelledOrdersAndItems.forEach((ord) => {
    const isParcel =
      ord.table?.isParcelCounter ||
      String(ord.table?.number).toUpperCase().includes("PARCEL") ||
      String(ord.table?.number).toUpperCase() === "P" ||
      Boolean(ord.specialInstructions?.includes("[PARCEL]"));
    const token = ord.orderSeq ? String(ord.orderSeq).slice(-4).padStart(4, "0") : String(ord.id.slice(-4)).toUpperCase();
    const orderNo = ord.orderSeq ? `#${token}` : `#${ord.id.slice(-4).toUpperCase()}`;
    const tableNo = isParcel ? "PARCEL" : (ord.table ? ord.table.number : "1");

    ord.items.forEach((it) => {
      if (it.isCancelled || ord.status === "CANCELLED") {
        cancelledList.push({
          id: `${ord.id}_${it.id}`,
          orderId: ord.id,
          orderNumber: orderNo,
          tableNumber: tableNo,
          isParcel,
          token,
          name: it.name,
          quantity: it.quantity,
          cancelledAt: ord.updatedAt,
        });
      }
    });
  });

  const formattedOrders = activeOrders
    .map((order) => {
      const isParcel =
        order.table?.isParcelCounter ||
        String(order.table?.number).toUpperCase().includes("PARCEL") ||
        String(order.table?.number).toUpperCase() === "P" ||
        Boolean(order.specialInstructions?.includes("[PARCEL]"));
      const token = order.orderSeq ? String(order.orderSeq).slice(-4).padStart(4, "0") : String(order.id.slice(-4)).toUpperCase();
      const activeItems = order.items.filter((item) => !item.isCancelled);
      return {
        id: order.id,
        orderNumber: `#${token}`,
        token,
        isParcel,
        tableNumber: isParcel ? "PARCEL" : (order.table ? order.table.number : "1"),
        status: order.status === "PAID" ? "CONFIRMED" : order.status,
        createdAt: order.createdAt,
        specialInstructions: order.specialInstructions,
        items: activeItems.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          notes: item.notes,
        })),
      };
    })
    .filter((order) => order.items.length > 0 && order.status !== "CANCELLED");

  return NextResponse.json({
    restaurant,
    orders: formattedOrders,
    cancelledItems: cancelledList,
  });
}

module.exports = { GET };
