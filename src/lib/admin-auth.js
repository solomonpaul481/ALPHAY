const jwt = require("jsonwebtoken");
const { cookies } = require("next/headers");
const { db } = require("./db");

const ADMIN_COOKIE = "alphay_admin_session";
const ADMIN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set. Add it to your .env file.");
  return secret;
}

function signAdminToken({ adminId }) {
  return jwt.sign({ adminId, scope: "admin" }, getSecret(), { expiresIn: ADMIN_TTL_SECONDS });
}

function verifyAdminToken(token) {
  try {
    const payload = jwt.verify(token, getSecret());
    return payload.scope === "admin" ? payload : null;
  } catch (err) {
    return null;
  }
}

const ALLOWED_ADMIN_EMAIL = "solomonpaul481@gmail.com";

async function getAdminSession() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyAdminToken(token);
  if (!payload) return null;
  const admin = await db.adminUser.findUnique({ where: { id: payload.adminId } });
  if (!admin || admin.email.toLowerCase() !== ALLOWED_ADMIN_EMAIL) {
    return null;
  }
  return admin;
}

module.exports = {
  ADMIN_COOKIE,
  ADMIN_TTL_SECONDS,
  signAdminToken,
  verifyAdminToken,
  getAdminSession,
};
