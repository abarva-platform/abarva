export function createdEventDestination(
  eventId: string,
  approvalUrl: string,
  tourActive: boolean,
  sourcingMotion?: "competitive_rfp" | "contract_optimization" | null,
): string {
  if (tourActive || sourcingMotion === "contract_optimization") {
    return tourActive
      ? approvalUrl + (approvalUrl.includes("?") ? "&tour=1" : "?tour=1")
      : approvalUrl;
  }
  return `/source/new/${encodeURIComponent(eventId)}`;
}
