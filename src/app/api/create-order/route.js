const { NextResponse } = require("next/server");
const { createRazorpayOrder } = require("@/lib/razorpay");

async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    let { amount, amountInPaise, currency = "INR", receipt, notes } = body;

    // Resolve amount in paise. If amount is provided, check if it's already in paise or rupees.
    let finalAmountPaise = amountInPaise || amount;

    if (!finalAmountPaise || isNaN(finalAmountPaise)) {
      return NextResponse.json(
        { error: "Invalid amount. Amount must be specified as a number in paise." },
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

    const orderReceipt = receipt || `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const razorpayOrder = await createRazorpayOrder({
      amountInPaise: finalAmountPaise,
      currency,
      receipt: orderReceipt,
      notes: notes || {},
    });

    const keyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "";

    return NextResponse.json({
      ok: true,
      order_id: razorpayOrder.id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId,
    });
  } catch (err) {
    console.error("Razorpay Create Order Error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Failed to create Razorpay order." },
      { status: 500 }
    );
  }
}

module.exports = { POST };
