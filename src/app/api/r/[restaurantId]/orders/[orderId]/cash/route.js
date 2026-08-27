const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getSession } = require("@/lib/get-session");

async function POST(request, { params }) {
  const { restaurantId, orderId } = params;

  const session = await getSession(restaurantId);
  if (!session) {
    return NextResponse.json({ error: "session_required", message: "Your session expired. Please rescan QR." }, { status: 401 });
  }

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.restaurantId !== session.restaurantId || order.sessionId !== session.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }


  // Idempotent check
  if (
    order.status === "CONFIRMED" ||
    order.status === "PREPARING" ||
    order.status === "READY" ||
    order.status === "SERVED"
  ) {
    return NextResponse.json({ success: true, status: order.status });
  }

  // Transactionally confirm order with Cash payment option
  await db.$transaction([
    db.order.update({
      where: { id: order.id },
      data: { status: "CONFIRMED" },
    }),
    db.payment.upsert({
      where: { orderId: order.id },
      update: {
        status: "CASH_PENDING",
        amount: order.total,
      },
      create: {
        orderId: order.id,
        cashfreeOrderId: `CASH_${order.id}`,
        status: "CASH_PENDING",
        amount: order.total,
      },
    }),
  ]);

  console.log(`[Cash Payment API] Order ${order.id} confirmed with CASH payment method.`);

  return NextResponse.json({ success: true, status: "CONFIRMED", paymentMethod: "CASH" });
}

module.exports = { POST };
