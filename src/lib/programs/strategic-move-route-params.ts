const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Production Strategic Move routes are backed by engagement UUIDs. Legacy
 * /programs/:id redirects can still hand slug-like fixture ids to the
 * /strategic-moves route; reject them before the data-plane query so they
 * render the app 404 instead of surfacing a database cast error.
 */
export function isStrategicMoveRouteId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function parseStrategicMovePhaseNum(value: string): number | null {
  const phase = Number.parseInt(value, 10);
  if (!Number.isInteger(phase) || phase < 0 || phase > 5) return null;
  return phase;
}
