const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");

async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    const code = (body.code || "").trim();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and verification code are required." }, { status: 400 });
    }

    const manager = await db.manager.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
      },
    });

    if (!manager) {
      return NextResponse.json({ error: "Manager account not found." }, { status: 404 });
    }

    if (
      !manager.resetCode ||
      manager.resetCode !== code ||
      !manager.resetCodeExpiresAt ||
      manager.resetCodeExpiresAt < new Date()
    ) {
      return NextResponse.json({ error: "Invalid or expired verification code. Please request a new code." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Code verified successfully." });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

module.exports = { POST };
