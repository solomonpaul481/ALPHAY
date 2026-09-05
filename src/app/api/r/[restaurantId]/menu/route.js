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
  const rawTable = searchParams.get("table");
  const isParcelReq =
    searchParams.get("type") === "parcel" ||
    searchParams.get("parcel") === "true" ||
    String(rawTable).trim().toUpperCase() === "PARCEL" ||
    String(rawTable).trim().toUpperCase() === "P" ||
    Boolean(session?.table?.isParcelCounter);

  const tableNumber = isParcelReq ? "PARCEL" : (rawTable || "12");

  let table = await db.diningTable.findUnique({
    where: { restaurantId_number: { restaurantId: resolvedRestaurantId, number: String(tableNumber).trim() } },
  });
  if (!table) {
    table = await db.diningTable
      .create({
        data: {
          restaurantId: resolvedRestaurantId,
          number: String(tableNumber).trim(),
          isParcelCounter: isParcelReq,
        },
      })
      .catch(() => null);
  } else if (isParcelReq && !table.isParcelCounter) {
    table = await db.diningTable.update({
      where: { id: table.id },
      data: { isParcelCounter: true },
    }).catch(() => table);
  }

  if (table) {
    let activeSession = null;
    if (session && session.tableId === table.id) {
      activeSession = session;
    } else if (!isParcelReq) {
      activeSession = await db.customerSession.findFirst({
        where: {
          restaurantId: resolvedRestaurantId,
          tableId: table.id,
          endedAt: null,
          status: { in: ["ACTIVE", "BILL_REQUESTED", "BILL_SENT"] },
        },
        orderBy: { createdAt: "desc" },
      });
    }

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

  // Pure vegetarian items
  const vegItems = items.filter((i) => i.isVeg);
  // Non-veg menu includes non-veg dishes PLUS general accompaniments (breads, drinks, desserts)
  const nonVegItems = items.filter((i) => {
    if (!i.isVeg) return true;
    const catName = (i.category?.name || "").toLowerCase();
    return (
      catName.includes("bread") ||
      catName.includes("naan") ||
      catName.includes("beverage") ||
      catName.includes("drink") ||
      catName.includes("dessert") ||
      catName.includes("soup") ||
      catName.includes("rice")
    );
  });

  const veg = groupByCategory(vegItems.length > 0 ? vegItems : items);
  const nonVeg = groupByCategory(nonVegItems.length > 0 ? nonVegItems : items);

  const response = NextResponse.json({
    tableNumber: isParcelReq ? "PARCEL" : (session?.table?.number || tableNumber),
    isParcel: Boolean(isParcelReq),
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
