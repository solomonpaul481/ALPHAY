const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getSession } = require("@/lib/get-session");

const VALID_TYPES = ["WAITER", "WATER", "HELP"];

async function POST(request, { params }) {
  const { restaurantId } = params;

  const session = await getSession(restaurantId);
  if (!session) {
    return NextResponse.json({ error: "session_required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  if (!VALID_TYPES.includes(body.type)) {
    return NextResponse.json({ error: "Invalid request type." }, { status: 400 });
  }

  const call = await db.staffCallRequest.create({
    data: { restaurantId: session.restaurantId, tableId: session.tableId, type: body.type },
  });


  // This is where the request would be pushed live to the Manager Dashboard
  // (websocket/SSE event) — the row above is what that dashboard would poll/read.
  return NextResponse.json({ ok: true, id: call.id });
}

module.exports = { POST };
