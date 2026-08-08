const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getAdminSession } = require("@/lib/admin-auth");

async function POST(request, { params }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = params;
  const restaurant = await db.restaurant.findUnique({ where: { id } });
  if (!restaurant) return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });

  let body = {};
  try {
    body = await request.json();
  } catch (e) {
    // Body is optional; if omitted, toggle status
  }

  let newStatus;
  if (body.status) {
    const s = String(body.status).toUpperCase();
    newStatus = (s === "DONE" || s === "PAID") ? "DONE" : "PENDING";
  } else {
    // Toggle current status: if DONE/PAID/ACTIVE -> PENDING, else -> DONE
    const isCurrentlyDone = ["DONE", "PAID", "ACTIVE"].includes(restaurant.billingStatus);
    newStatus = isCurrentlyDone ? "PENDING" : "DONE";
  }

  const updateData = { billingStatus: newStatus };
  if (newStatus === "DONE") {
    updateData.lastSettledAt = new Date();
  }

  const updated = await db.restaurant.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ ok: true, billingStatus: updated.billingStatus });
}

module.exports = { POST };
