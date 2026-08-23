import type { ClientCompleteItem } from "./types";

const CLIENT_COMPLETE_REASON_LABELS: Record<
  ClientCompleteItem["reason"],
  string
> = {
  client_judgment: "Client confirmation required",
  legal_review: "Legal review required",
  procurement_signoff: "Procurement approval required",
  pricing_signoff: "Pricing approval required",
};

export function clientCompleteReasonLabel(
  reason: ClientCompleteItem["reason"] | string,
): string {
  return (
    CLIENT_COMPLETE_REASON_LABELS[reason as ClientCompleteItem["reason"]] ??
    "Client confirmation required"
  );
}
