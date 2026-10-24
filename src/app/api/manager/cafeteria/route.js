const { NextResponse } = require("next/server");
const bcrypt = require("bcryptjs");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");
const { isValidCoordinate } = require("@/lib/geolocation");

async function GET() {
  const manager = await getManagerSession();
  if (!manager) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const restaurant = manager.restaurant;

  // Fetch all live cafeteria orders requiring token collection
  const liveOrders = await db.order.findMany({
    where: {
      restaurantId: restaurant.id,
      status: { in: ["PAID", "CONFIRMED", "PREPARING", "READY"] },
    },
    include: {
      items: true,
      table: true,
      session: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const formattedTokens = liveOrders.map((o) => {
    const isParcel = Boolean(
      o.table?.isParcelCounter ||
      String(o.table?.number).toUpperCase().includes("PARCEL") ||
      o.specialInstructions?.includes("[CAFETERIA PARCEL]") ||
      o.specialInstructions?.includes("[PARCEL]")
    );
    const tokenStr = String(o.orderSeq || 1001).slice(-4).padStart(4, "0");

    return {
      orderId: o.id,
      tokenNumber: tokenStr,
      orderSeq: o.orderSeq,
      orderType: isParcel ? "PARCEL_TAKEAWAY" : "DINE_IN",
      tableNumber: isParcel ? "PARCEL" : (o.table ? o.table.number : "1"),
      status: o.status,
      paymentStatus: o.status === "PENDING_PAYMENT" ? "UNPAID" : "PAID",
      total: o.total,
      itemCount: o.items.reduce((sum, it) => sum + it.quantity, 0),
      items: o.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        notes: i.notes,
      })),
      specialInstructions: o.specialInstructions,
      createdAt: o.createdAt,
    };
  });

  // Also fetch any other cafeterias associated with the platform or created
  const cafeterias = await db.restaurant.findMany({
    where: { category: "CAFETERIA" },
    include: { managers: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    ok: true,
    currentVenue: {
      id: restaurant.id,
      name: restaurant.name,
      category: restaurant.category || "RESTAURANT",
      subCategory: restaurant.subCategory || "COLLEGE",
      isCafeteria: restaurant.category === "CAFETERIA",
    },
    activeTokens: formattedTokens,
    allCafeterias: cafeterias.map((c) => ({
      id: c.id,
      name: c.name,
      subCategory: c.subCategory || "COLLEGE",
      status: c.status,
      managerEmail: c.managers[0]?.email || "—",
      createdAt: c.createdAt,
    })),
  });
}

/**
 * Manager action to onboard a new Cafeteria (College, Roadside, etc.)
 */
async function POST(request) {
  const manager = await getManagerSession();
  if (!manager) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const {
    name,
    subCategory = "COLLEGE",
    latitude,
    longitude,
    geofenceRadiusMeters = 150,
    gstPercent = 5,
    managerName,
    managerEmail,
    managerPassword,
  } = body;

  const latNum = parseFloat(latitude);
  const lngNum = parseFloat(longitude);

  if (!name || !isValidCoordinate(latNum, lngNum)) {
    return NextResponse.json(
      { error: "Cafeteria name and valid GPS coordinates (Latitude: -90 to 90, Longitude: -180 to 180) are required." },
      { status: 400 }
    );
  }

  if (!managerName || !managerEmail || !managerPassword || managerPassword.length < 6) {
    return NextResponse.json(
      { error: "Manager name, email, and password (at least 6 characters) are required." },
      { status: 400 }
    );
  }

  const existingManager = await db.manager.findUnique({
    where: { email: managerEmail.toLowerCase().trim() },
  });
  if (existingManager) {
    return NextResponse.json({ error: "That manager email is already registered." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(managerPassword.trim(), 10);

  const newCafeteria = await db.restaurant.create({
    data: {
      name: name.trim(),
      category: "CAFETERIA",
      subCategory: String(subCategory).trim().toUpperCase(),
      latitude: latNum,
      longitude: lngNum,
      geofenceRadiusMeters: parseInt(geofenceRadiusMeters, 10) || 150,
      gstPercent: parseFloat(gstPercent) || 5,
      commissionPercent: 5,
      status: "ACTIVE",
      billingStatus: "ACTIVE",
      billingDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      managers: {
        create: {
          name: managerName.trim(),
          email: managerEmail.toLowerCase().trim(),
          passwordHash,
          rawPassword: managerPassword.trim(),
        },
      },
      tables: {
        create: [
          { number: "1" },
          { number: "2" },
          { number: "3" },
          { number: "PARCEL", isParcelCounter: true },
        ],
      },
    },
    include: { managers: true },
  });

  return NextResponse.json({
    ok: true,
    cafeteria: {
      id: newCafeteria.id,
      name: newCafeteria.name,
      category: newCafeteria.category,
      subCategory: newCafeteria.subCategory,
      managerEmail: newCafeteria.managers[0].email,
      customerUrl: `/r/${newCafeteria.id}`,
    },
  });
}

/**
 * Advance token state (e.g. from READY to SERVED / COLLECTED)
 */
async function PATCH(request) {
  const manager = await getManagerSession();
  if (!manager) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { orderId, action } = body;

  if (!orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 });
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
  });

  if (!order || order.restaurantId !== manager.restaurantId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  let nextStatus = order.status;
  if (action === "READY") {
    nextStatus = "READY";
  } else if (action === "COLLECTED" || action === "SERVED") {
    nextStatus = "SERVED";
  } else {
    // Sequential advance: CONFIRMED -> PREPARING -> READY -> SERVED
    const statusCycle = ["CONFIRMED", "PREPARING", "READY", "SERVED"];
    const idx = statusCycle.indexOf(order.status);
    if (idx >= 0 && idx < statusCycle.length - 1) {
      nextStatus = statusCycle[idx + 1];
    }
  }

  const updated = await db.order.update({
    where: { id: orderId },
    data: { status: nextStatus },
  });

  return NextResponse.json({ ok: true, order: updated });
}

module.exports = { GET, POST, PATCH };
