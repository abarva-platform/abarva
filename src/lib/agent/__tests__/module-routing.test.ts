import type { StageAnalyticsView } from "@/components/source/canvas/analytics/view-model";
import {
  buildSourceAvaChatPacket,
  type SourceAvaChatPacket,
} from "@/lib/source/ava/module-expert";
import {
  canAvaModuleHandoff,
  getAvaModuleExpertContract,
  getExecutableSurfaceScope,
  resolveAvaModuleSurface,
  routeAvaModuleHandoff,
} from "../module-routing";

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

function sourcePacket(): SourceAvaChatPacket {
  return buildSourceAvaChatPacket(
    {
      tenant: "Demo Tenant",
      event: BLOCKED_EVENT,
      viewStageKey: "rfp",
      stageView: RFP_STAGE_VIEW,
      factInputs: {},
      artifacts: [],
      approvedStageKeys: ["strategy", "scope"],
    },
    "I found a prior-auth automation opportunity, what next?",
  );
}

describe("aVa module routing", () => {
  it("resolves product routes to executable surface scopes", () => {
    expect(resolveAvaModuleSurface("/source/events/src-1")).toBe("source");
    expect(resolveAvaModuleSurface("/strategic-moves/new")).toBe("moves");
    expect(resolveAvaModuleSurface("/tower")).toBe("tower");
    expect(getExecutableSurfaceScope("/source/events/src-1")?.handoffTargets).toContain(
      "moves",
    );
  });

  it("exposes the implemented module expert contracts", () => {
    expect(getAvaModuleExpertContract("moves").surface).toBe("moves");
    expect(getAvaModuleExpertContract("source").surface).toBe("source");
    expect(getAvaModuleExpertContract("tower").surface).toBe("tower");
  });

  it("PHASE 4 EXIT CRITERION: routes Source opportunity context to Moves P0 with payload", () => {
    const handoff = routeAvaModuleHandoff({
      surface: "/source/events/src-1",
      question: "I found a prior-auth automation opportunity, what next?",
      sourcePacket: sourcePacket(),
    });

    expect(handoff).toMatchObject({
      fromSurface: "source",
      toSurface: "moves",
      intent: "source_opportunity_to_moves_p0",
      targetRoute: "/strategic-moves/new",
      payload: {
        movePhase: 0,
        movePhaseLabel: "P0 Originate",
        prefill: {
          candidateIdea: "Prior-auth automation opportunity",
          proposedMoveTitle: "Prior-auth Automation Opportunity",
          originatingSurface: "source",
        },
        sourceContext: {
          eventCode: "SRC-DEMO-PA-001",
          eventName: "Prior Authorization Automation Sourcing",
          currentStageLabel: "RFP",
          blocker: "Security questionnaire evidence is still missing",
          nextAction: "Upload the security questionnaire evidence before releasing the RFP",
          gateSummary: "1 of 2 tasks complete; evidence box UNMET",
          citationLabels: ["[S1]", "[G1]", "[B1]", "[A1]"],
        },
      },
    });
  });

  it("uses the scope registry to reject unsupported handoff targets", () => {
    expect(canAvaModuleHandoff("source", "moves")).toBe(true);
    expect(canAvaModuleHandoff("source", "intelligence")).toBe(false);
  });
});
