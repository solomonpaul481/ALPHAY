const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");

async function PATCH(request, { params }) {
  const manager = await getManagerSession();
  if (!manager) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const member = await db.staffMember.findUnique({ where: { id: params.staffId } });
  if (!member || member.restaurantId !== manager.restaurantId) {
    return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const data = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.department !== undefined) data.department = body.department;
  if (body.salary !== undefined) data.salary = parseFloat(body.salary);

  const updated = await db.staffMember.update({ where: { id: member.id }, data });
  return NextResponse.json({ ok: true, member: updated });
}

async function DELETE(request, { params }) {
  const manager = await getManagerSession();
  if (!manager) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const member = await db.staffMember.findUnique({ where: { id: params.staffId } });
  if (!member || member.restaurantId !== manager.restaurantId) {
    return NextResponse.json({ error: "Staff member not found." }, { status: 404 });
  }

  await db.staffMember.delete({ where: { id: member.id } });
  return NextResponse.json({ ok: true });
}

module.exports = { PATCH, DELETE };
