const { NextResponse } = require("next/server");
const crypto = require("crypto");
const { db } = require("@/lib/db");
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

  const restaurant = await db.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }
  if (restaurant.status === "SUSPENDED") {
    return NextResponse.json(
      { error: "Online ordering is temporarily unavailable here. Please order with staff directly." },
      { status: 403 }
    );
  }

  let table = await db.diningTable.findUnique({
    where: { restaurantId_number: { restaurantId, number: String(tableNumber).trim() } },
  });
  if (!table) {
    table = await db.diningTable
      .create({
        data: {
          restaurantId,
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

  // Handle Joining Existing Session
  if (action === "join") {
    let targetSession = null;
    if (sessionId) {
      targetSession = await db.customerSession.findUnique({ where: { id: sessionId } });
    }
    if (!targetSession) {
      targetSession = await db.customerSession.findFirst({
        where: {
          restaurantId,
          tableId: table.id,
          endedAt: null,
          status: { in: ["ACTIVE", "BILL_REQUESTED", "BILL_SENT"] },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (targetSession) {
      const token = signSessionToken({
        sessionId: targetSession.id,
        restaurantId,
        tableId: table.id,
      });

      const response = NextResponse.json({
        ok: true,
        joined: true,
        sessionId: targetSession.id,
        table: { number: table.number, id: table.id },
        restaurant: { name: restaurant.name, logoUrl: restaurant.logoUrl },
      });
      response.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_TTL_SECONDS,
        path: "/",
      });
      return response;
    }
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


  // Close any existing active sessions for this table before starting a new one
  await db.customerSession.updateMany({
    where: {
      restaurantId,
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
      restaurantId,
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
    restaurantId,
    tableId: table.id,
  });

  const response = NextResponse.json({
    ok: true,
    joined: false,
    sessionId: session.id,
    table: { number: table.number, id: table.id },
    restaurant: { name: restaurant.name, logoUrl: restaurant.logoUrl },
  });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
  return response;
}

module.exports = { POST };

