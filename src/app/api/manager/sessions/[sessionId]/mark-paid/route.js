const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");

async function POST(request, { params }) {
  const manager = await getManagerSession();
  if (!manager) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { sessionId } = params;
  const session = await db.customerSession.findUnique({
    where: { id: sessionId },
    include: { orders: true, table: true },
  });

  if (!session || session.restaurantId !== manager.restaurantId) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const paymentMethod = body.paymentMethod || session.paymentMethod || "CASH";

  // Mark session as COMPLETED and PAID, and close active session (endedAt)
  await db.customerSession.update({
    where: { id: sessionId },
    data: {
      status: "COMPLETED",
      paymentStatus: "PAID",
      paymentMethod,
      endedAt: new Date(),
    },
  });

  // Mark all orders in the session as PAID
  await db.order.updateMany({
    where: { sessionId },
    data: { status: "PAID" },
  });

  // Resolve any pending staff call requests for this table
  await db.staffCallRequest.updateMany({
    where: { restaurantId: manager.restaurantId, tableId: session.tableId, status: "PENDING" },
    data: { status: "RESOLVED" },
  });

  return NextResponse.json({
    ok: true,
    message: `Table ${session.table.number} session marked PAID. Active session cleared!`,
  });
}

module.exports = { POST };
