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
  const { tableNumber, latitude, longitude } = body;

  if (!tableNumber || !isValidCoordinate(latitude, longitude)) {
    return NextResponse.json(
      { error: "Table number and valid location coordinates are required." },
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
      { error: "We couldn't find that table number. Please check and try again." },
      { status: 404 }
    );
  }

  const geoResult = isWithinGeofence(latitude, longitude, restaurant);
  if (!geoResult.withinRange) {
    return NextResponse.json(
      {
        error: `You are currently ${geoResult.formattedDistance} away from ${restaurant.name}. You must be within ${geoResult.formattedAllowedRadius} of the restaurant to place an order.`,
        outOfRange: true,
        restaurantName: restaurant.name,
        distanceMeters: geoResult.distanceMeters,
        formattedDistance: geoResult.formattedDistance,
        allowedRadiusMeters: geoResult.allowedRadiusMeters,
        formattedAllowedRadius: geoResult.formattedAllowedRadius,
      },
      { status: 403 }
    );
  }

  const sessionToken = crypto.randomUUID();
  const session = await db.customerSession.create({
    data: {
      restaurantId,
      tableId: table.id,
      token: sessionToken,
      latitude,
      longitude,
      distanceMeters: geoResult.distanceMeters,
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
    table: { number: table.number },
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
