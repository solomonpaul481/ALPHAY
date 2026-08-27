const { NextResponse } = require("next/server");
const crypto = require("crypto");
const { db } = require("@/lib/db");
const { getSession } = require("@/lib/get-session");
const { SESSION_COOKIE, SESSION_TTL_SECONDS, signSessionToken } = require("@/lib/session");

async function GET(request, { params }) {
  const { restaurantId } = params;

  let session = await getSession(restaurantId);
  let sessionTokenToSet = null;

  if (!session) {
    const restaurant = await db.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const tableNumber = searchParams.get("table") || "12";

    let table = await db.diningTable.findUnique({
      where: { restaurantId_number: { restaurantId, number: String(tableNumber).trim() } },
    });
    if (!table) {
      table = await db.diningTable
        .create({
          data: { restaurantId, number: String(tableNumber).trim() },
        })
        .catch(() => null);
    }

    if (table) {
      let activeSession = await db.customerSession.findFirst({
        where: {
          restaurantId,
          tableId: table.id,
          endedAt: null,
          status: { in: ["ACTIVE", "BILL_REQUESTED", "BILL_SENT"] },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!activeSession) {
        activeSession = await db.customerSession.create({
          data: {
            restaurantId,
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
        restaurantId,
        tableId: table.id,
      });

      session = {
        ...activeSession,
        table,
        restaurant,
      };
    }
  }

  const items = await db.menuItem.findMany({
    where: { restaurantId },
    include: { category: true },
    orderBy: [{ categoryId: "asc" }, { sortOrder: "asc" }],
  });

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
  const recommended = items.filter((i) => i.isRecommended && i.isAvailable).map(shape);
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
    const cat = i.category || { isVeg: true, isNonVeg: true };
    const isBoth = (cat.isVeg === false && cat.isNonVeg === false) || (cat.isVeg === true && cat.isNonVeg === true);
    if (isBoth) return true;
    if (cat.isVeg) return true;
    return i.isVeg;
  });

  const nonVegItems = items.filter((i) => {
    const cat = i.category || { isVeg: true, isNonVeg: true };
    const isBoth = (cat.isVeg === false && cat.isNonVeg === false) || (cat.isVeg === true && cat.isNonVeg === true);
    if (isBoth) return true;
    if (cat.isNonVeg) return true;
    return !i.isVeg;
  });

  const veg = groupByCategory(vegItems);
  const nonVeg = groupByCategory(nonVegItems);

  const response = NextResponse.json({
    tableNumber: session?.table?.number || "12",
    restaurantName: session?.restaurant?.name || "ALPHAY",
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
