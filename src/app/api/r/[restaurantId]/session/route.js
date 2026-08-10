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
  let { tableNumber, latitude, longitude, action, sessionId } = body;

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

  const table = await db.diningTable.findUnique({
    where: { restaurantId_number: { restaurantId, number: String(tableNumber).trim() } },
  });
  if (!table) {
    return NextResponse.json(
      { error: "We couldn't find that table number. Please check the table number and try again." },
      { status: 404 }
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

  // Require valid GPS coordinates from customer device for creating a new session
  if (!isValidCoordinate(latitude, longitude)) {
    return NextResponse.json(
      { error: "Location permission is required to verify you are within the restaurant's ordering radius." },
      { status: 400 }
    );
  }

  const geoResult = isWithinGeofence(latitude, longitude, restaurant);

  if (!geoResult.withinRange) {
    return NextResponse.json(
      {
        error: `You are too far from ${restaurant.name}. You are currently ${geoResult.formattedDistance} away, but ordering is only permitted within ${geoResult.formattedAllowedRadius} (${geoResult.allowedRadiusMeters}m).`,
        distanceMeters: geoResult.distanceMeters,
        allowedRadiusMeters: geoResult.allowedRadiusMeters,
      },
      { status: 403 }
    );
  }

  const distanceMeters = geoResult.distanceMeters ?? 0;

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
      latitude,
      longitude,
      distanceMeters,
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
