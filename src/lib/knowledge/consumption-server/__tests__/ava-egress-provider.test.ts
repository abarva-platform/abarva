/**
 * AiEgressAvaReasoningProvider — the paths that don't require a live model:
 * availability detection and the refuse-without-evidence guard (which returns
 * before any egress call). The model-call path is exercised in integration.
 */

import { AiEgressAvaReasoningProvider } from "../ava-egress-provider";
import type { AvaKnowledgePacket } from "../../consumption-contracts";

const basePacket = (over: Partial<AvaKnowledgePacket> = {}): AvaKnowledgePacket => ({
  tenantKey: "airline-demo-new",
  knowledgeBaselineRef: "kb-1",
  domainPublicationVersions: {},
  consumptionProjectionVersions: {},
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
  knownGapRefs: [],
  blockedSourceRefs: [],
  ...over,
});

describe("AiEgressAvaReasoningProvider", () => {
  const provider = new AiEgressAvaReasoningProvider();

  it("isAvailable() reflects ANTHROPIC_API_KEY presence", () => {
    const prev = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    expect(provider.isAvailable()).toBe(false);
    process.env.ANTHROPIC_API_KEY = "sk-test";
    expect(provider.isAvailable()).toBe(true);
    if (prev === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = prev;
  });

  it("refuses (without any egress call) when no evidence is in scope", async () => {
    const answer = await provider.ask({ intent: "explain", question: "x", packet: basePacket() });
    expect(answer.outcome).toBe("refused");
    expect(answer.promoted).toBe(false);
    expect(answer.refusalReason).toMatch(/evidence is unavailable/i);
    expect(answer.sections).toEqual([]);
  });
});
