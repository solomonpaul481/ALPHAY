const { NextResponse } = require("next/server");
const { MANAGER_COOKIE } = require("@/lib/manager-auth");

async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(MANAGER_COOKIE);
  return response;
}

module.exports = { POST };
