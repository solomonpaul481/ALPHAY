const { NextResponse } = require("next/server");
const bcrypt = require("bcryptjs");
const { db } = require("@/lib/db");
const { MANAGER_COOKIE, MANAGER_TTL_SECONDS, signManagerToken } = require("@/lib/manager-auth");

async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const manager = await db.manager.findUnique({ where: { email }, include: { restaurant: true } });
  if (!manager) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, manager.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (manager.restaurant.status === "SUSPENDED") {
    return NextResponse.json(
      { error: "This restaurant's ALPHAY account is currently suspended. Contact ALPHAY support." },
      { status: 403 }
    );
  }

  const token = signManagerToken({ managerId: manager.id, restaurantId: manager.restaurantId });
  const response = NextResponse.json({
    ok: true,
    restaurantId: manager.restaurantId,
    restaurantName: manager.restaurant.name,
  });
  response.cookies.set(MANAGER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MANAGER_TTL_SECONDS,
    path: "/",
  });
  return response;
}

module.exports = { POST };
