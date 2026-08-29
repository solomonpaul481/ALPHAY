const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");

async function DELETE(request, { params }) {
  const manager = await getManagerSession();
  if (!manager) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const order = await db.order.findUnique({ where: { id: params.orderId } });
  if (!order || order.restaurantId !== manager.restaurantId) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Mark as CANCELLED or delete
  await db.$transaction([
    db.orderItem.deleteMany({ where: { orderId: order.id } }),
    db.payment.deleteMany({ where: { orderId: order.id } }),
    db.order.delete({ where: { id: order.id } }),
  ]);

  return NextResponse.json({ ok: true, message: "Order removed successfully." });
}

async function PATCH(request, { params }) {
  const manager = await getManagerSession();
  if (!manager) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const status = body.status || "SERVED";

  const order = await db.order.update({
    where: { id: params.orderId },
    data: { status },
  });

  return NextResponse.json({ ok: true, order });
}

module.exports = { DELETE, PATCH };
