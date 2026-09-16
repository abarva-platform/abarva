export function createdEventDestination(
  eventId: string,
  approvalUrl: string,
  tourActive: boolean,
): string {
  if (tourActive) {
    return approvalUrl + (approvalUrl.includes("?") ? "&tour=1" : "?tour=1");
  }
  return `/source/new/${encodeURIComponent(eventId)}`;
}
