const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");

function getDateBounds(range) {
  const now = new Date();
  if (range === "yesterday") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
    return { gte: start, lte: end };
  }
  if (range === "week") {
    const day = now.getDay();
    const diffToMon = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now.getFullYear(), now.getMonth(), diffToMon, 0, 0, 0);
    return { gte: start };
  }
  if (range === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    return { gte: start };
  }
  // Default to "today"
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  return { gte: start };
}

async function GET(request) {
  const manager = await getManagerSession();
  if (!manager) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || searchParams.get("timeframe") || "today"; // today | yesterday | week | month

  const dateBounds = getDateBounds(range);

  const orders = await db.order.findMany({
    where: {
      restaurantId: manager.restaurantId,
      createdAt: dateBounds,
    },
    include: {
      items: true,
      table: true,
      session: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedOrders = orders.map((o) => {
    const isParcel = o.table
      ? (o.table.isParcelCounter || String(o.table.number).toUpperCase().includes("PARCEL") || String(o.table.number).toUpperCase() === "P" || Boolean(o.specialInstructions?.includes("[PARCEL]")))
      : Boolean(o.specialInstructions?.includes("[PARCEL]"));
    const tokenStr = String(o.orderSeq || 1001).slice(-4).padStart(4, "0");

    return {
      id: o.id,
      orderNumber: `#${tokenStr}`,
      orderSeq: o.orderSeq,
      token: tokenStr,
      tableNumber: isParcel ? "PARCEL" : (o.table ? o.table.number : "1"),
      isParcel,
      status: o.status,
      createdAt: o.createdAt,
      subtotal: o.subtotal,
      gstAmount: o.gstAmount,
      total: o.total,
      specialInstructions: o.specialInstructions,
      paymentGateway: o.paymentGateway || "RAZORPAY",
      razorpayPaymentId: o.razorpayPaymentId,
      paymentMethod: o.session ? o.session.paymentMethod || "CASH" : "ONLINE",
      paymentStatus: o.status === "PENDING_PAYMENT" ? "UNPAID" : "PAID",
      items: o.items.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        notes: i.notes,
      })),
    };
  });

  return NextResponse.json({
    range,
    count: formattedOrders.length,
    orders: formattedOrders,
  });
}

module.exports = { GET };
