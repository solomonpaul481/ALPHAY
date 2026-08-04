const { NextResponse } = require("next/server");
const { getAdminSession } = require("@/lib/admin-auth");
const {
  getRevenueSummary,
  getDailySeries,
  getMonthlySeries,
  getYearlySeries,
} = require("@/lib/analytics");

async function GET(request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "day";

  const summary = await getRevenueSummary(null);

  let series;
  if (range === "month") series = await getMonthlySeries(null);
  else if (range === "year") series = await getYearlySeries(null);
  else series = await getDailySeries(null);

  return NextResponse.json({ summary, series, range });
}

module.exports = { GET };
