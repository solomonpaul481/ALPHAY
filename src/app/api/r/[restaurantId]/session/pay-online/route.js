const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getSession } = require("@/lib/get-session");
const { createOnlinePaymentOrder, getActiveGateway } = require("@/lib/payment-gateway");

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
    const activeGateway = getActiveGateway();
    const paymentOrder = await createOnlinePaymentOrder({
      amountInRupees: totalAmount,
      receipt: `SESS_${session.id.slice(-8)}`,
      notes: { restaurantId, tableNumber: sessionWithOrders.table.number, sessionId: session.id },
      customerDetails: {
        customerId: `sess_${session.id}`,
        name: `Table ${sessionWithOrders.table.number} Guest`,
        email: `table${sessionWithOrders.table.number}@alphay.app`,
      },
    });

    const updateData = {
      billTotal: totalAmount,
      paymentMethod: "ONLINE",
      paymentGateway: activeGateway.toUpperCase(),
    };

    if (activeGateway === "cashfree") {
      updateData.cashfreeOrderId = paymentOrder.orderId;
    } else {
      updateData.razorpayOrderId = paymentOrder.orderId;
    }

    await db.customerSession.update({
      where: { id: session.id },
      data: updateData,
    });

    return NextResponse.json({
      ok: true,
      gateway: activeGateway,
      sessionId: session.id,
      orderId: paymentOrder.orderId,
      paymentSessionId: paymentOrder.paymentSessionId,
      razorpayOrderId: paymentOrder.orderId,
      amount: totalAmount,
      amountInPaise: Math.round(totalAmount * 100),
      keyId: paymentOrder.keyId || process.env.RAZORPAY_KEY_ID,
      env: paymentOrder.env || process.env.NEXT_PUBLIC_CASHFREE_ENV || "sandbox",
      restaurantName: sessionWithOrders.restaurant.name,
      tableNumber: sessionWithOrders.table.number,
    });
  } catch (err) {
    console.error("Failed to create online payment session order:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Could not initialize online payment." },
      { status: 502 }
    );
  }
}

module.exports = { POST };
