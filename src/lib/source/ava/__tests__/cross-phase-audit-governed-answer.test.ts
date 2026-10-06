import { composeAvaAnswer } from "@/lib/ava-answer/composeAvaAnswer";
import {
  buildCrossPhaseAuditGovernedAnswer,
  looksLikeCrossPhaseAuditQuestion,
} from "@/lib/source/ava/cross-phase-audit-governed-answer";

const auditQuestion =
  "Is this sourcing event audit-complete and ready for Contract 360 and Optimize? Reconcile the governed supplier and NDA history, current evidence readiness, and Stage 08 handoff blockers. State what is missing and the one next action.";

function evidenceAnswer(tenantFencePassed = true) {
  return composeAvaAnswer({
    surface: "source",
    mode: "SOURCE",
    tenantKey: "example-health",
    question: auditQuestion,
    intent: "evidence_processing_readiness",
    status: "answered",
    tenantFencePassed,
    directAnswer:
      "227 Source artifact records are stored. 47 are parsed, 0 are search-ready, and 180 still require parsing.",
    recommendation: "Review the Value artifacts.",
    artifacts: [
      {
        artifact: "chart",
        id: "source-evidence-processing-readiness",
        kind: "horizontal-bar",
        data: {
          type: "horizontal-bar",
          data: [
            { metric: "Stored", count: 227 },
            { metric: "Needs parser", count: 180 },
            { metric: "Parsed", count: 47 },
            { metric: "Search-ready", count: 0 },
          ],
        },
      },
    ],
    retrievalSummary: {
      substrate: "module_read_model",
      sourceCount: 227,
      factCount: 4,
      hasTenantFacts: true,
      hasCorpus: false,
      hasExperts: false,
    },
  });
}

const event = {
  id: "event-1",
  name: "Synthetic infrastructure sourcing event",
  lifecycle: "completed",
  currentStageKey: "transition" as const,
  currentStageLabel: "Transition",
  triggerDescription: "Renew the managed-services estate.",
  scopeDescription: "Infrastructure and platform operations.",
  decisionOwner: "Procurement lead",
  stages: [
    {
      key: "strategy" as const,
      label: "Strategy",
      status: "complete",
      gate: { status: "approved", requiredArtifacts: [], blocker: null },
    },
    {
      key: "scope" as const,
      label: "Scope",
      status: "complete",
      gate: { status: "approved", requiredArtifacts: [], blocker: null },
    },
    {
      key: "rfp" as const,
      label: "RFP",
      status: "complete",
      gate: { status: "approved", requiredArtifacts: [], blocker: null },
    },
    {
      key: "transition" as const,
      label: "Transition",
      status: "active",
      gate: { status: "blocked", requiredArtifacts: [], blocker: null },
    },
  ],
  artifacts: [],
};

describe("cross-phase Source audit answer", () => {
  it("recognizes the explicit audit-complete Contract 360 and Optimize question without stealing a narrow readiness question", () => {
    expect(looksLikeCrossPhaseAuditQuestion(auditQuestion)).toBe(true);
    expect(
      looksLikeCrossPhaseAuditQuestion(
        "Which uploaded evidence is parsed and search-ready?",
      ),
    ).toBe(false);
    expect(
      looksLikeCrossPhaseAuditQuestion("Are the vendors ready for award?"),
    ).toBe(false);
  });

  it("reconciles historical gaps, evidence readiness, and Stage 08 blockers before returning the earliest governed action", () => {
    const answer = buildCrossPhaseAuditGovernedAnswer({
      question: auditQuestion,
      event,
      evidence: evidenceAnswer(),
      ndaCoverage: {
        status: "empty",
        asOf: "2026-09-22",
        suppliers: [],
        nextAction: {
          label: "Accept candidate panel",
          detail: "No supplier has explicit candidate-panel acceptance.",
        },
      },
    });

    expect(answer.status).toBe("blocked");
    expect(answer.intent).toBe("source_cross_phase_audit_readiness");
    expect(answer.directAnswer).toContain(
      "Audit completion and Contract 360 / Optimize readiness are not proven",
    );
    expect(answer.directAnswer).toContain(
      "Suppliers & NDA is a historical gap",
    );
    expect(answer.directAnswer).toContain("227 Source artifact records");
    expect(answer.directAnswer).toContain("47 are parsed");
    expect(answer.directAnswer).toContain("180 still require parsing");
    expect(answer.directAnswer).toContain("0 are search-ready");
    expect(answer.directAnswer).toContain("Stage 08 handoff is blocked");
    expect(answer.directAnswer).toContain(
      "Approved pricing is missing from the governed contract-formation package",
    );
    expect(answer.directAnswer).toContain(
      "Change-control provenance is missing from the contract-formation package",
    );
    expect(answer.directAnswer).toContain(
      "One next action: Reconstruct Suppliers & NDA history",
    );
    expect(answer.directAnswer).not.toContain("audit-complete.");
    expect(answer.nextSteps).toEqual([
      expect.objectContaining({
        id: "source-cross-phase-audit-earliest-action",
        label: "Reconstruct Suppliers & NDA history",
      }),
    ]);
    expect(answer.safety.tenantFencePassed).toBe(true);
  });

  it("inherits a failed evidence tenant fence and still refuses completion", () => {
    const answer = buildCrossPhaseAuditGovernedAnswer({
      question: auditQuestion,
      event,
      evidence: evidenceAnswer(false),
      ndaCoverage: {
        status: "ready",
        asOf: "2026-09-22",
        suppliers: [
          {
            legalEntityId: "supplier-1",
            legalName: "Synthetic Supplier One",
            state: "covered_by_nda",
            reason: "Executed NDA is recorded.",
            authorityReference: "nda-1",
            evidenceReference: "candidate-1",
            evidenceCaveats: [],
          },
        ],
        nextAction: {
          label: "Open market package gate",
          detail: "NDA coverage is recorded.",
        },
      },
    });

    expect(answer.status).toBe("blocked");
    expect(answer.safety.tenantFencePassed).toBe(false);
    expect(answer.directAnswer).not.toContain("ready for Contract 360");
  });
});
