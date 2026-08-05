const { NextResponse } = require("next/server");
const crypto = require("crypto");
const { buildGoogleAuthUrl } = require("@/lib/google-oauth");

async function GET() {
  const clientId = (process.env.GOOGLE_CLIENT_ID || "").trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || "").trim();

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      {
        error:
          "Google sign-in isn't configured yet. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables.",
      },
      { status: 500 }
    );
  }

  const state = crypto.randomBytes(16).toString("hex");
  const response = NextResponse.redirect(buildGoogleAuthUrl(state));
  response.cookies.set("alphay_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });
  return response;
}

module.exports = { GET };
