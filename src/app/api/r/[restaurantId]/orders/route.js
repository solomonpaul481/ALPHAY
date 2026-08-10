const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getSession } = require("@/lib/get-session");

async function POST(request, { params }) {
  const { restaurantId } = params;

  const session = await getSession(restaurantId);
  if (!session) {
    return NextResponse.json(
      { error: "session_required", message: "Your table session expired. Please rescan the QR code." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const cartItems = Array.isArray(body.items) ? body.items : [];
  const specialInstructions = typeof body.specialInstructions === "string" ? body.specialInstructions.slice(0, 500) : null;

  if (cartItems.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  // Always price from the database — never trust amounts sent by the client.
  const menuItemIds = cartItems.map((c) => c.menuItemId);
  const menuItems = await db.menuItem.findMany({
    where: { id: { in: menuItemIds }, restaurantId, isAvailable: true },
  });
  const menuItemsById = Object.fromEntries(menuItems.map((m) => [m.id, m]));

  let subtotal = 0;
  const orderItemsData = [];
  for (const cartItem of cartItems) {
    const menuItem = menuItemsById[cartItem.menuItemId];
    const quantity = Math.max(1, Math.min(20, parseInt(cartItem.quantity, 10) || 1));
    if (!menuItem) {
      return NextResponse.json(
        { error: `An item in your cart is no longer available.` },
        { status: 409 }
      );
    }
    subtotal += menuItem.price * quantity;
    orderItemsData.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      quantity,
      notes: typeof cartItem.notes === "string" ? cartItem.notes.slice(0, 200) : null,
    });
  }

  const restaurant = session.restaurant;
  const gstAmount = Math.round(subtotal * (restaurant.gstPercent / 100) * 100) / 100;
  const total = Math.round((subtotal + gstAmount) * 100) / 100;

  // Create order with status CONFIRMED directly under the active customer session
  const order = await db.order.create({
    data: {
      restaurantId,
      tableId: session.tableId,
      sessionId: session.id,
      status: "CONFIRMED",
      subtotal,
      gstAmount,
      total,
      specialInstructions,
      items: { create: orderItemsData },
    },
    include: { items: true },
  });

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    amount: total,
    restaurantName: restaurant.name,
    tableNumber: session.table.number,
    message: "Order placed successfully! It has been sent to the kitchen.",
  });
}

module.exports = { POST };
