import type { StageAnalyticsView } from "@/components/source/canvas/analytics/view-model";
import {
  buildDeterministicSourceAvaBlockedNextActionAnswer,
  buildSourceAvaChatPacket,
  SOURCE_AVA_MODULE_EXPERT_CONTRACT,
} from "../module-expert";

const BLOCKED_EVENT = {
  code: "SRC-DEMO-PA-001",
  name: "Prior Authorization Automation Sourcing",
  currentStageKey: "rfp",
  blocker: "Security questionnaire evidence is still missing",
  nextAction: "Upload the security questionnaire evidence before releasing the RFP",
};

const RFP_STAGE_VIEW: StageAnalyticsView = {
  stageKey: "rfp",
  stageName: "RFP",
  purpose: "Prepare the buyer-ready RFP package.",
  intel: {
    provenance: "live",
    lead: "RFP readiness is tied to evidence-backed package quality.",
    points: [],
  },
  tasks: [
    {
      id: "rfp.security-questionnaire",
      title: "Provide the security questionnaire evidence",
      subtitle: "Required risk evidence",
      type: "provide",
      state: "todo",
      guide: "Upload the completed questionnaire.",
      cta: "Confirm security evidence",
    },
    {
      id: "rfp.scope-locked",
      title: "Confirm final RFP scope",
      subtitle: "Scope memo approved",
      type: "confirm",
      state: "done",
      guide: "Confirm the scope boundary is ready for release.",
      cta: "Confirm scope",
      evidenceComplete: true,
    },
  ],
  gate: {
    approver: "Executive sponsor",
    confirms: [
      {
        label: "Evidence complete",
        detail: "Required RFP evidence is present and reviewed.",
      },
      {
        label: "Scope ready",
        detail: "Scope boundary is ready for supplier release.",
      },
    ],
    generates: [{ label: "RFP Package", code: "d10_rfp_package" }],
    nextStageName: "Responses",
  },
};

describe("SOURCE_AVA_MODULE_EXPERT_CONTRACT", () => {
  it("declares Source as the module surface", () => {
    expect(SOURCE_AVA_MODULE_EXPERT_CONTRACT.surface).toBe("source");
  });

  it("classifies through the shared module-expert contract", () => {
    expect(
      SOURCE_AVA_MODULE_EXPERT_CONTRACT.classifyQuestion({
        question: "Where is this event blocked and what do I do next?",
        viewedStage: "rfp",
      }).mode,
    ).toBe("event_status");
  });
});

describe("Source module expert eval — blocked event next action", () => {
  it("answers from packet stage/gate state with citations", () => {
    const question = "Where is this event blocked and what do I do next?";
    const packet = buildSourceAvaChatPacket(
      {
        tenant: "Demo Tenant",
        event: BLOCKED_EVENT,
        viewStageKey: "rfp",
        stageView: RFP_STAGE_VIEW,
        factInputs: {},
        artifacts: [],
        approvedStageKeys: ["strategy", "scope"],
      },
      question,
    );

    const answer = buildDeterministicSourceAvaBlockedNextActionAnswer(packet);

    expect(answer).not.toBeNull();
    expect(answer).toContain("Prior Authorization Automation Sourcing");
    expect(answer).toContain(
      "blocked at RFP: Security questionnaire evidence is still missing",
    );
    expect(answer).toContain("Security questionnaire evidence is still missing");
    expect(answer).toContain("Upload the security questionnaire evidence");
    expect(answer).toContain("1 of 2 tasks complete");
    expect(answer).toContain("[S1]");
    expect(answer).toContain("[G1]");
    expect(answer).toContain("[A1]");

    const gateResult = SOURCE_AVA_MODULE_EXPERT_CONTRACT.runQualityGate(
      answer!,
      packet,
      packet.answerMode,
    );
    expect(gateResult.passed).toBe(true);
    expect(gateResult.unresolvedChecks).toEqual([]);
  });

  it("does not fabricate gate completion when the stage gate view is missing", () => {
    const packet = buildSourceAvaChatPacket(
      {
        tenant: "Demo Tenant",
        event: BLOCKED_EVENT,
        viewStageKey: "rfp",
      },
      "Where is this event blocked and what do I do next?",
    );

    const answer = buildDeterministicSourceAvaBlockedNextActionAnswer(packet);

    expect(answer).toContain("stage gate view was not computed");
    expect(answer).toContain("[S1]");
    expect(answer).not.toContain("[G1]");
  });
});
