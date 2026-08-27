const { db } = require("./db");

/**
 * Robust restaurant resolver that matches by:
 * 1. Exact CUID `id`
 * 2. Case-insensitive `name` (e.g. "Restaurant", "restaurant", "sapphire", "cafe")
 * 3. Fallback to the latest active restaurant
 */
async function resolveRestaurant(restaurantId) {
  if (!restaurantId) return null;

  // 1. Try finding by ID
  let restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
  }).catch(() => null);

  if (restaurant) return restaurant;

  // 2. Try finding by Name (case-insensitive)
  const decoded = decodeURIComponent(restaurantId).trim();
  restaurant = await db.restaurant.findFirst({
    where: {
      name: { equals: decoded, mode: "insensitive" },
    },
  }).catch(() => null);

  if (restaurant) return restaurant;

  // 3. Fallback: Return first active restaurant
  restaurant = await db.restaurant.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  }).catch(() => null);

  return restaurant;
}

module.exports = { resolveRestaurant };
