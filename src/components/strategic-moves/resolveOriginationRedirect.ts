export function resolveStrategicMoveOriginationRedirect(payload: {
  redirectTo?: string | null;
  engagementId?: string | null;
}): string | null {
  const redirectTo = payload.redirectTo?.trim();
  if (redirectTo) return redirectTo;
  const engagementId = payload.engagementId?.trim();
  return engagementId
    ? `/strategic-moves/${encodeURIComponent(engagementId)}`
    : null;
}
