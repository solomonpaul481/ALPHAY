const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");

async function GET() {
  const manager = await getManagerSession();
  if (!manager) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const tables = await db.diningTable.findMany({
    where: { restaurantId: manager.restaurantId },
    orderBy: { number: "asc" },
  });
  return NextResponse.json({ tables, restaurantId: manager.restaurantId });
}

async function POST(request) {
  const manager = await getManagerSession();
  if (!manager) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const number = (body.number || "").trim();
  if (!number) return NextResponse.json({ error: "Table number is required." }, { status: 400 });

  const rawCap = body.capacity || body.size;
  const capacity = rawCap ? parseInt(String(rawCap).replace(/\D/g, ""), 10) : 4;

  try {
    const table = await db.diningTable.create({
      data: {
        restaurantId: manager.restaurantId,
        number,
        capacity: isNaN(capacity) || capacity <= 0 ? 4 : capacity,
        isParcelCounter: Boolean(body.isParcelCounter),
      },
    });
    return NextResponse.json({ ok: true, table });
  } catch (err) {
    return NextResponse.json({ error: "That table number already exists." }, { status: 409 });
  }
}

module.exports = { GET, POST };
