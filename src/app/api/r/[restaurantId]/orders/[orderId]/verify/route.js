const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getSession } = require("@/lib/get-session");
const { verifyCheckoutSignature } = require("@/lib/razorpay");

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

  // Idempotent: if order is already confirmed or further along, return success
  if (
    order.status === "CONFIRMED" ||
    order.status === "PREPARING" ||
    order.status === "READY" ||
    order.status === "SERVED"
  ) {
    return NextResponse.json({ success: true, status: order.status });
  }

  const body = await request.json().catch(() => ({}));
  const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = body;

  if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
    return NextResponse.json({ error: "Missing payment verification parameters." }, { status: 400 });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  const isSecretConfigured = secret && !secret.includes("***");

  let isValid = false;
  if (isSecretConfigured) {
    isValid = verifyCheckoutSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });
  } else {
    // If secret is not configured or placeholder in dev mode, check order matches
    isValid = order.razorpayOrderId === razorpayOrderId || !order.razorpayOrderId;
  }

  if (!isValid) {
    return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
  }

  // Transactionally confirm order and payment
  await db.$transaction([
    db.order.update({
      where: { id: order.id },
      data: { status: "CONFIRMED", razorpayPaymentId },
    }),
    db.payment.updateMany({
      where: { orderId: order.id },
      data: {
        status: "verified",
        razorpayPaymentId,
        verifiedAt: new Date(),
      },
    }),
  ]);

  console.log(`[Verify API] Order ${order.id} verified & confirmed with payment ID ${razorpayPaymentId}`);

  return NextResponse.json({ success: true, status: "CONFIRMED" });
}

module.exports = { POST };
