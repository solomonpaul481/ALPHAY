const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");
const { getManagerSession } = require("@/lib/manager-auth");

function getDateRange(filter, customStart, customEnd) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (filter === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (filter === "yesterday") {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  } else if (filter === "this_week") {
    const dayOfWeek = start.getDay();
    start.setDate(start.getDate() - dayOfWeek);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (filter === "this_month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (filter === "custom" && customStart && customEnd) {
    const s = new Date(customStart);
    const e = new Date(customEnd);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }
  }

  return { start, end };
}

async function GET(request) {
  const manager = await getManagerSession();
  if (!manager) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "all";
  const customStart = searchParams.get("start");
  const customEnd = searchParams.get("end");
  const query = searchParams.get("q") || "";

  const whereClause = {
    restaurantId: manager.restaurantId,
  };

  if (filter !== "all") {
    const { start, end } = getDateRange(filter, customStart, customEnd);
    whereClause.createdAt = {
      gte: start,
      lte: end,
    };
  }

  const orders = await db.order.findMany({
    where: whereClause,
    include: {
      table: true,
      payment: true,
      session: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const transactions = orders
    .filter((o) => {
      if (o.status === "PENDING_PAYMENT" && !o.session?.paymentStatus === "PAID") return false;
      if (!query) return true;
      const q = query.toLowerCase();
      const orderNo = o.id.slice(-6).toLowerCase();
      const orderSeqStr = o.orderSeq ? String(o.orderSeq) : "";
      const tableNo = o.table?.number.toLowerCase() || "";
      const pId = (o.razorpayPaymentId || "").toLowerCase();
      const pMethod = (o.session?.paymentMethod || "").toLowerCase();
      return orderNo.includes(q) || orderSeqStr.includes(q) || tableNo.includes(q) || pId.includes(q) || pMethod.includes(q);
    })
    .map((o) => {
      const rawTxnId = o.razorpayPaymentId || o.payment?.razorpayPaymentId || o.session?.razorpayPaymentId;
      const isOnline = Boolean(
        (rawTxnId && !["CASH", "CASH_PAYMENT", "Cash"].includes(rawTxnId)) ||
        o.session?.paymentMethod === "ONLINE" ||
        o.session?.paymentMethod === "UPI"
      );
      const isCash = !isOnline;
      const methodLabel = isOnline ? "UPI / Online 💳" : "Cash";
      const statusLabel = isOnline ? "PAID (ONLINE)" : "PAID (CASH)";
      const txnDisplayId = isOnline ? (rawTxnId || `pay_${o.id.slice(-8)}`) : "Cash";

      return {
        id: o.payment?.id || `txn_${o.id}`,
        orderId: o.id,
        orderNumber: o.orderSeq ? `#${o.orderSeq}` : `#${o.id.slice(-4).toUpperCase()}`,
        tableNumber: o.table ? o.table.number : "1",
        amount: o.total,
        paymentMethod: methodLabel,
        paymentStatus: statusLabel,
        razorpayPaymentId: txnDisplayId,
        isCash,
        createdAt: o.createdAt,
      };
    });

  return NextResponse.json({ transactions });
}

module.exports = { GET };
