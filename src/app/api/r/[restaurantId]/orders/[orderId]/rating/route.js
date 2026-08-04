const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getSession } = require("@/lib/get-session");

async function POST(request, { params }) {
  const { restaurantId, orderId } = params;

  const session = await getSession(restaurantId);
  if (!session) {
    return NextResponse.json({ error: "session_required" }, { status: 401 });
  }

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.restaurantId !== restaurantId || order.sessionId !== session.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const stars = parseInt(body.stars, 10);
  if (!stars || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "Please provide a rating from 1 to 5." }, { status: 400 });
  }

  const rating = await db.rating.upsert({
    where: { orderId },
    create: { orderId, stars, comment: body.comment?.slice(0, 500) || null },
    update: { stars, comment: body.comment?.slice(0, 500) || null },
  });

  return NextResponse.json({ ok: true, rating });
}

module.exports = { POST };
