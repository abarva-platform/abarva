import {
  KNOWLEDGE_NARRATIVE_LENSES,
  KnowledgeNarrativeGenerator,
  type AcceptedNarrativeFact,
  type GenerateKnowledgeNarrativeInput,
} from "../generate-narrative";
import type { AiCallResult, AiEgressRequest, TenantAiPolicy } from "@/lib/integrations/ai-egress/types";

const policy: TenantAiPolicy = {
  allowExternalAI: true,
  allowClaude: true,
  allowGamma: false,
  maxDataClass: "confidential",
  requireRedaction: false,
  requireHumanApprovalForExports: true,
  promptResponseRetentionDays: 30,
};

const acceptedFacts: AcceptedNarrativeFact[] = [
  fact("fact:ops:1", "ev:ops:1", { subject: "turnaround", value: "Gate delay is concentrated in handoff windows." }),
  fact("fact:ops:2", "ev:ops:2", { subject: "crew", value: "Crew legality exceptions rise during recovery." }),
  fact("fact:ops:3", "ev:ops:3", { subject: "baggage", value: "Baggage recovery uses manual status reconciliation." }),
];

function fact(factRef: string, evidenceRef: string, factValue: unknown): AcceptedNarrativeFact {
  return {
    factRef,
    entityRef: "entity:ops",
    entityDisplayName: "Operations Control",
    entityType: "operation",
    factType: "operational_observation",
    factValue,
    evidenceRefs: [evidenceRef],
    confidence: 0.82,
  };
}

function input(overrides: Partial<GenerateKnowledgeNarrativeInput> = {}): GenerateKnowledgeNarrativeInput {
  return {
    tenantKey: "airline-demo-new",
    knowledgeBaselineRef: "baseline:test",
    lens: KNOWLEDGE_NARRATIVE_LENSES[1],
    enterpriseIdentity: {
      displayName: "Synthetic Airline",
      industry: "Airline",
      summary: "Synthetic airline operating baseline.",
      evidenceRefs: [],
    },
    facts: acceptedFacts,
    relationships: [],
    interviewExcerpts: [
      {
        role: "Operations leader",
        quote: "Our recovery issue is less aircraft availability than coordination latency.",
        sourceRowId: "interview-row-1",
        evidenceRef: "ev:interview:1",
      },
    ],
    industryContextRows: [],
    metrics: [],
    ...overrides,
  };
}

function generatorWith(callModelMock: jest.Mock<Promise<AiCallResult>, [AiEgressRequest]>) {
  return new KnowledgeNarrativeGenerator({
    callModel: callModelMock as never,
    loadTenantAiPolicyRecord: jest.fn(async () => ({ tenantId: "tenant-uuid", policy })) as never,
    createAuditSink: jest.fn(() => ({ write: jest.fn() })) as never,
    createTextAdapter: jest.fn(() => jest.fn()) as never,
  });
}

describe("KnowledgeNarrativeGenerator", () => {
  it("refuses before egress when accepted evidence is too thin", async () => {
    const callModelMock = jest.fn<Promise<AiCallResult>, [AiEgressRequest]>();
    const result = await generatorWith(callModelMock).generate(input({ facts: acceptedFacts.slice(0, 2) }));

    expect(result.refused).toBe(true);
    expect(result.interpretation).toBeNull();
    expect(result.refusalReasons).toContain("accepted_fact_count_below_3");
    expect(callModelMock).not.toHaveBeenCalled();
  });

  it("generates grounded interpretation and perspectives using only allowed evidence refs", async () => {
    const callModelMock = jest.fn<Promise<AiCallResult>, [AiEgressRequest]>(async (request) => {
      if (request.workflow === "knowledge-narrative-interpretation") {
        return {
          ok: true,
          auditId: "audit-interpretation",
          dataClass: "confidential",
          response: JSON.stringify({
            headline: "Recovery weakness is concentrated in cross-functional handoffs, not one isolated system.",
            body: "Accepted evidence points to handoff latency across gate, crew, and baggage operations. That makes a single-system remediation too narrow: the decision is whether to fund a coordinated recovery control layer before automating individual work queues.",
            evidenceRefs: ["ev:ops:1", "ev:ops:2"],
          }),
        };
      }
      if (request.workflow === "knowledge-narrative-leadership-perspectives") {
        return {
          ok: true,
          auditId: "audit-perspectives",
          dataClass: "confidential",
          response: JSON.stringify({
            perspectives: [
              {
                sourceRowId: "interview-row-1",
                supportingEvidenceRefs: ["ev:ops:1"],
                challengingEvidenceRefs: ["not-allowed"],
                uncertainEvidenceRefs: ["ev:ops:3"],
                ourReading: "The leadership quote is directionally supported, but baggage evidence keeps the scope broader than crew alone.",
              },
            ],
          }),
        };
      }
      return {
        ok: true,
        auditId: "audit-benchmarks",
        dataClass: "confidential",
        response: JSON.stringify({ benchmarks: [] }),
      };
    });

    const result = await generatorWith(callModelMock).generate(input());

    expect(result.refused).toBe(false);
    expect(result.interpretation?.headline).toContain("cross-functional handoffs");
    expect(result.interpretation?.evidenceRefs).toEqual(["ev:ops:1", "ev:ops:2"]);
    expect(result.perspectives).toHaveLength(1);
    expect(result.perspectives[0]?.evidenceStance.challenging).toEqual([]);
    expect(result.perspectives[0]?.evidenceRefs).toEqual(["ev:interview:1", "ev:ops:1", "ev:ops:3"]);
    expect(callModelMock).toHaveBeenCalledTimes(2);
  });
});
