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
  let { tableNumber, latitude, longitude } = body;

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

  // Fallback to restaurant coordinates if client coordinates are not provided or invalid
  if (!isValidCoordinate(latitude, longitude)) {
    latitude = restaurant.latitude;
    longitude = restaurant.longitude;
  }

  const geoResult = isWithinGeofence(latitude, longitude, restaurant);
  // Calculate distance for session logging
  const distanceMeters = geoResult.distanceMeters ?? 0;

  const sessionToken = crypto.randomUUID();
  const session = await db.customerSession.create({
    data: {
      restaurantId,
      tableId: table.id,
      token: sessionToken,
      latitude,
      longitude,
      distanceMeters,
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

