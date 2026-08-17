const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { verifyOnlinePayment, getActiveGateway } = require("@/lib/payment-gateway");

async function POST(request, { params }) {
  const { restaurantId } = params;
  const body = await request.json().catch(() => ({}));

  const sessionId = body.sessionId;
  const orderId = body.orderId || body.cfOrderId || body.razorpayOrderId;
  const paymentId = body.paymentId || body.razorpayPaymentId || body.cfPaymentId;
  const signature = body.signature || body.razorpaySignature;
  const gateway = body.gateway || getActiveGateway();

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session ID." }, { status: 400 });
  }

  const session = await db.customerSession.findUnique({
    where: { id: sessionId },
    include: { orders: true },
  });

  if (!session || session.restaurantId !== restaurantId) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const targetOrderId = orderId || session.cashfreeOrderId || session.razorpayOrderId;

  // Determine active provider for verification
  const isCashfree = gateway === "cashfree" || Boolean(session.cashfreeOrderId);

  if (isCashfree) {
    if (!targetOrderId) {
      return NextResponse.json({ error: "Missing Cashfree order ID." }, { status: 400 });
    }

    const verifyResult = await verifyOnlinePayment({
      orderId: targetOrderId,
      paymentId,
      gateway: "cashfree",
    });

    if (!verifyResult.success) {
      return NextResponse.json(
        { error: `Payment not completed. Status: ${verifyResult.status}` },
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
        paymentGateway: "CASHFREE",
        cashfreePaymentId: verifyResult.paymentId,
        endedAt: new Date(),
      },
    });

    // Mark all session orders as PAID
    await db.order.updateMany({
      where: { sessionId },
      data: { status: "PAID", paymentGateway: "CASHFREE" },
    });

    return NextResponse.json({
      ok: true,
      message: "Cashfree payment verified successfully! Session completed.",
    });
  } else {
    // Razorpay Flow
    if (!paymentId || !targetOrderId || !signature) {
      return NextResponse.json({ error: "Missing required Razorpay payment parameters." }, { status: 400 });
    }

    const verifyResult = await verifyOnlinePayment({
      orderId: targetOrderId,
      paymentId,
      signature,
      gateway: "razorpay",
    });

    if (!verifyResult.success) {
      return NextResponse.json({ error: "Invalid Razorpay payment signature." }, { status: 400 });
    }

    await db.customerSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        paymentStatus: "PAID",
        paymentMethod: "ONLINE",
        paymentGateway: "RAZORPAY",
        razorpayPaymentId: paymentId,
        endedAt: new Date(),
      },
    });

    await db.order.updateMany({
      where: { sessionId },
      data: { status: "PAID", paymentGateway: "RAZORPAY" },
    });

    return NextResponse.json({
      ok: true,
      message: "Razorpay payment verified successfully! Session completed.",
    });
  }
}

module.exports = { POST };
