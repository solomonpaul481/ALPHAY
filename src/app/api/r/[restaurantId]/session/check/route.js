const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { resolveRestaurant } = require("@/lib/resolve-restaurant");

async function POST(request, { params }) {
  const { restaurantId } = params;
  const body = await request.json().catch(() => ({}));
  const { tableNumber } = body;

  if (!tableNumber || !String(tableNumber).trim()) {
    return NextResponse.json({ error: "Table number is required." }, { status: 400 });
  }

  const restaurant = await resolveRestaurant(restaurantId);
  if (!restaurant) {
    return NextResponse.json({ hasActiveSession: false });
  }
  const resolvedRestaurantId = restaurant.id;

  const isParcelReq =
    Boolean(body.isParcel) ||
    String(body.type).toLowerCase() === "parcel" ||
    String(tableNumber).trim().toUpperCase() === "PARCEL" ||
    String(tableNumber).trim().toUpperCase() === "P";

  // Parcel / Takeaway customers must never auto-join another customer's previous session
  if (isParcelReq) {
    return NextResponse.json({ hasActiveSession: false, isParcel: true });
  }

  let table = await db.diningTable.findUnique({
    where: { restaurantId_number: { restaurantId: resolvedRestaurantId, number: String(tableNumber).trim() } },
  });

  if (!table) {
    table = await db.diningTable
      .create({
        data: {
          restaurantId: resolvedRestaurantId,
          number: String(tableNumber).trim(),
          isParcelCounter: isParcelReq,
        },
      })
      .catch(() => null);
  }

  if (!table || table.isParcelCounter) {
    return NextResponse.json({ hasActiveSession: false, isParcel: Boolean(table?.isParcelCounter) });
  }

  // Find active session on this table that is NOT ended or completed or closed
  const activeSession = await db.customerSession.findFirst({
    where: {
      restaurantId: resolvedRestaurantId,
      tableId: table.id,
      endedAt: null,
      status: { in: ["ACTIVE", "BILL_REQUESTED", "BILL_SENT"] },
    },
    include: {
      orders: {
        include: { items: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });


  if (!activeSession) {
    return NextResponse.json({ hasActiveSession: false });
  }

  let totalAmount = 0;
  let totalItemsCount = 0;

  activeSession.orders.forEach((ord) => {
    totalAmount += ord.total;
    ord.items.forEach((it) => {
      totalItemsCount += it.quantity;
    });
  });

  return NextResponse.json({
    hasActiveSession: true,
    activeSession: {
      id: activeSession.id,
      tableNumber: table.number,
      createdAt: activeSession.createdAt,
      status: activeSession.status,
      orderCount: activeSession.orders.length,
      totalItemsCount,
      totalAmount: Math.round(totalAmount * 100) / 100,
    },
  });
}

module.exports = { POST };
