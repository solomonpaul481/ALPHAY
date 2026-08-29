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

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { table: true },
  });
  if (!order || order.restaurantId !== session.restaurantId || order.sessionId !== session.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const tokenStr = String(order.orderSeq || 1001).slice(-4).padStart(4, "0");

  // Idempotent: if order is already confirmed or further along, return success
  if (
    order.status === "CONFIRMED" ||
    order.status === "PREPARING" ||
    order.status === "READY" ||
    order.status === "SERVED" ||
    order.status === "PAID"
  ) {
    return NextResponse.json({ success: true, status: order.status, token: tokenStr });
  }

  const body = await request.json().catch(() => ({}));
  const razorpayOrderId = body.razorpay_order_id || body.razorpayOrderId || order.razorpayOrderId;
  const razorpayPaymentId = body.razorpay_payment_id || body.razorpayPaymentId || body.paymentId;
  const razorpaySignature = body.razorpay_signature || body.razorpaySignature || body.signature;

  if (!razorpayOrderId) {
    return NextResponse.json({ error: "Missing Razorpay order ID." }, { status: 400 });
  }

  const verifyResult = await verifyOnlinePayment({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!verifyResult.success) {
    return NextResponse.json({ error: "Payment verification failed or invalid signature." }, { status: 400 });
  }

  // Confirm order & mark as paid
  await db.$transaction([
    db.order.update({
      where: { id: order.id },
      data: {
        status: "CONFIRMED",
        razorpayPaymentId,
        paymentGateway: "RAZORPAY",
      },
    }),
    db.customerSession.update({
      where: { id: session.id },
      data: {
        paymentStatus: "PAID",
        paymentMethod: "ONLINE",
        paymentGateway: "RAZORPAY",
        razorpayOrderId,
        razorpayPaymentId,
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    status: "CONFIRMED",
    token: tokenStr,
    message: "Parcel payment verified! Order confirmed.",
  });
}

module.exports = { POST };
