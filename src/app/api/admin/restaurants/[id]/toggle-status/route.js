const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getAdminSession } = require("@/lib/admin-auth");

async function POST(request, { params }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurant = await db.restaurant.findUnique({ where: { id: params.id } });
  if (!restaurant) return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });

  const newStatus = restaurant.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  const updated = await db.restaurant.update({
    where: { id: restaurant.id },
    data: { status: newStatus },
  });

  return NextResponse.json({ ok: true, status: updated.status });
}

module.exports = { POST };
