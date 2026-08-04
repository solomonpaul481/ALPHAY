const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { exchangeCodeForTokens, fetchGoogleProfile } = require("@/lib/google-oauth");
const { ADMIN_COOKIE, ADMIN_TTL_SECONDS, signAdminToken } = require("@/lib/admin-auth");

function appUrl(path) {
  return `${process.env.APP_URL || "http://localhost:3000"}${path}`;
}

async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = request.cookies.get("alphay_oauth_state")?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(appUrl("/admin/login?error=invalid_state"));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile = await fetchGoogleProfile(tokens.access_token);

    // Optional allowlist — set ADMIN_ALLOWED_EMAILS in .env as a comma
    // separated list to restrict who can ever become an ALPHAY operator.
    // Leave unset during local development to allow any Google account.
    const allowlist = (process.env.ADMIN_ALLOWED_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (allowlist.length > 0 && !allowlist.includes((profile.email || "").toLowerCase())) {
      return NextResponse.redirect(appUrl("/admin/login?error=not_allowed"));
    }

    const admin = await db.adminUser.upsert({
      where: { googleId: profile.sub },
      update: { name: profile.name, avatarUrl: profile.picture, email: profile.email },
      create: {
        googleId: profile.sub,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.picture,
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
    response.cookies.delete("alphay_oauth_state");
    return response;
  } catch (err) {
  console.error("Google sign-in failed:", err);

  return NextResponse.json(
    {
      error: err.message,
      stack: err.stack,
    },
    { status: 500 }
  );
}
}

module.exports = { GET };
