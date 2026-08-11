const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");

async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Please enter your registered email address." }, { status: 400 });
    }

    const manager = await db.manager.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
      },
    });

    if (!manager) {
      return NextResponse.json({ error: "No manager account found with this email address." }, { status: 404 });
    }

    // Generate 6-digit verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    await db.manager.update({
      where: { id: manager.id },
      data: { resetCode, resetCodeExpiresAt },
    });

    // Output demo code in response for instant testing & simulated email delivery
    return NextResponse.json({
      ok: true,
      message: `Verification code sent to ${email}.`,
      verificationCode: resetCode,
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

module.exports = { POST };
