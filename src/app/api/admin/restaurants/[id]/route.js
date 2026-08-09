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
  const { name, latitude, longitude, geofenceRadiusMeters, gstPercent, commissionPercent } = body;

  const cleanName = typeof name === "string" ? name.trim() : restaurant.name;
  if (!cleanName) {
    return NextResponse.json({ error: "Restaurant name cannot be empty." }, { status: 400 });
  }

  const latNum = latitude !== undefined && latitude !== null ? parseFloat(latitude) : restaurant.latitude;
  const lngNum = longitude !== undefined && longitude !== null ? parseFloat(longitude) : restaurant.longitude;

  if (!isValidCoordinate(latNum, lngNum)) {
    return NextResponse.json(
      { error: "Valid GPS coordinates (Latitude between -90 and 90, Longitude between -180 and 180) are required." },
      { status: 400 }
    );
  }

  const radiusNum = geofenceRadiusMeters !== undefined && geofenceRadiusMeters !== null
    ? parseInt(geofenceRadiusMeters, 10)
    : restaurant.geofenceRadiusMeters;

  if (isNaN(radiusNum) || radiusNum <= 0) {
    return NextResponse.json(
      { error: "Geofence radius must be a positive number of meters." },
      { status: 400 }
    );
  }

  const gstNum = gstPercent !== undefined && gstPercent !== null ? parseFloat(gstPercent) : restaurant.gstPercent;
  const commissionNum = commissionPercent !== undefined && commissionPercent !== null ? parseFloat(commissionPercent) : restaurant.commissionPercent;

  const updated = await db.restaurant.update({
    where: { id },
    data: {
      name: cleanName,
      latitude: latNum,
      longitude: lngNum,
      geofenceRadiusMeters: radiusNum,
      gstPercent: isNaN(gstNum) ? restaurant.gstPercent : gstNum,
      commissionPercent: isNaN(commissionNum) ? restaurant.commissionPercent : commissionNum,
    },
  });

  return NextResponse.json({
    ok: true,
    restaurant: updated,
  });
}

async function DELETE(request, { params }) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = params;

  const restaurant = await db.restaurant.findUnique({ where: { id } });
  if (!restaurant) return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });

  await db.$transaction([
    db.rating.deleteMany({ where: { order: { restaurantId: id } } }),
    db.payment.deleteMany({ where: { order: { restaurantId: id } } }),
    db.orderItem.deleteMany({ where: { order: { restaurantId: id } } }),
    db.order.deleteMany({ where: { restaurantId: id } }),
    db.customerSession.deleteMany({ where: { restaurantId: id } }),
    db.staffCallRequest.deleteMany({ where: { restaurantId: id } }),
    db.menuItem.deleteMany({ where: { restaurantId: id } }),
    db.category.deleteMany({ where: { restaurantId: id } }),
    db.diningTable.deleteMany({ where: { restaurantId: id } }),
    db.manager.deleteMany({ where: { restaurantId: id } }),
    db.staffMember.deleteMany({ where: { restaurantId: id } }),
    db.restaurant.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}

module.exports = { PATCH, DELETE };

