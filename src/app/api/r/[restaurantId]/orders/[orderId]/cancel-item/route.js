const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getSession } = require("@/lib/get-session");

async function POST(request, { params }) {
  const { restaurantId, orderId } = params;

  const session = await getSession(restaurantId);
  if (!session) {
    return NextResponse.json({ error: "session_required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { itemId } = body;
  if (!itemId) {
    return NextResponse.json({ error: "Item ID is required." }, { status: 400 });
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, restaurant: true },
  });

  if (!order || order.restaurantId !== session.restaurantId || order.sessionId !== session.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }


  // Prevent cancelling served or closed orders
  if (order.status === "SERVED" || order.status === "PAID") {
    return NextResponse.json({ error: "Cannot cancel items from served or settled orders." }, { status: 400 });
  }

  // Mark the specific order item as cancelled
  await db.orderItem.update({
    where: { id: itemId },
    data: { isCancelled: true },
  });

  // Re-fetch remaining non-cancelled items
  const updatedItems = await db.orderItem.findMany({
    where: { orderId: order.id, isCancelled: false },
  });

  if (updatedItems.length === 0) {
    // All items cancelled -> cancel order
    await db.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED", subtotal: 0, gstAmount: 0, total: 0 },
    });
  } else {
    // Recalculate totals
    const gstPercent = order.restaurant?.gstPercent || 5;
    const newSubtotal = updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const newGstAmount = Math.round(newSubtotal * (gstPercent / 100) * 100) / 100;
    const newTotal = Math.round((newSubtotal + newGstAmount) * 100) / 100;

    await db.order.update({
      where: { id: order.id },
      data: { subtotal: newSubtotal, gstAmount: newGstAmount, total: newTotal },
    });
  }

  return NextResponse.json({ ok: true, message: "Item cancelled successfully." });
}

module.exports = { POST };
