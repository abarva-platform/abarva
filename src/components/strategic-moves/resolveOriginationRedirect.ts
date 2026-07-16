export function resolveStrategicMoveOriginationRedirect(payload: {
  redirectTo?: string | null;
  engagementId?: string | null;
}): string | null {
  const engagementId = payload.engagementId?.trim();
  const redirectTo = payload.redirectTo?.trim();
  if (redirectTo?.startsWith("/programs/") && engagementId) {
    return `/strategic-moves/${encodeURIComponent(engagementId)}/phase/0?focus=gate`;
  }
  if (redirectTo) return redirectTo;
  return engagementId
    ? `/strategic-moves/${encodeURIComponent(engagementId)}/phase/0?focus=gate`
    : null;
}
