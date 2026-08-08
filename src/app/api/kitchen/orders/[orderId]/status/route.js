const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");

const VALID_STATUSES = ["CONFIRMED", "PREPARING", "READY", "SERVED", "CANCELLED"];

async function POST(request, { params }) {
  const { orderId } = params;
  const body = await request.json().catch(() => ({}));
  const { status } = body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const updatedOrder = await db.order.update({
    where: { id: orderId },
    data: { status },
  });

  return NextResponse.json({ ok: true, status: updatedOrder.status });
}

module.exports = { POST };
