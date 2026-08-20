const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");

async function POST(request, { params }) {
  const { restaurantId } = params;
  const body = await request.json().catch(() => ({}));
  const { tableNumber } = body;

  if (!tableNumber || !String(tableNumber).trim()) {
    return NextResponse.json({ error: "Table number is required." }, { status: 400 });
  }

  let table = await db.diningTable.findUnique({
    where: { restaurantId_number: { restaurantId, number: String(tableNumber).trim() } },
  });

  if (!table) {
    table = await db.diningTable
      .create({
        data: {
          restaurantId,
          number: String(tableNumber).trim(),
        },
      })
      .catch(() => null);
  }

  if (!table) {
    return NextResponse.json({ hasActiveSession: false });
  }

  // Find active session on this table that is NOT ended or completed or closed
  const activeSession = await db.customerSession.findFirst({
    where: {
      restaurantId,
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
