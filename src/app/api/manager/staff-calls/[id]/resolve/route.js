const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");

async function POST(request, { params }) {
  const manager = await getManagerSession();
  if (!manager) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const call = await db.staffCallRequest.findUnique({ where: { id: params.id } });
  if (!call || call.restaurantId !== manager.restaurantId) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  await db.staffCallRequest.update({ where: { id: call.id }, data: { status: "RESOLVED" } });
  return NextResponse.json({ ok: true });
}

module.exports = { POST };
