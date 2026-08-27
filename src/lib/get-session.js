const { cookies } = require("next/headers");
const { db } = require("./db");
const { SESSION_COOKIE, verifySessionToken } = require("./session");

/**
 * Resolves the caller's verified table session for a given restaurant.
 * Returns null if there's no cookie, the token is invalid/expired, the
 * token's restaurant doesn't match the route, or the session row was
 * deleted/expired server-side.
 */
async function getSession(restaurantId) {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload || !payload.sessionId) return null;

  const session = await db.customerSession.findUnique({
    where: { id: payload.sessionId },
    include: { table: true, restaurant: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) return null;
  if (session.endedAt || session.status === "COMPLETED" || session.status === "CLOSED") return null;

  // Validate restaurant match by ID or case-insensitive name
  if (restaurantId) {
    const target = decodeURIComponent(restaurantId).trim().toLowerCase();
    const matchesId = session.restaurantId.toLowerCase() === target;
    const matchesName = session.restaurant?.name?.toLowerCase() === target;
    if (!matchesId && !matchesName) return null;
  }

  return session;
}

module.exports = { getSession };

