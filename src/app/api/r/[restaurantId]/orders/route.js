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
    where: { id: { in: menuItemIds }, restaurantId: session.restaurantId, isAvailable: true },
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

  // Check if an open unpaid order exists for this dining session to aggregate items in ONE order list
  const existingActiveOrder = await db.order.findFirst({
    where: {
      sessionId: session.id,
      status: { in: ["CONFIRMED", "PREPARING", "PENDING_PAYMENT", "READY", "SERVED"] },
    },
    include: { items: true },
  });

  let order;
  if (existingActiveOrder) {
    // Append items to existing order list
    for (const newItem of orderItemsData) {
      const existingItem = existingActiveOrder.items.find((i) => i.menuItemId === newItem.menuItemId);
      if (existingItem) {
        await db.orderItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + newItem.quantity },
        });
      } else {
        await db.orderItem.create({
          data: {
            orderId: existingActiveOrder.id,
            menuItemId: newItem.menuItemId,
            name: newItem.name,
            price: newItem.price,
            quantity: newItem.quantity,
            notes: newItem.notes,
          },
        });
      }
    }

    // Recalculate totals for the unified order list
    const updatedItems = await db.orderItem.findMany({ where: { orderId: existingActiveOrder.id } });
    const newSubtotal = updatedItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const newGst = Math.round(newSubtotal * (restaurant.gstPercent / 100) * 100) / 100;
    const newTotal = Math.round((newSubtotal + newGst) * 100) / 100;

    order = await db.order.update({
      where: { id: existingActiveOrder.id },
      data: {
        subtotal: newSubtotal,
        gstAmount: newGst,
        total: newTotal,
        specialInstructions: specialInstructions || existingActiveOrder.specialInstructions,
        status: "CONFIRMED",
      },
      include: { items: true },
    });
  } else {
    // Calculate next sequential order number
    const totalOrderCount = await db.order.count({ where: { restaurantId } });
    const orderSeq = 1001 + totalOrderCount;

    const gstAmount = Math.round(subtotal * (restaurant.gstPercent / 100) * 100) / 100;
    const total = Math.round((subtotal + gstAmount) * 100) / 100;

    order = await db.order.create({
      data: {
        restaurantId,
        tableId: session.tableId,
        sessionId: session.id,
        status: "CONFIRMED",
        subtotal,
        gstAmount,
        total,
        specialInstructions,
        orderSeq,
        items: { create: orderItemsData },
      },
      include: { items: true },
    });
  }

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    orderSeq: order.orderSeq || 1001,
    amount: order.total,
    restaurantName: restaurant.name,
    tableNumber: session.table.number,
    message: "Order placed successfully! Added to your table session.",
  });
}

module.exports = { POST };
