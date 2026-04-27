const EARTH_RADIUS_MILES = 3958.8;

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineMiles(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
): number {
  const latDelta = degreesToRadians(endLat - startLat);
  const lngDelta = degreesToRadians(endLng - startLng);
  const startLatRadians = degreesToRadians(startLat);
  const endLatRadians = degreesToRadians(endLat);

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLatRadians) *
      Math.cos(endLatRadians) *
      Math.sin(lngDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_MILES * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
