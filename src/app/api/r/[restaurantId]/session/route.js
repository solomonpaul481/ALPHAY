const { NextResponse } = require("next/server");
const crypto = require("crypto");
const { db } = require("@/lib/db");
const { resolveRestaurant } = require("@/lib/resolve-restaurant");
const { isWithinGeofence, isValidCoordinate } = require("@/lib/geolocation");
const {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSessionToken,
} = require("@/lib/session");

async function POST(request, { params }) {
  const { restaurantId } = params;
  const body = await request.json().catch(() => ({}));
  let { tableNumber, latitude, longitude, accuracy, action, sessionId, bypassGeofence } = body;

  if (!tableNumber || !String(tableNumber).trim()) {
    return NextResponse.json(
      { error: "Table number is required." },
      { status: 400 }
    );
  }

  const restaurant = await resolveRestaurant(restaurantId);
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }
  const resolvedRestaurantId = restaurant.id;

  if (restaurant.status === "SUSPENDED") {
    return NextResponse.json(
      { error: "Online ordering is temporarily unavailable here. Please order with staff directly." },
      { status: 403 }
    );
  }

  let table = await db.diningTable.findUnique({
    where: { restaurantId_number: { restaurantId: resolvedRestaurantId, number: String(tableNumber).trim() } },
  });
  if (!table) {
    table = await db.diningTable
      .create({
        data: {
          restaurantId: resolvedRestaurantId,
          number: String(tableNumber).trim(),
        },
      })
      .catch(() => null);
  }
  if (!table) {
    return NextResponse.json(
      { error: "Unable to initialize table number. Please try again." },
      { status: 500 }
    );
  }

  // Check for any ongoing active dine-in session on this table that has not been completed / paid
  let existingSession = null;
  if (sessionId) {
    existingSession = await db.customerSession.findUnique({
      where: { id: sessionId },
      include: {
        table: true,
        orders: { include: { items: true } },
      },
    });
    if (existingSession && (existingSession.endedAt || existingSession.status === "COMPLETED" || existingSession.status === "CLOSED")) {
      existingSession = null;
    }
  }

  if (!existingSession) {
    existingSession = await db.customerSession.findFirst({
      where: {
        restaurantId: resolvedRestaurantId,
        tableId: table.id,
        endedAt: null,
        status: { in: ["ACTIVE", "BILL_REQUESTED", "BILL_SENT"] },
      },
      include: {
        table: true,
        orders: { include: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // If ongoing dine-in session exists on this table and caller didn't force a brand new session
  if (existingSession && action !== "force_new") {
    const token = signSessionToken({
      sessionId: existingSession.id,
      restaurantId: resolvedRestaurantId,
      tableId: table.id,
    });

    let totalAmount = 0;
    let totalItemsCount = 0;
    (existingSession.orders || []).forEach((ord) => {
      totalAmount += ord.total;
      (ord.items || []).forEach((it) => {
        totalItemsCount += it.quantity;
      });
    });

    const response = NextResponse.json({
      ok: true,
      joined: true,
      hasActiveSession: true,
      sessionId: existingSession.id,
      orderCount: existingSession.orders?.length || 0,
      totalItemsCount,
      totalAmount: Math.round(totalAmount * 100) / 100,
      status: existingSession.status,
      table: { number: table.number, id: table.id },
      restaurant: { name: restaurant.name, logoUrl: restaurant.logoUrl },
    });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: SESSION_TTL_SECONDS,
      path: "/",
    });
    return response;
  }

  // Validate and record geofence location
  const parsedLat = typeof latitude === "number" ? latitude : parseFloat(latitude);
  const parsedLng = typeof longitude === "number" ? longitude : parseFloat(longitude);
  const parsedAccuracy = typeof accuracy === "number" ? accuracy : parseFloat(accuracy) || 0;
  const validCoords = isValidCoordinate(parsedLat, parsedLng);
  let distanceMeters = 0;

  if (validCoords) {
    const geoResult = isWithinGeofence(parsedLat, parsedLng, restaurant, parsedAccuracy);
    distanceMeters = geoResult.distanceMeters ?? 0;
  }

  const effectiveLat = validCoords ? parsedLat : (restaurant.latitude ?? 17.4239);
  const effectiveLng = validCoords ? parsedLng : (restaurant.longitude ?? 78.4738);

  // Close any stale active sessions for this table before starting a new one
  await db.customerSession.updateMany({
    where: {
      restaurantId: resolvedRestaurantId,
      tableId: table.id,
      endedAt: null,
      status: { in: ["ACTIVE", "BILL_REQUESTED", "BILL_SENT"] },
    },
    data: {
      status: "CLOSED",
      endedAt: new Date(),
    },
  });

  // Create Brand New Customer Session
  const sessionToken = crypto.randomUUID();
  const session = await db.customerSession.create({
    data: {
      restaurantId: resolvedRestaurantId,
      tableId: table.id,
      token: sessionToken,
      latitude: effectiveLat,
      longitude: effectiveLng,
      distanceMeters: Number(distanceMeters) || 0,
      status: "ACTIVE",
      expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
    },
  });

  const token = signSessionToken({
    sessionId: session.id,
    restaurantId: resolvedRestaurantId,
    tableId: table.id,
  });

  const response = NextResponse.json({
    ok: true,
    joined: false,
    hasActiveSession: false,
    orderCount: 0,
    sessionId: session.id,
    table: { number: table.number, id: table.id },
    restaurant: { name: restaurant.name, logoUrl: restaurant.logoUrl },
  });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
  return response;

}

module.exports = { POST };

