const { NextResponse } = require("next/server");
const { verifyPaymentSignature } = require("@/lib/razorpay");

async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const orderId =
      body.razorpay_order_id || body.razorpayOrderId || body.orderId || body.order_id;
    const paymentId =
      body.razorpay_payment_id || body.razorpayPaymentId || body.paymentId || body.payment_id;
    const signature =
      body.razorpay_signature || body.razorpaySignature || body.signature;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        {
          error: "Missing required payment verification fields.",
          details: "razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.",
        },
        { status: 400 }
      );
    }

    const isValid = verifyPaymentSignature({
      orderId,
      paymentId,
      signature,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid payment signature.", success: false },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      success: true,
      message: "Payment verified successfully!",
      paymentId,
      orderId,
    });
  } catch (err) {
    console.error("Razorpay Verify Payment Error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Payment verification failed." },
      { status: 500 }
    );
  }
}

module.exports = { POST };
