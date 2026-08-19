const { db } = require("./db");

// Orders count as revenue when placed or completed/paid — i.e. everything
// past PENDING_PAYMENT that didn't fail or get cancelled.
const REVENUE_STATUSES = ["PAID", "CONFIRMED", "PREPARING", "READY", "SERVED"];

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function startOfYear(date) {
  return new Date(date.getFullYear(), 0, 1);
}

/**
 * Orders + total for "today", "this month", and "this year" in one query,
 * scoped to a restaurant if restaurantId is given, or across the whole
 * platform if it's null (Admin view).
 */
async function getRevenueSummary(restaurantId) {
  const now = new Date();
  const startDay = startOfDay(now);
  const startMonth = startOfMonth(now);
  const startYear = startOfYear(now);

  const where = {
    status: { in: REVENUE_STATUSES },
    createdAt: { gte: startYear },
    ...(restaurantId ? { restaurantId } : {}),
  };

  const yearOrders = await db.order.findMany({
    where,
    select: { total: true, createdAt: true },
  });

  let todayCount = 0, todayTotal = 0;
  let monthCount = 0, monthTotal = 0;
  let yearCount = 0, yearTotal = 0;

  for (const o of yearOrders) {
    const t = o.total || 0;
    yearCount++;
    yearTotal += t;
    if (o.createdAt >= startMonth) {
      monthCount++;
      monthTotal += t;
    }
    if (o.createdAt >= startDay) {
      todayCount++;
      todayTotal += t;
    }
  }

  return {
    today: { count: todayCount, total: Math.round(todayTotal * 100) / 100 },
    month: { count: monthCount, total: Math.round(monthTotal * 100) / 100 },
    year: { count: yearCount, total: Math.round(yearTotal * 100) / 100 },
  };
}

/** Revenue for every day in the given month (defaults to current). */
async function getDailySeries(restaurantId, year, month) {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth();
  const from = new Date(y, m, 1);
  const to = new Date(y, m + 1, 1);

  const orders = await db.order.findMany({
    where: {
      status: { in: REVENUE_STATUSES },
      createdAt: { gte: from, lt: to },
      ...(restaurantId ? { restaurantId } : {}),
    },
    select: { total: true, createdAt: true },
  });

  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const series = Array.from({ length: daysInMonth }, (_, i) => ({ label: String(i + 1), total: 0 }));
  for (const o of orders) {
    series[o.createdAt.getDate() - 1].total += o.total;
  }
  return series;
}

/** Revenue for every month in the given year (defaults to current). */
async function getMonthlySeries(restaurantId, year) {
  const y = year ?? new Date().getFullYear();
  const from = new Date(y, 0, 1);
  const to = new Date(y + 1, 0, 1);

  const orders = await db.order.findMany({
    where: {
      status: { in: REVENUE_STATUSES },
      createdAt: { gte: from, lt: to },
      ...(restaurantId ? { restaurantId } : {}),
    },
    select: { total: true, createdAt: true },
  });

  const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const series = MONTH_LABELS.map((label) => ({ label, total: 0 }));
  for (const o of orders) {
    series[o.createdAt.getMonth()].total += o.total;
  }
  return series;
}

/** Revenue for every year that has at least one order. */
async function getYearlySeries(restaurantId) {
  const orders = await db.order.findMany({
    where: { status: { in: REVENUE_STATUSES }, ...(restaurantId ? { restaurantId } : {}) },
    select: { total: true, createdAt: true },
  });
  const byYear = {};
  for (const o of orders) {
    const y = o.createdAt.getFullYear();
    byYear[y] = (byYear[y] || 0) + o.total;
  }
  const years = Object.keys(byYear).sort();
  return years.map((y) => ({ label: y, total: byYear[y] }));
}

module.exports = {
  REVENUE_STATUSES,
  getRevenueSummary,
  getDailySeries,
  getMonthlySeries,
  getYearlySeries,
};
