const { NextResponse } = require("next/server");
const bcrypt = require("bcryptjs");
const QRCode = require("qrcode");
const { db } = require("@/lib/db");
const { getAdminSession } = require("@/lib/admin-auth");
const { getRevenueSummary } = require("@/lib/analytics");
const { isValidCoordinate } = require("@/lib/geolocation");

async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const restaurants = await db.restaurant.findMany({
    include: { managers: true },
    orderBy: { createdAt: "asc" },
  });

  const rows = await Promise.all(
    restaurants.map(async (r) => {
      const summary = await getRevenueSummary(r.id);
      const primaryManager = r.managers[0] || null;
      return {
        id: r.id,
        name: r.name,
        latitude: r.latitude,
        longitude: r.longitude,
        geofenceRadiusMeters: r.geofenceRadiusMeters,
        gstPercent: r.gstPercent ?? 5,
        commissionPercent: r.commissionPercent ?? 5,
        status: r.status,
        managerEmail: primaryManager?.email || "—",
        managerPassword: primaryManager?.rawPassword || "paradise123",
        managerName: primaryManager?.name || "Manager",
        orders: { day: summary.today.count, month: summary.month.count, year: summary.year.count },
        earnings: { day: summary.today.total, month: summary.month.total, year: summary.year.total },
      };
    })
  );

  return NextResponse.json({ restaurants: rows });
}

/**
 * Onboards a new restaurant onto ALPHAY: creates the Restaurant row, its
 * first Manager login, and two starter tables (a dine-in table "1" and the
 * parcel counter) so the QR codes and customer flow work immediately.
 */
async function POST(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const {
    name,
    latitude,
    longitude,
    geofenceRadiusMeters,
    gstPercent,
    commissionPercent,
    managerName,
    managerEmail,
    managerPassword,
  } = body;

  const latNum = parseFloat(latitude);
  const lngNum = parseFloat(longitude);

  if (!name || !isValidCoordinate(latNum, lngNum)) {
    return NextResponse.json(
      { error: "Restaurant name and valid GPS coordinates (Latitude between -90 and 90, Longitude between -180 and 180) are required." },
      { status: 400 }
    );
  }

  const radiusNum = geofenceRadiusMeters ? parseInt(geofenceRadiusMeters, 10) : 150;
  if (isNaN(radiusNum) || radiusNum <= 0) {
    return NextResponse.json({ error: "Geofence radius must be a positive number of meters." }, { status: 400 });
  }

  if (!managerName || !managerEmail || !managerPassword || managerPassword.length < 8) {
    return NextResponse.json(
      { error: "Manager name, email, and a password of at least 8 characters are required." },
      { status: 400 }
    );
  }

  const existingManager = await db.manager.findUnique({ where: { email: managerEmail.toLowerCase() } });
  if (existingManager) {
    return NextResponse.json({ error: "That manager email is already in use." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(managerPassword, 10);

  const restaurant = await db.restaurant.create({
    data: {
      name,
      latitude: latNum,
      longitude: lngNum,
      geofenceRadiusMeters: radiusNum,
      gstPercent: gstPercent ? parseFloat(gstPercent) : 5,
      commissionPercent: commissionPercent ? parseFloat(commissionPercent) : 5,
      status: "ACTIVE",
      billingStatus: "ACTIVE",
      billingDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      managers: {
        create: { name: managerName, email: managerEmail.toLowerCase(), passwordHash, rawPassword: managerPassword },
      },
      tables: {
        create: [{ number: "1" }, { number: "PARCEL", isParcelCounter: true }],
      },
    },
    include: { managers: true },
  });

  return NextResponse.json({
    ok: true,
    restaurant: { id: restaurant.id, name: restaurant.name, latitude: restaurant.latitude, longitude: restaurant.longitude, geofenceRadiusMeters: restaurant.geofenceRadiusMeters },
    manager: { email: restaurant.managers[0].email },
    customerUrl: appUrl(`/r/${restaurant.id}`),
    qr: {
      dineIn: await QRCode.toDataURL(appUrl(`/r/${restaurant.id}`), {
        width: 320,
        margin: 2,
        color: { dark: "#1C1524", light: "#FFFFFF" },
      }),
      parcel: await QRCode.toDataURL(appUrl(`/r/${restaurant.id}?table=PARCEL`), {
        width: 320,
        margin: 2,
        color: { dark: "#1C1524", light: "#FFFFFF" },
      }),
    },
  });
}

function appUrl(path) {
  let base = process.env.APP_URL;
  if (!base && process.env.VERCEL_URL) {
    base = `https://${process.env.VERCEL_URL}`;
  }
  if (!base) {
    base = "http://localhost:3000";
  }
  base = base.trim().replace(/\/+$/, "");
  const formattedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${formattedPath}`;
}

module.exports = { GET, POST };
