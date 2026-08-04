const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");

async function assertOwnership(manager, itemId) {
  const item = await db.menuItem.findUnique({ where: { id: itemId } });
  if (!item || item.restaurantId !== manager.restaurantId) return null;
  return item;
}

async function PATCH(request, { params }) {
  const manager = await getManagerSession();
  if (!manager) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const item = await assertOwnership(manager, params.itemId);
  if (!item) return NextResponse.json({ error: "Item not found." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const data = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.price !== undefined) data.price = parseFloat(body.price);
  if (body.prepTimeMinutes !== undefined) data.prepTimeMinutes = parseInt(body.prepTimeMinutes, 10);
  if (body.isAvailable !== undefined) data.isAvailable = Boolean(body.isAvailable);
  if (body.isVeg !== undefined) data.isVeg = Boolean(body.isVeg);

  const updated = await db.menuItem.update({ where: { id: item.id }, data });
  return NextResponse.json({ ok: true, item: updated });
}

async function DELETE(request, { params }) {
  const manager = await getManagerSession();
  if (!manager) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const item = await assertOwnership(manager, params.itemId);
  if (!item) return NextResponse.json({ error: "Item not found." }, { status: 404 });

  await db.menuItem.delete({ where: { id: item.id } });
  return NextResponse.json({ ok: true });
}

module.exports = { PATCH, DELETE };
