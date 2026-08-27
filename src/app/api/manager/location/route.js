const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");
const { isValidCoordinate } = require("@/lib/geolocation");

async function GET() {
  const manager = await getManagerSession();
  if (!manager) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurant = await db.restaurant.findUnique({
    where: { id: manager.restaurantId },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      geofenceRadiusMeters: true,
    },
  });

  if (!restaurant) return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  return NextResponse.json(restaurant);
}

async function PATCH(request) {
  const manager = await getManagerSession();
  if (!manager) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { latitude, longitude, geofenceRadiusMeters } = body;

  const latNum = parseFloat(latitude);
  const lngNum = parseFloat(longitude);
  const radiusNum = parseInt(geofenceRadiusMeters, 10);

  if (!isValidCoordinate(latNum, lngNum)) {
    return NextResponse.json(
      { error: "Valid GPS coordinates (Latitude between -90 and 90, Longitude between -180 and 180) are required." },
      { status: 400 }
    );
  }

  if (isNaN(radiusNum) || radiusNum <= 0) {
    return NextResponse.json(
      { error: "Geofence radius must be a positive number of meters." },
      { status: 400 }
    );
  }

  const updated = await db.restaurant.update({
    where: { id: manager.restaurantId },
    data: {
      latitude: latNum,
      longitude: lngNum,
      geofenceRadiusMeters: radiusNum,
    },
  });

  return NextResponse.json({
    ok: true,
    restaurant: {
      id: updated.id,
      latitude: updated.latitude,
      longitude: updated.longitude,
      geofenceRadiusMeters: updated.geofenceRadiusMeters,
    },
  });
}

module.exports = { GET, PATCH };
