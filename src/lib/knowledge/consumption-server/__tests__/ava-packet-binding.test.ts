import { bindAvaPacketToActiveConsumptionEnvelope } from "../ava-packet-binding";
import type {
  AvaKnowledgePacket,
  ConsumptionEnvelope,
  EnterpriseBriefV1,
} from "../../consumption-contracts";

const packet: AvaKnowledgePacket = {
  tenantKey: "airline-demo-new",
  knowledgeBaselineRef: "browser-supplied-baseline",
  domainPublicationVersions: { stale: "v0" },
  consumptionProjectionVersions: { contract: "stale-contract" },
  cubeSemanticModelVersion: null,
  mode: "brief",
  lens: "none",
  depth: "executive",
  currentTargetScope: "current",
  focalEntityRefs: [],
  activeFilters: {},
  permissionBoundaryRef: "tenant:airline-demo-new",
  executivePerspectiveRefs: [],
  acceptedFactRefs: [],
  relationshipEdgeRefs: [],
  metricQueryHashes: [],
  evidenceRefs: [],
  knownGapRefs: ["client-gap"],
  blockedSourceRefs: [],
};

const envelope: ConsumptionEnvelope<EnterpriseBriefV1> = {
  tenantKey: "airline-demo-new",
  knowledgeBaselineRef: "airline-demo-new-source-corpus-v1.0.0:knowledge-baseline-v1",
  domainPublicationVersions: { enterprise: "pub-enterprise-v1" },
  projectionName: "consumption.enterprise_brief_v1",
  projectionContractVersion: "phase3c2d-consumption-contracts-v1.0.0",
  asOf: "2026-07-29T00:00:00.000Z",
  contentHash: "hash",
  authorityState: "published",
  availabilityState: "available",
  freshnessState: "fresh",
  data: {
    identity: {
      organizationId: "org-airline-demo-new",
      displayName: "Airline Demo New",
      industry: "Airline",
      revenue: null,
      employees: null,
      footprint: null,
      footprintState: "not_loaded",
    },
    headlineMetrics: [],
    interpretation: null,
    perspectives: [],
    benchmarks: [],
    targets: [],
    domains: [],
    topGapRefs: [],
  },
  evidenceRefs: [],
  knownGapRefs: ["server-gap"],
  warnings: [],
};

describe("bindAvaPacketToActiveConsumptionEnvelope", () => {
  it("overwrites browser-supplied baseline identity with the server envelope", () => {
    const bound = bindAvaPacketToActiveConsumptionEnvelope(packet, envelope);

    expect(bound.knowledgeBaselineRef).toBe(envelope.knowledgeBaselineRef);
    expect(bound.domainPublicationVersions).toEqual({ enterprise: "pub-enterprise-v1" });
    expect(bound.consumptionProjectionVersions.contract).toBe(envelope.projectionContractVersion);
    expect(bound.consumptionProjectionVersions.enterpriseBrief).toBe(envelope.projectionContractVersion);
    expect(bound.knownGapRefs).toEqual(["client-gap", "server-gap"]);
  });

  it("refuses to bind aVa to an unavailable baseline", () => {
    expect(() =>
      bindAvaPacketToActiveConsumptionEnvelope(packet, {
        ...envelope,
        knowledgeBaselineRef: "none",
        availabilityState: "not_loaded",
      }),
    ).toThrow("ava_baseline_unavailable:not_loaded:none");
  });
});
