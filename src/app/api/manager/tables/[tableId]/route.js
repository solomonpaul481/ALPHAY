const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");

async function PATCH(request, { params }) {
  const manager = await getManagerSession();
  if (!manager) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const table = await db.diningTable.findUnique({ where: { id: params.tableId } });
  if (!table || table.restaurantId !== manager.restaurantId) {
    return NextResponse.json({ error: "Table not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const number = (body.number || "").trim();
  if (!number) return NextResponse.json({ error: "Table number is required." }, { status: 400 });

  try {
    const updated = await db.diningTable.update({ where: { id: table.id }, data: { number } });
    return NextResponse.json({ ok: true, table: updated });
  } catch (err) {
    return NextResponse.json({ error: "That table number already exists." }, { status: 409 });
  }
}

async function DELETE(request, { params }) {
  const manager = await getManagerSession();
  if (!manager) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const table = await db.diningTable.findUnique({ where: { id: params.tableId } });
  if (!table || table.restaurantId !== manager.restaurantId) {
    return NextResponse.json({ error: "Table not found." }, { status: 404 });
  }

  await db.diningTable.delete({ where: { id: table.id } });
  return NextResponse.json({ ok: true });
}

module.exports = { PATCH, DELETE };
