const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getSession } = require("@/lib/get-session");
const { createRazorpayOrder } = require("@/lib/razorpay");

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
    const razorpayOrder = await createRazorpayOrder({
      amountInPaise: Math.round(totalAmount * 100),
      receipt: `SESS_${session.id.slice(-8)}`,
      notes: { restaurantId, tableNumber: sessionWithOrders.table.number, sessionId: session.id },
    });

    await db.customerSession.update({
      where: { id: session.id },
      data: {
        razorpayOrderId: razorpayOrder.id,
        billTotal: totalAmount,
        paymentMethod: "ONLINE",
      },
    });

    return NextResponse.json({
      ok: true,
      sessionId: session.id,
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      amountInPaise: Math.round(totalAmount * 100),
      keyId: process.env.RAZORPAY_KEY_ID,
      restaurantName: sessionWithOrders.restaurant.name,
      tableNumber: sessionWithOrders.table.number,
    });
  } catch (err) {
    console.error("Failed to create Razorpay session order:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Could not initialize online payment." },
      { status: 502 }
    );
  }
}

module.exports = { POST };
