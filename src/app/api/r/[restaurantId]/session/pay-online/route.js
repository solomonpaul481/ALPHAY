const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getSession } = require("@/lib/get-session");
const { createOnlinePaymentOrder } = require("@/lib/payment-gateway");

async function POST(request, { params }) {
  const { restaurantId } = params;

  const session = await getSession(restaurantId);
  if (!session) {
    return NextResponse.json(
      { error: "session_required", message: "Your table session expired. Please rescan the QR code." },
      { status: 401 }
    );
  }

  const sessionWithOrders = await db.customerSession.findUnique({
    where: { id: session.id },
    include: {
      table: true,
      restaurant: true,
      orders: true,
    },
  });

  if (!sessionWithOrders || sessionWithOrders.orders.length === 0) {
    return NextResponse.json({ error: "No orders found in this session." }, { status: 400 });
  }

  let totalAmount = 0;
  sessionWithOrders.orders.forEach((o) => {
    totalAmount += o.total;
  });
  totalAmount = Math.round(totalAmount * 100) / 100;

  if (totalAmount <= 0) {
    return NextResponse.json({ error: "Bill total must be greater than zero." }, { status: 400 });
  }

  try {
    const paymentOrder = await createOnlinePaymentOrder({
      amountInRupees: totalAmount,
      receipt: `SESS_${session.id.slice(-8)}`,
      notes: {
        restaurantId: session.restaurantId,
        tableNumber: sessionWithOrders.table.number,
        sessionId: session.id,
      },
    });

    await db.customerSession.update({
      where: { id: session.id },
      data: {
        billTotal: totalAmount,
        paymentMethod: "ONLINE",
        paymentGateway: "RAZORPAY",
        razorpayOrderId: paymentOrder.orderId,
      },
    });

    return NextResponse.json({
      ok: true,
      gateway: "razorpay",
      sessionId: session.id,
      orderId: paymentOrder.orderId,
      razorpayOrderId: paymentOrder.orderId,
      amount: paymentOrder.amountInPaise,
      amountInRupees: totalAmount,
      currency: "INR",
      keyId: paymentOrder.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_TOtzon9NeyIvZ4",
      restaurantName: sessionWithOrders.restaurant.name,
      tableNumber: sessionWithOrders.table.number,
    });
  } catch (err) {
    console.error("Failed to create online Razorpay session order:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Could not initialize Razorpay payment." },
      { status: 502 }
    );
  }
}

module.exports = { POST };
