const jwt = require("jsonwebtoken");
const { cookies } = require("next/headers");
const { db } = require("./db");

const MANAGER_COOKIE = "alphay_manager_session";
const MANAGER_TTL_SECONDS = 60 * 60 * 12; // 12 hours — a work shift

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set. Add it to your .env file.");
  return secret;
}

function signManagerToken({ managerId, restaurantId }) {
  return jwt.sign({ managerId, restaurantId, scope: "manager" }, getSecret(), {
    expiresIn: MANAGER_TTL_SECONDS,
  });
}

function verifyManagerToken(token) {
  try {
    const payload = jwt.verify(token, getSecret());
    return payload.scope === "manager" ? payload : null;
  } catch (err) {
    return null;
  }
}

/**
 * Resolves the logged-in manager (with their restaurant) from the request
 * cookie. Every manager route is implicitly scoped to this restaurant —
 * there's no separate restaurantId to check against, since a manager only
 * ever has one.
 */
async function getManagerSession() {
  const token = cookies().get(MANAGER_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyManagerToken(token);
  if (!payload) return null;

  const manager = await db.manager.findUnique({
    where: { id: payload.managerId },
    include: { restaurant: true },
  });
  if (!manager) return null;
  return manager;
}

module.exports = {
  MANAGER_COOKIE,
  MANAGER_TTL_SECONDS,
  signManagerToken,
  verifyManagerToken,
  getManagerSession,
};
