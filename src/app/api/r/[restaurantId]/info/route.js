const { NextResponse } = require("next/server");
const { db } = require("@/lib/db");

async function GET(request, { params }) {
  const { restaurantId } = params;
  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      gstPercent: true,
      latitude: true,
      longitude: true,
      geofenceRadiusMeters: true,
    },
  });
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }
  return NextResponse.json(restaurant);
}

module.exports = { GET };

