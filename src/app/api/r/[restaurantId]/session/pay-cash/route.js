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

  // Update session payment method to CASH
  await db.customerSession.update({
    where: { id: session.id },
    data: {
      paymentMethod: "CASH",
    },
  });

  // Alert staff/manager of cash payment intent
  await db.staffCallRequest.create({
    data: {
      restaurantId: session.restaurantId,
      tableId: session.tableId,
      type: "CASH_BILL",
      status: "PENDING",
    },
  });


  return NextResponse.json({
    ok: true,
    message: "Cash payment selected. Please pay your waiter or at the counter.",
  });
}

module.exports = { POST };
