const jwt = require("jsonwebtoken");

const SESSION_COOKIE = "alphay_session";
const SESSION_TTL_SECONDS = 60 * 60 * 4; // 4 hours — a typical dine-in visit

function getSecret() {
  const secret = process.env.SESSION_SECRET || "alphay_session_jwt_secret_key_2026_secure";
  return secret;
}


/**
 * Signs a short-lived token binding this browser to a specific
 * restaurant + table + verified session row in the DB.
 */
function signSessionToken({ sessionId, restaurantId, tableId }) {
  return jwt.sign({ sessionId, restaurantId, tableId }, getSecret(), {
    expiresIn: SESSION_TTL_SECONDS,
  });
}

function verifySessionToken(token) {
  try {
    return jwt.verify(token, getSecret());
  } catch (err) {
    return null;
  }
}

module.exports = {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSessionToken,
  verifySessionToken,
};
