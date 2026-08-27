const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { verifyOnlinePayment } = require("@/lib/payment-gateway");
const { resolveRestaurant } = require("@/lib/resolve-restaurant");

async function POST(request, { params }) {
  const { restaurantId } = params;
  const body = await request.json().catch(() => ({}));

  const sessionId = body.sessionId;
  const orderId = body.orderId || body.razorpay_order_id || body.razorpayOrderId;
  const paymentId = body.paymentId || body.razorpay_payment_id || body.razorpayPaymentId;
  const signature = body.signature || body.razorpay_signature || body.razorpaySignature;

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session ID." }, { status: 400 });
  }

  const session = await db.customerSession.findUnique({
    where: { id: sessionId },
    include: { orders: true },
  });

  const restaurant = await resolveRestaurant(restaurantId);
  const resolvedRestaurantId = restaurant ? restaurant.id : restaurantId;

  if (!session || (session.restaurantId !== resolvedRestaurantId && session.restaurantId !== restaurantId)) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const targetOrderId = orderId || session.razorpayOrderId;

  if (!targetOrderId) {
    return NextResponse.json({ error: "Missing Razorpay order ID." }, { status: 400 });
  }

  const verifyResult = await verifyOnlinePayment({
    orderId: targetOrderId,
    paymentId,
    signature,
    gateway: "razorpay",
  });

  if (!verifyResult.success) {
    return NextResponse.json(
      { error: "Payment verification failed. Signature does not match." },
      { status: 400 }
    );
  }

  // Update session to COMPLETED & PAID
  await db.customerSession.update({
    where: { id: sessionId },
    data: {
      status: "COMPLETED",
      paymentStatus: "PAID",
      paymentMethod: "ONLINE",
      paymentGateway: "RAZORPAY",
      razorpayOrderId: targetOrderId,
      razorpayPaymentId: paymentId,
      endedAt: new Date(),
    },
  });

  // Mark all session orders as PAID
  await db.order.updateMany({
    where: { sessionId },
    data: { status: "PAID", paymentGateway: "RAZORPAY" },
  });

  return NextResponse.json({
    ok: true,
    message: "Razorpay payment verified successfully! Session completed.",
  });
}

module.exports = { POST };
