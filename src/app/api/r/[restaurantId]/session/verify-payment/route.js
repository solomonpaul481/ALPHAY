const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { verifyPaymentSignature } = require("@/lib/razorpay");

async function POST(request, { params }) {
  const { restaurantId } = params;
  const body = await request.json().catch(() => ({}));
  const { sessionId, razorpayPaymentId, razorpayOrderId, signature } = body;

  if (!sessionId || !razorpayPaymentId || !razorpayOrderId || !signature) {
    return NextResponse.json({ error: "Missing required payment parameters." }, { status: 400 });
  }

  const isValid = verifyPaymentSignature({
    razorpayOrderId,
    razorpayPaymentId,
    signature,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
  }

  const session = await db.customerSession.findUnique({
    where: { id: sessionId },
    include: { orders: true },
  });

  if (!session || session.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  // Update session to COMPLETED & PAID
  await db.customerSession.update({
    where: { id: sessionId },
    data: {
      status: "COMPLETED",
      paymentStatus: "PAID",
      paymentMethod: "ONLINE",
      razorpayPaymentId,
      endedAt: new Date(),
    },
  });

  // Mark all session orders as PAID
  await db.order.updateMany({
    where: { sessionId },
    data: { status: "PAID" },
  });

  return NextResponse.json({
    ok: true,
    message: "Payment verified successfully! Session completed.",
  });
}

module.exports = { POST };
