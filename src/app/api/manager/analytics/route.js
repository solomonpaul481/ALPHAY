const { NextResponse } = require("next/server");
const { getManagerSession } = require("@/lib/manager-auth");
const {
  getRevenueSummary,
  getDailySeries,
  getMonthlySeries,
  getYearlySeries,
} = require("@/lib/analytics");

async function GET(request) {
  const manager = await getManagerSession();
  if (!manager) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const restaurantId = manager.restaurantId;

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "day";

  const summary = await getRevenueSummary(restaurantId);

  let series;
  if (range === "month") {
    series = await getMonthlySeries(restaurantId);
  } else if (range === "year") {
    series = await getYearlySeries(restaurantId);
  } else {
    series = await getDailySeries(restaurantId);
  }

  return NextResponse.json({ summary, series, range });
}

module.exports = { GET };
