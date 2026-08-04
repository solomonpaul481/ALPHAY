const { NextResponse } = require("next/server");
const { ADMIN_COOKIE } = require("@/lib/admin-auth");

async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ADMIN_COOKIE);
  return response;
}

module.exports = { POST };
