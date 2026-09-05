const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");

async function PATCH(request, { params }) {
  const manager = await getManagerSession();
  if (!manager) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const table = await db.diningTable.findUnique({ where: { id: params.tableId } });
  if (!table || table.restaurantId !== manager.restaurantId) {
    return NextResponse.json({ error: "Table not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const number = (body.number || "").trim();
  if (!number) return NextResponse.json({ error: "Table number is required." }, { status: 400 });

  try {
    const updated = await db.diningTable.update({ where: { id: table.id }, data: { number } });
    return NextResponse.json({ ok: true, table: updated });
  } catch (err) {
    return NextResponse.json({ error: "That table number already exists." }, { status: 409 });
  }
}

async function DELETE(request, { params }) {
  const manager = await getManagerSession();
  if (!manager) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const table = await db.diningTable.findUnique({ where: { id: params.tableId } });
  if (!table || table.restaurantId !== manager.restaurantId) {
    return NextResponse.json({ error: "Table not found." }, { status: 404 });
  }

  // Protect the parcel takeaway counter table from being deleted
  if (table.isParcelCounter || String(table.number).trim().toUpperCase() === "PARCEL") {
    return NextResponse.json(
      { error: "The Parcel Takeaway Counter table is system-protected and cannot be deleted." },
      { status: 400 }
    );
  }

  try {
    // Check if there are active dining sessions currently seated at this table
    const activeSession = await db.customerSession.findFirst({
      where: {
        tableId: table.id,
        endedAt: null,
        status: { in: ["ACTIVE", "BILL_REQUESTED", "BILL_SENT"] },
      },
    });

    if (activeSession) {
      return NextResponse.json(
        {
          error: `Cannot delete Table ${table.number} because it currently has an active dining session. Please complete or settle the session first.`,
        },
        { status: 400 }
      );
    }

    // Cascade delete any past sessions, orders, order items, payments, ratings, and staff calls in a transaction
    await db.$transaction(async (tx) => {
      // 1. Staff calls for this table
      await tx.staffCallRequest.deleteMany({ where: { tableId: table.id } });

      // 2. Orders on this table
      const tableOrders = await tx.order.findMany({
        where: { tableId: table.id },
        select: { id: true },
      });
      const orderIds = tableOrders.map((o) => o.id);

      if (orderIds.length > 0) {
        await tx.rating.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.payment.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
        await tx.order.deleteMany({ where: { id: { in: orderIds } } });
      }

      // 3. Customer sessions for this table
      await tx.customerSession.deleteMany({ where: { tableId: table.id } });

      // 4. Finally delete the dining table
      await tx.diningTable.delete({ where: { id: table.id } });
    });

    return NextResponse.json({ ok: true, deletedTableNumber: table.number });
  } catch (err) {
    console.error("Error deleting table:", err);
    return NextResponse.json(
      { error: err.message || "Failed to delete table from database." },
      { status: 500 }
    );
  }
}

module.exports = { PATCH, DELETE };
