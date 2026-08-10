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

  // Update session status to BILL_REQUESTED
  const updatedSession = await db.customerSession.update({
    where: { id: session.id },
    data: {
      status: "BILL_REQUESTED",
      billRequestedAt: new Date(),
    },
  });

  // Create a staff call request so manager/waiter is alerted immediately
  await db.staffCallRequest.create({
    data: {
      restaurantId,
      tableId: session.tableId,
      type: "BILL",
      status: "PENDING",
    },
  });

  return NextResponse.json({
    ok: true,
    status: updatedSession.status,
    message: "Bill requested! The manager has been notified.",
  });
}

module.exports = { POST };
