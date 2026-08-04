const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getAdminSession } = require("@/lib/admin-auth");
const { MANAGER_COOKIE, MANAGER_TTL_SECONDS, signManagerToken } = require("@/lib/manager-auth");

async function POST(request, { params }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const manager = await db.manager.findFirst({ where: { restaurantId: params.id } });
  if (!manager) {
    return NextResponse.json({ error: "This restaurant has no manager account yet." }, { status: 404 });
  }

  const token = signManagerToken({ managerId: manager.id, restaurantId: manager.restaurantId });
  const response = NextResponse.json({ ok: true });
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
