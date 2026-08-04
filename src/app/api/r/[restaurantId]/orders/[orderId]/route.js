const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getSession } = require("@/lib/get-session");

const ACTIVE_STATUSES = ["CONFIRMED", "PREPARING"];

async function GET(request, { params }) {
  const { restaurantId, orderId } = params;

  const session = await getSession(restaurantId);
  if (!session) {
    return NextResponse.json({ error: "session_required" }, { status: 401 });
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order || order.restaurantId !== restaurantId || order.sessionId !== session.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  let queuePosition = null;
  if (ACTIVE_STATUSES.includes(order.status)) {
    const aheadCount = await db.order.count({
      where: {
        restaurantId,
        status: { in: ACTIVE_STATUSES },
        createdAt: { lt: order.createdAt },
      },
    });
    queuePosition = aheadCount + 1;
  }

  const estimatedPrepMinutes =
    order.items.length > 0
      ? Math.max(
          ...(await db.menuItem
            .findMany({ where: { id: { in: order.items.map((i) => i.menuItemId) } } })
            .then((items) => items.map((i) => i.prepTimeMinutes)))
        )
      : null;

  return NextResponse.json({
    id: order.id,
    status: order.status,
    subtotal: order.subtotal,
    gstAmount: order.gstAmount,
    total: order.total,
    razorpayPaymentId: order.razorpayPaymentId,
    createdAt: order.createdAt,
    tableNumber: session.table.number,
    items: order.items.map((i) => ({
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      notes: i.notes,
    })),
    queuePosition,
    estimatedPrepMinutes,
  });
}

module.exports = { GET };
