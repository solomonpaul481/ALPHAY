const { NextResponse } = require("next/server");
const bcrypt = require("bcryptjs");
const { db } = require("@/lib/db");

async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    const code = (body.code || "").trim();
    const newPassword = body.newPassword || "";

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "Email, verification code, and new password are required." }, { status: 400 });
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: "Password must be at least 4 characters long." }, { status: 400 });
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
      return NextResponse.json({ error: "Invalid or expired verification session." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db.manager.update({
      where: { id: manager.id },
      data: {
        passwordHash,
        resetCode: null,
        resetCodeExpiresAt: null,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Password updated successfully! You can now log in with your new password.",
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

module.exports = { POST };
