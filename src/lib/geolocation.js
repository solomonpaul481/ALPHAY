const EARTH_RADIUS_METERS = 6371000;

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Validates that latitude and longitude are non-NaN numbers within legal bounds.
 */
function isValidCoordinate(lat, lng) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Formats a distance in meters into human-readable text (e.g. "85m" or "2.4 km").
 */
function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Great-circle distance between two lat/lng points, in meters.
 */
function distanceInMeters(lat1, lng1, lat2, lng2) {
  if (!isValidCoordinate(lat1, lng1) || !isValidCoordinate(lat2, lng2)) {
    return Infinity;
  }

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Checks whether a customer's reported position is within the restaurant's
 * geofence.
 */
function isWithinGeofence(customerLat, customerLng, restaurant) {
  const radius = restaurant.geofenceRadiusMeters || 150;
  const distance = distanceInMeters(
    customerLat,
    customerLng,
    restaurant.latitude,
    restaurant.longitude
  );

  const roundedDistance = Math.round(distance);
  const withinRange = distance <= radius;

  return {
    withinRange,
    distanceMeters: roundedDistance,
    formattedDistance: formatDistance(roundedDistance),
    allowedRadiusMeters: radius,
    formattedAllowedRadius: formatDistance(radius),
  };
}

module.exports = {
  isValidCoordinate,
  formatDistance,
  distanceInMeters,
  isWithinGeofence,
};
