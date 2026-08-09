const { NextResponse } = require("next/server");
const { getAdminSession } = require("@/lib/admin-auth");

async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      avatarUrl: admin.avatarUrl,
    },
  });
}

module.exports = { GET };
