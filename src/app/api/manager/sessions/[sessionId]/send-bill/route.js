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
  });

  if (!session || session.restaurantId !== manager.restaurantId) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const updatedSession = await db.customerSession.update({
    where: { id: sessionId },
    data: {
      status: "BILL_SENT",
      billSentAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    status: updatedSession.status,
    message: "Bill sent to customer device.",
  });
}

module.exports = { POST };
