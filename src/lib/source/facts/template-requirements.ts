export const FACT_TEMPLATE_BY_REQUIREMENT_ID: Record<string, string> = {
  "EVID-SRC-SCOPE-APP-INV": "APP_INVENTORY_V1",
  "EVID-SRC-SCOPE-TICKET-HISTORY": "VOLUMETRICS_V1",
  "EVID-SRC-RESP-PROPOSALS": "RESPONSE_COVERAGE_V1",
  "EVID-SRC-PRICE-VENDOR-PRICING": "VENDOR_BIDS_V1",
};

export const REQUIREMENT_ID_BY_FACT_TEMPLATE: Record<string, string> =
  Object.fromEntries(
    Object.entries(FACT_TEMPLATE_BY_REQUIREMENT_ID).map(
      ([requirementId, templateCode]) => [templateCode, requirementId],
    ),
  );

export function requirementIdForFactTemplate(
  templateCode: string | null | undefined,
): string | null {
  if (!templateCode) return null;
  return REQUIREMENT_ID_BY_FACT_TEMPLATE[templateCode] ?? null;
}
