const { NextResponse } = require("next/server");
const { verifyOnlinePayment } = require("@/lib/payment-gateway");

async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const orderId = body.orderId || body.order_id || body.razorpay_order_id || body.razorpayOrderId;
    const paymentId = body.paymentId || body.payment_id || body.razorpay_payment_id || body.razorpayPaymentId;
    const signature = body.signature || body.razorpay_signature || body.razorpaySignature;

    if (!orderId || !paymentId) {
      return NextResponse.json(
        {
          error: "Missing required payment verification fields.",
          details: "orderId and paymentId are required.",
        },
        { status: 400 }
      );
    }

    const verification = await verifyOnlinePayment({
      orderId,
      paymentId,
      signature,
      gateway: "razorpay",
    });

    if (!verification.success) {
      return NextResponse.json(
        { error: "Payment verification failed. Signature does not match.", success: false },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      success: true,
      gateway: "razorpay",
      message: "Razorpay payment verified successfully!",
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
