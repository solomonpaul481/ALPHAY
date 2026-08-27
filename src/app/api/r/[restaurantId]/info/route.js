const { NextResponse } = require("next/server");
const { resolveRestaurant } = require("@/lib/resolve-restaurant");

async function GET(request, { params }) {
  const { restaurantId } = params;
  const restaurant = await resolveRestaurant(restaurantId);

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: restaurant.id,
    name: restaurant.name,
    logoUrl: restaurant.logoUrl,
    gstPercent: restaurant.gstPercent,
    latitude: restaurant.latitude,
    longitude: restaurant.longitude,
    geofenceRadiusMeters: restaurant.geofenceRadiusMeters,
  });
}

module.exports = { GET };


