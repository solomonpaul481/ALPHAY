const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getSession } = require("@/lib/get-session");
const { getActiveGateway } = require("@/lib/payment-gateway");

async function GET(request, { params }) {
  const { restaurantId } = params;

  const session = await getSession(restaurantId);
  if (!session) {
    return NextResponse.json(
      { error: "session_required", message: "Your table session expired. Please rescan the QR code." },
      { status: 401 }
    );
  }

  const sessionWithDetails = await db.customerSession.findUnique({
    where: { id: session.id },
    include: {
      table: true,
      restaurant: true,
      orders: {
        include: { items: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!sessionWithDetails) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  let subtotal = 0;
  let gstAmount = 0;
  let totalAmount = 0;
  let totalItemsCount = 0;

  sessionWithDetails.orders.forEach((ord) => {
    subtotal += ord.subtotal;
    gstAmount += ord.gstAmount;
    totalAmount += ord.total;
    ord.items.forEach((it) => {
      totalItemsCount += it.quantity;
    });
  });

  subtotal = Math.round(subtotal * 100) / 100;
  gstAmount = Math.round(gstAmount * 100) / 100;
  totalAmount = Math.round(totalAmount * 100) / 100;

  const activeGateway = getActiveGateway();

  return NextResponse.json({
    sessionId: sessionWithDetails.id,
    status: sessionWithDetails.status,
    tableNumber: sessionWithDetails.table.number,
    restaurantName: sessionWithDetails.restaurant.name,
    gstPercent: sessionWithDetails.restaurant.gstPercent,
    billRequestedAt: sessionWithDetails.billRequestedAt,
    billSentAt: sessionWithDetails.billSentAt,
    paymentMethod: sessionWithDetails.paymentMethod,
    paymentStatus: sessionWithDetails.paymentStatus,
    paymentGateway: sessionWithDetails.paymentGateway || "CASHFREE",
    activeGateway: "cashfree",
    cashfreeOrderId: sessionWithDetails.cashfreeOrderId,
    cashfreeEnv: process.env.NEXT_PUBLIC_CASHFREE_ENV || "sandbox",
    subtotal,
    gstAmount,
    totalAmount,
    totalItemsCount,
    orders: sessionWithDetails.orders.map((o) => ({
      id: o.id,
      status: o.status,
      createdAt: o.createdAt,
      subtotal: o.subtotal,
      gstAmount: o.gstAmount,
      total: o.total,
      specialInstructions: o.specialInstructions,
      items: o.items.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        notes: i.notes,
      })),
    })),
  });
}

module.exports = { GET };
