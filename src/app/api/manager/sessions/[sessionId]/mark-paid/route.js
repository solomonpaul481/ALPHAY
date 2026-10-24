const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");

async function POST(request, { params }) {
  const manager = await getManagerSession();
  if (!manager) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (manager.restaurant?.status === "SUSPENDED") {
    return NextResponse.json({ error: "Your establishment has been suspended by administration." }, { status: 403 });
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

  // Mark all orders in the session as SERVED (dining completed)
  await db.order.updateMany({
    where: { sessionId },
    data: { status: "SERVED" },
  });

  // Resolve any pending staff call requests for this table
  if (session.tableId) {
    await db.staffCallRequest.updateMany({
      where: { restaurantId: manager.restaurantId, tableId: session.tableId, status: "PENDING" },
      data: { status: "RESOLVED" },
    });
  }

  const tableIdentifier = session.table?.number ? `Table #${session.table.number}` : "Order";

  return NextResponse.json({
    ok: true,
    message: `${tableIdentifier} session marked COMPLETED & PAID. Active session cleared!`,
  });
}

module.exports = { POST };
