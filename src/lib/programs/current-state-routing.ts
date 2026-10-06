import type { EvidenceFamilySpec } from "@/lib/programs/archetypes/types";

type CurrentStateFamilyRoutingInfo = Pick<
  EvidenceFamilySpec,
  "label" | "sourceDocHint"
>;

export function structuredCurrentStateUploadDetail(
  family: CurrentStateFamilyRoutingInfo,
): string {
  const expected = family.sourceDocHint?.trim()
    ? ` Expected input: ${family.sourceDocHint}.`
    : "";
  return `${family.label} is satisfied by a governed data load, not Upload & Review.${expected} Use the structured current-state CSV path for this family.`;
}
