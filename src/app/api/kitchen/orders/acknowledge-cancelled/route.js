const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");

async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { orderId, orderItemId } = body;

    if (!orderId && !orderItemId) {
      return NextResponse.json({ error: "orderId or orderItemId required" }, { status: 400 });
    }

    if (orderItemId) {
      const item = await db.orderItem.findUnique({ where: { id: orderItemId } });
      if (item && !item.notes?.includes("[ACKNOWLEDGED_BY_KITCHEN]")) {
        await db.orderItem.update({
          where: { id: orderItemId },
          data: {
            notes: item.notes ? `${item.notes} [ACKNOWLEDGED_BY_KITCHEN]` : "[ACKNOWLEDGED_BY_KITCHEN]",
          },
        });
      }
    }

    if (orderId) {
      const ord = await db.order.findUnique({ where: { id: orderId } });
      if (ord && !ord.specialInstructions?.includes("[ACKNOWLEDGED_BY_KITCHEN]")) {
        await db.order.update({
          where: { id: orderId },
          data: {
            specialInstructions: ord.specialInstructions
              ? `${ord.specialInstructions} [ACKNOWLEDGED_BY_KITCHEN]`
              : "[ACKNOWLEDGED_BY_KITCHEN]",
          },
        });
      }
    }

    return NextResponse.json({ ok: true, message: "Cancelled item acknowledged." });
  } catch (err) {
    console.error("Acknowledge cancelled item error:", err);
    return NextResponse.json({ error: "Failed to acknowledge" }, { status: 500 });
  }
}

module.exports = { POST };
