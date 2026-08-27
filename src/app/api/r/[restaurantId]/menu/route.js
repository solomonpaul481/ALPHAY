const { NextResponse } = require("next/server");
const crypto = require("crypto");
const { db } = require("@/lib/db");
const { getSession } = require("@/lib/get-session");
const { resolveRestaurant } = require("@/lib/resolve-restaurant");
const { SESSION_COOKIE, SESSION_TTL_SECONDS, signSessionToken } = require("@/lib/session");

async function GET(request, { params }) {
  const { restaurantId } = params;

  // Resolve restaurant by ID or name (case-insensitive)
  const restaurant = await resolveRestaurant(restaurantId);
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  const resolvedRestaurantId = restaurant.id;
  let session = await getSession(resolvedRestaurantId);
  let sessionTokenToSet = null;

  const { searchParams } = new URL(request.url);
  const tableNumber = searchParams.get("table") || "12";

  let table = await db.diningTable.findUnique({
    where: { restaurantId_number: { restaurantId: resolvedRestaurantId, number: String(tableNumber).trim() } },
  });
  if (!table) {
    table = await db.diningTable
      .create({
        data: { restaurantId: resolvedRestaurantId, number: String(tableNumber).trim() },
      })
      .catch(() => null);
  }

  if (table) {
    let activeSession = await db.customerSession.findFirst({
      where: {
        restaurantId: resolvedRestaurantId,
        tableId: table.id,
        endedAt: null,
        status: { in: ["ACTIVE", "BILL_REQUESTED", "BILL_SENT"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!activeSession) {
      activeSession = await db.customerSession.create({
        data: {
          restaurantId: resolvedRestaurantId,
          tableId: table.id,
          token: crypto.randomUUID(),
          latitude: restaurant.latitude || 17.4239,
          longitude: restaurant.longitude || 78.4738,
          distanceMeters: 0,
          status: "ACTIVE",
          expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
        },
      });
    }

    sessionTokenToSet = signSessionToken({
      sessionId: activeSession.id,
      restaurantId: resolvedRestaurantId,
      tableId: table.id,
    });

    session = {
      ...activeSession,
      table,
      restaurant,
    };
  }

  // Fetch all menu items for this restaurant
  let items = await db.menuItem.findMany({
    where: { restaurantId: resolvedRestaurantId },
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }],
  });

  // If this restaurant has no items yet, fallback to any available menu items or clone starter items
  if (items.length === 0) {
    const templateItems = await db.menuItem.findMany({
      where: { isAvailable: true },
      include: { category: true },
      take: 12,
    });
    if (templateItems.length > 0) {
      items = templateItems;
    }
  }

  const shape = (i) => ({
    id: i.id,
    name: i.name,
    description: i.description || "",
    price: i.price,
    prepTimeMinutes: i.prepTimeMinutes,
    isVeg: i.isVeg,
    isAvailable: i.isAvailable,
    imageUrl: i.imageUrl,
    badges: i.badges ? i.badges.split(",") : [],
    category: i.category?.name || "General",
  });

  const todaysSpecial = items.filter((i) => i.isTodaysSpecial && i.isAvailable).map(shape);
  const recommended = items.filter((i) => (i.isRecommended || i.isPopular) && i.isAvailable).map(shape);
  const popular = items.filter((i) => i.isPopular && i.isAvailable).map(shape);

  const groupByCategory = (list) => {
    const grouped = {};
    for (const i of list) {
      const catName = i.category?.name || "General";
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push(shape(i));
    }
    return grouped;
  };

  const vegItems = items.filter((i) => {
    const cat = i.category;
    if (!cat) return i.isVeg;
    if (cat.isVeg) return true;
    if (!cat.isVeg && !cat.isNonVeg) return i.isVeg;
    return i.isVeg;
  });

  const nonVegItems = items.filter((i) => {
    const cat = i.category;
    if (!cat) return !i.isVeg;
    if (cat.isNonVeg) return true;
    if (!cat.isVeg && !cat.isNonVeg) return !i.isVeg;
    return !i.isVeg;
  });

  // Ensure items are accessible in both menus if general
  const veg = groupByCategory(vegItems.length > 0 ? vegItems : items.filter((i) => i.isVeg));
  const nonVeg = groupByCategory(nonVegItems.length > 0 ? nonVegItems : items.filter((i) => !i.isVeg));

  const response = NextResponse.json({
    tableNumber: session?.table?.number || tableNumber,
    restaurantName: restaurant.name || "ALPHAY",
    logoUrl: restaurant.logoUrl,
    todaysSpecial,
    recommended,
    popular,
    veg,
    nonVeg,
  });

  if (sessionTokenToSet) {
    response.cookies.set(SESSION_COOKIE, sessionTokenToSet, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: SESSION_TTL_SECONDS,
      path: "/",
    });
  }

  return response;
}

module.exports = { GET };
