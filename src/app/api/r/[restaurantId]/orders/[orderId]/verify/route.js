const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getSession } = require("@/lib/get-session");
const { verifyOnlinePayment } = require("@/lib/payment-gateway");

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


  // Idempotent: if order is already confirmed or further along, return success
  if (
    order.status === "CONFIRMED" ||
    order.status === "PREPARING" ||
    order.status === "READY" ||
    order.status === "SERVED"
  ) {
    return NextResponse.json({ success: true, status: order.status });
  }

  const targetOrderId = order.cashfreeOrderId || orderId;

  const verifyResult = await verifyOnlinePayment({
    orderId: targetOrderId,
  });

  if (!verifyResult.success) {
    return NextResponse.json({ error: "Payment verification failed or unpaid." }, { status: 400 });
  }

  // Transactionally confirm order and payment
  await db.$transaction([
    db.order.update({
      where: { id: order.id },
      data: { status: "CONFIRMED", cashfreePaymentId: verifyResult.paymentId, paymentGateway: "CASHFREE" },
    }),
    db.payment.updateMany({
      where: { orderId: order.id },
      data: {
        status: "verified",
        cashfreePaymentId: verifyResult.paymentId,
        paymentGateway: "CASHFREE",
        verifiedAt: new Date(),
      },
    }),
  ]);

  console.log(`[Verify API] Order ${order.id} verified & confirmed with Cashfree payment ID ${verifyResult.paymentId}`);

  return NextResponse.json({ success: true, status: "CONFIRMED" });
}

module.exports = { POST };
