const { NextResponse } = require("next/server");
const { createOnlinePaymentOrder } = require("@/lib/payment-gateway");

async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    let { amount, amountInPaise, currency = "INR", receipt, notes } = body;

    let finalAmountPaise = amountInPaise || amount;

    if (!finalAmountPaise || isNaN(finalAmountPaise)) {
      return NextResponse.json(
        { error: "Invalid amount. Amount must be specified as a number in paise or rupees." },
        { status: 400 }
      );
    }

    finalAmountPaise = Math.round(Number(finalAmountPaise));

    // Validate minimum amount: 100 paise (₹1)
    if (finalAmountPaise < 100) {
      return NextResponse.json(
        { error: "Minimum order amount must be at least 100 paise (₹1)." },
        { status: 400 }
      );
    }

    const amountInRupees = finalAmountPaise / 100;
    const orderReceipt = receipt || `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const paymentOrder = await createOnlinePaymentOrder({
      amountInRupees,
      receipt: orderReceipt,
      notes: notes || {},
    });

    const keyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      process.env.RAZORPAY_KEY_ID ||
      "rzp_test_TOtzon9NeyIvZ4";

    return NextResponse.json({
      ok: true,
      gateway: "razorpay",
      order_id: paymentOrder.orderId,
      orderId: paymentOrder.orderId,
      razorpayOrderId: paymentOrder.orderId,
      amount: paymentOrder.amountInPaise,
      amountInRupees,
      currency: "INR",
      keyId,
    });
  } catch (err) {
    console.error("Create Razorpay Order Error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Failed to create Razorpay order." },
      { status: 500 }
    );
  }
}

module.exports = { POST };
