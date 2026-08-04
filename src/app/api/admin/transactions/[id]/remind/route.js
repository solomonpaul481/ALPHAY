const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getAdminSession } = require("@/lib/admin-auth");

async function POST(request, { params }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurant = await db.restaurant.findUnique({ where: { id: params.id } });
  if (!restaurant) return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });

  // This is where a real reminder email/SMS integration (e.g. Postmark,
  // Twilio) would be triggered. For now we just log it as sent.
  const updated = await db.restaurant.update({
    where: { id: restaurant.id },
    data: { lastReminderSentAt: new Date() },
  });

  return NextResponse.json({ ok: true, lastReminderSentAt: updated.lastReminderSentAt });
}

module.exports = { POST };
