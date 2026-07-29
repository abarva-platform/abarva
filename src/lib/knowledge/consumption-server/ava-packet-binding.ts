import type {
  AvaKnowledgePacket,
  ConsumptionEnvelope,
  EnterpriseBriefV1,
} from "../consumption-contracts";

export function bindAvaPacketToActiveConsumptionEnvelope(
  packet: AvaKnowledgePacket,
  envelope: ConsumptionEnvelope<EnterpriseBriefV1>,
): AvaKnowledgePacket {
  if (
    envelope.availabilityState !== "available" ||
    envelope.knowledgeBaselineRef === "none"
  ) {
    throw new Error(
      `ava_baseline_unavailable:${envelope.availabilityState}:${envelope.knowledgeBaselineRef}`,
    );
  }

  return {
    ...packet,
    knowledgeBaselineRef: envelope.knowledgeBaselineRef,
    domainPublicationVersions: envelope.domainPublicationVersions,
    consumptionProjectionVersions: {
      ...packet.consumptionProjectionVersions,
      contract: envelope.projectionContractVersion,
      enterpriseBrief: envelope.projectionContractVersion,
    },
    knownGapRefs: Array.from(
      new Set([...packet.knownGapRefs, ...envelope.knownGapRefs]),
    ),
  };
}
