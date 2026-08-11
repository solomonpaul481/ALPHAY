const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { ADMIN_COOKIE, ADMIN_TTL_SECONDS, signAdminToken } = require("@/lib/admin-auth");

function appUrl(path) {
  let base = process.env.APP_URL;
  if (!base && process.env.VERCEL_URL) {
    base = `https://${process.env.VERCEL_URL}`;
  }
  if (!base) {
    base = "http://localhost:3000";
  }
  base = base.trim().replace(/\/+$/, "");
  const formattedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${formattedPath}`;
}

async function handleLogin() {
  const admin = await db.adminUser.upsert({
    where: { email: "admin@alphay.demo" },
    update: { name: "Platform Admin" },
    create: {
      googleId: "demo-admin-id",
      email: "admin@alphay.demo",
      name: "Platform Admin",
      avatarUrl: null,
    },
  });

  const token = signAdminToken({ adminId: admin.id });
  const response = NextResponse.redirect(appUrl("/admin/dashboard"));
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ADMIN_TTL_SECONDS,
    path: "/",
  });
  return response;
}

async function GET() {
  return handleLogin();
}

async function POST() {
  return handleLogin();
}

module.exports = { GET, POST };
