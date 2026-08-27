const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getSession } = require("@/lib/get-session");

async function POST(request, { params }) {
  const { restaurantId, orderId } = params;

  const session = await getSession(restaurantId);
  if (!session) {
    return NextResponse.json({ error: "session_required" }, { status: 401 });
  }

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.restaurantId !== session.restaurantId || order.sessionId !== session.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }


  if (order.status === "SERVED" || order.status === "PAID") {
    return NextResponse.json({ error: "Cannot cancel a served or settled order." }, { status: 400 });
  }

  // Cancel order and mark all items as cancelled
  await db.order.update({
    where: { id: order.id },
    data: { status: "CANCELLED", subtotal: 0, gstAmount: 0, total: 0 },
  });

  await db.orderItem.updateMany({
    where: { orderId: order.id },
    data: { isCancelled: true },
  });

  return NextResponse.json({ ok: true, message: "Order cancelled successfully." });
}

module.exports = { POST };
