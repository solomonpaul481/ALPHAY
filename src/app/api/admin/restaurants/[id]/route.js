const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getAdminSession } = require("@/lib/admin-auth");

async function DELETE(request, { params }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = params;

  const restaurant = await db.restaurant.findUnique({ where: { id } });
  if (!restaurant) return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });

  await db.$transaction([
    db.rating.deleteMany({ where: { order: { restaurantId: id } } }),
    db.payment.deleteMany({ where: { order: { restaurantId: id } } }),
    db.orderItem.deleteMany({ where: { order: { restaurantId: id } } }),
    db.order.deleteMany({ where: { restaurantId: id } }),
    db.customerSession.deleteMany({ where: { restaurantId: id } }),
    db.staffCallRequest.deleteMany({ where: { restaurantId: id } }),
    db.menuItem.deleteMany({ where: { restaurantId: id } }),
    db.category.deleteMany({ where: { restaurantId: id } }),
    db.diningTable.deleteMany({ where: { restaurantId: id } }),
    db.manager.deleteMany({ where: { restaurantId: id } }),
    db.staffMember.deleteMany({ where: { restaurantId: id } }),
    db.restaurant.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}

module.exports = { DELETE };
