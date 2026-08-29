const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");
const { getRevenueSummary } = require("@/lib/analytics");

function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function GET() {
  try {
    const manager = await getManagerSession();
    if (!manager) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const restaurantId = manager.restaurantId;

    const [summary, liveOrders, completedToday, staffCalls, restaurant, activeSessions, parcelOrdersList] = await Promise.all([
      getRevenueSummary(restaurantId),
      db.order.findMany({
        where: {
          restaurantId,
          status: { in: ["PAID", "CONFIRMED", "PREPARING", "READY"] },
          session: {
            endedAt: null,
            status: { in: ["ACTIVE", "BILL_REQUESTED", "BILL_SENT"] },
          },
        },
        include: { items: true, table: true },
        orderBy: { createdAt: "asc" },
      }),
      db.order.count({
        where: { restaurantId, status: "SERVED", createdAt: { gte: startOfDay() } },
      }),
      db.staffCallRequest.findMany({
        where: { restaurantId, status: "PENDING" },
        include: { table: true },
        orderBy: { createdAt: "asc" },
      }),
      db.restaurant.findUnique({ where: { id: restaurantId } }),
      db.customerSession.findMany({
        where: {
          restaurantId,
          endedAt: null,
          status: { in: ["ACTIVE", "BILL_REQUESTED", "BILL_SENT"] },
        },
        include: {
          table: true,
          orders: {
            include: { items: true },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.order.findMany({
        where: {
          restaurantId,
          OR: [
            { table: { isParcelCounter: true } },
            { table: { number: "PARCEL" } },
            { table: { number: "P" } },
            { specialInstructions: { contains: "PARCEL" } },
          ],
          status: { in: ["PENDING_PAYMENT", "PAID", "CONFIRMED", "PREPARING", "READY"] },
          createdAt: { gte: startOfDay() },
        },
        include: { items: true, table: true, session: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant record not found" }, { status: 404 });
    }

    const activeCount = liveOrders.filter((o) => o.status === "CONFIRMED" || o.status === "PREPARING" || o.status === "PAID").length;
    const readyCount = liveOrders.filter((o) => o.status === "READY").length;

    // Filter active sessions to ONLY include DINE-IN tables (exclude parcel counter)
    const formattedActiveSessions = activeSessions
      .filter((sess) => {
        const isParcel =
          sess.table?.isParcelCounter ||
          String(sess.table?.number).toUpperCase() === "PARCEL" ||
          String(sess.table?.number).toUpperCase() === "P";
        return !isParcel;
      })
      .map((sess) => {
        let sessionTotal = 0;
        const allItems = [];
        sess.orders.forEach((ord) => {
          sessionTotal += ord.total;
          ord.items.forEach((it) => {
            allItems.push({
              id: it.id,
              name: it.name,
              quantity: it.quantity,
              price: it.price,
              notes: it.notes,
            });
          });
        });

        return {
          id: sess.id,
          tableNumber: sess.table ? sess.table.number : "1",
          status: sess.status,
          paymentStatus: sess.paymentStatus,
          paymentMethod: sess.paymentMethod,
          billRequestedAt: sess.billRequestedAt,
          billSentAt: sess.billSentAt,
          createdAt: sess.createdAt,
          ordersCount: sess.orders.length,
          totalAmount: Math.round(sessionTotal * 100) / 100,
          items: allItems,
        };
      })
      .filter((sess) => sess.items.length > 0);

    // Format dedicated Parcel orders for the Manager Dashboard feed
    const formattedParcelOrders = parcelOrdersList.map((po) => {
      const tokenStr = String(po.orderSeq || 1001).slice(-4).padStart(4, "0");
      return {
        id: po.id,
        orderNumber: `ORD-${tokenStr}`,
        token: tokenStr,
        orderSeq: po.orderSeq,
        status: po.status,
        table: "PARCEL",
        total: po.total,
        subtotal: po.subtotal,
        gstAmount: po.gstAmount,
        createdAt: po.createdAt,
        paymentStatus: po.status === "PENDING_PAYMENT" ? "UNPAID" : "PAID",
        paymentGateway: po.paymentGateway || "RAZORPAY",
        razorpayPaymentId: po.razorpayPaymentId,
        specialInstructions: po.specialInstructions,
        items: (po.items || []).map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          notes: i.notes,
        })),
      };
    });

    return NextResponse.json({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      managerName: manager.name,
      managerEmail: manager.email,
      geofenceRadiusMeters: restaurant.geofenceRadiusMeters ?? 150,
      gstPercent: restaurant.gstPercent ?? 5,
      commissionPercent: restaurant.commissionPercent ?? 5,
      restaurantStatus: restaurant.status ?? "ACTIVE",
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      createdAt: restaurant.createdAt,
      todayOrders: summary.today.count,
      todayEarnings: summary.today.total,
      monthEarnings: summary.month.total,
      active: activeCount,
      ready: readyCount,
      completedToday,
      allToday: summary.today.count,
      activeSessions: formattedActiveSessions,
      parcelOrders: formattedParcelOrders,
      liveOrders: liveOrders.map((o) => {
        const isParcel =
          o.table?.isParcelCounter ||
          String(o.table?.number).toUpperCase() === "PARCEL" ||
          String(o.table?.number).toUpperCase() === "P";
        const tokenStr = String(o.orderSeq || 1001).slice(-4).padStart(4, "0");
        return {
          id: o.id,
          status: o.status === "PAID" ? "CONFIRMED" : o.status,
          table: isParcel ? "PARCEL" : (o.table ? o.table.number : "12"),
          isParcel,
          token: tokenStr,
          total: o.total,
          createdAt: o.createdAt,
          items: o.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
        };
      }),
      staffCalls: staffCalls.map((c) => ({
        id: c.id,
        type: c.type,
        table: c.table ? c.table.number : "12",
        createdAt: c.createdAt,
      })),
    });
  } catch (err) {
    console.error("Manager Dashboard Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}

module.exports = { GET };
