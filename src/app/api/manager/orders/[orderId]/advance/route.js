const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");

const NEXT_STATUS = {
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "SERVED",
};

async function POST(request, { params }) {
  const manager = await getManagerSession();
  if (!manager) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const order = await db.order.findUnique({ where: { id: params.orderId } });
  if (!order || order.restaurantId !== manager.restaurantId) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const next = NEXT_STATUS[order.status];
  if (!next) {
    return NextResponse.json(
      { error: `Order is already ${order.status.toLowerCase()}.` },
      { status: 400 }
    );
  }

  const updated = await db.order.update({ where: { id: order.id }, data: { status: next } });
  return NextResponse.json({ ok: true, status: updated.status });
}

module.exports = { POST };
