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
  if (!order || order.restaurantId !== restaurantId || order.sessionId !== session.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Only ever cancel our own still-pending order — never touch a paid one.
  if (order.status === "PENDING_PAYMENT") {
    await db.order.update({ where: { id: order.id }, data: { status: "PAYMENT_FAILED" } });
  }

  return NextResponse.json({ ok: true });
}

module.exports = { POST };
