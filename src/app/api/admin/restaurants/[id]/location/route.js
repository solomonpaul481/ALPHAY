const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getAdminSession } = require("@/lib/admin-auth");
const { isValidCoordinate } = require("@/lib/geolocation");

async function PATCH(request, { params }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = params;
  const restaurant = await db.restaurant.findUnique({ where: { id } });
  if (!restaurant) return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });

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
    where: { id },
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

module.exports = { PATCH };
