const { NextResponse } = require("next/server");
const { createOnlinePaymentOrder, getActiveGateway } = require("@/lib/payment-gateway");

async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    let { amount, amountInPaise, currency = "INR", receipt, notes, gateway } = body;

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
      forceGateway: gateway,
    });

    return NextResponse.json({
      ok: true,
      gateway: paymentOrder.gateway,
      order_id: paymentOrder.orderId,
      orderId: paymentOrder.orderId,
      paymentSessionId: paymentOrder.paymentSessionId,
      razorpayOrderId: paymentOrder.orderId,
      amount: paymentOrder.amountInPaise,
      amountInRupees,
      currency: paymentOrder.currency || "INR",
      keyId: paymentOrder.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      env: paymentOrder.env || process.env.NEXT_PUBLIC_CASHFREE_ENV || "sandbox",
    });
  } catch (err) {
    console.error("Create Online Order Error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Failed to create payment order." },
      { status: 500 }
    );
  }
}

module.exports = { POST };
