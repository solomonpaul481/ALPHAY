const { NextResponse } = require("next/server");
const { verifyOnlinePayment, getActiveGateway } = require("@/lib/payment-gateway");

async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const orderId = body.cfOrderId || body.orderId || body.order_id;
    const paymentId = body.paymentId || body.payment_id || body.cfPaymentId;

    if (!orderId) {
      return NextResponse.json(
        {
          error: "Missing required payment verification fields.",
          details: "orderId is required.",
        },
        { status: 400 }
      );
    }

    const verification = await verifyOnlinePayment({
      orderId,
      paymentId,
    });

    if (!verification.success) {
      return NextResponse.json(
        { error: "Payment verification failed or status not paid.", success: false },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      success: true,
      gateway: verification.gateway,
      message: "Payment verified successfully!",
      paymentId: verification.paymentId || paymentId,
      orderId,
    });
  } catch (err) {
    console.error("Verify Payment Error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Payment verification failed." },
      { status: 500 }
    );
  }
}

module.exports = { POST };
