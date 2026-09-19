import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SourceAwardSowHandoffReadinessPanel } from "@/components/source/SourceAwardSowHandoffReadinessPanel";
import { SourceActiveStageWorkspace } from "@/components/source/SourceActiveStageWorkspace";
import type { SourceAgentMissionReport } from "@/lib/source/agent-mission-report";
import type { SourceAwardSowHandoffReadiness } from "@/lib/source/award-sow-handoff-readiness-types";
import type {
  SourceArtifactSummary,
  SourcingEventDetail,
} from "@/lib/source/types";

jest.mock("@/components/source/SourceScopeStageWorkspace", () => ({
  SourceScopeStageWorkspace: () =>
    createElement("div", { "data-testid": "scope" }, "Scope"),
}));

jest.mock("@/components/source/SourceDecisionCanvasClient", () => ({
  SourceDecisionCanvasClient: () =>
    createElement("div", { "data-testid": "decision" }, "Decision"),
}));

function readiness(): SourceAwardSowHandoffReadiness {
  return {
    eventId: "event-stage08",
    eventName: "Stage 08 Test Event",
    generatedAt: "2026-04-26T00:00:00.000Z",
    readinessStatus: "blocked_executed_agreement_sow",
    readyForContract360Handoff: false,
    authority: "source-award-sow-handoff-readiness",
    sourceModulesUsed: ["vendor-selection-readiness", "source-stage-gates"],
    rationale: "Read-only test rationale.",
    recommendedNextAction:
      "Executed agreement or SOW evidence is not approved/locked in the event artifact record.",
    completedEvidence: ["Selection gate is approved."],
    blockers: [
      "Executed agreement or SOW evidence is not approved/locked in the event artifact record.",
    ],
    checkpoints: [
      {
        key: "candidate_selection",
        label: "Candidate selection",
        status: "completed",
        completedEvidence: ["Selection gate is approved."],
        blockers: [],
      },
      {
        key: "approval_readiness",
        label: "Approval readiness",
        status: "completed",
        completedEvidence: ["Executive decision stage or gate is approved."],
        blockers: [],
      },
      {
        key: "executed_agreement_sow",
        label: "Executed agreement / SOW",
        status: "blocked",
        completedEvidence: [],
        blockers: [
          "Executed agreement or SOW evidence is not approved/locked in the event artifact record.",
        ],
      },
      {
        key: "contract360_handoff",
        label: "Contract 360 handoff",
        status: "not_open",
        completedEvidence: ["Event is at or beyond Transition."],
        blockers: [
          "Executed agreement or SOW evidence is not approved/locked in the event artifact record.",
        ],
      },
    ],
  };
}

function transitionEvent(
  artifacts: SourceArtifactSummary[] = [],
): SourcingEventDetail {
  return {
    id: "event-stage08",
    code: "SRC-08",
    name: "Stage 08 Active Event",
    accountName: "AbarVa Test",
    leadAgent: "Sentinel",
    archetype: "sourcing",
    rigor: "enhanced",
    status: "active",
    statusLabel: "Active",
    priority: "high",
    currentStageKey: "transition",
    currentStageLabel: "Transition",
    openAlerts: 0,
    owner: "Procurement",
    decisionOwner: "CPO",
    createdByUserId: null,
    agingDays: 3,
    blocker: null,
    nextAction: "Prepare handoff.",
    isAtRisk: false,
    valueAtStakeUsd: 12_000_000,
    projectedValueUsd: 12_000_000,
    realizedValueUsd: 0,
    nextDecision: "Confirm handoff readiness.",
    synopsis: "Stage 08 handoff test event.",
    problemStatement: "Confirm award and SOW handoff readiness.",
    stages: [
      {
        key: "executive_decision",
        label: "Executive Decision",
        status: "complete",
        summary: "Decision approved.",
        gate: {
          id: "gate-exec",
          label: "Executive gate",
          status: "approved",
          ownerRole: "CPO",
          requiredArtifacts: [],
          blocker: null,
        },
      },
      {
        key: "selection",
        label: "Selection",
        status: "complete",
        summary: "Selection approved.",
        gate: {
          id: "gate-selection",
          label: "Selection gate",
          status: "approved",
          ownerRole: "CPO",
          requiredArtifacts: [],
          blocker: null,
        },
      },
      {
        key: "transition",
        label: "Transition",
        status: "active",
        summary: "Prepare handoff.",
        gate: {
          id: "gate-transition",
          label: "Transition gate",
          status: "ready",
          ownerRole: "Transition Owner",
          requiredArtifacts: [],
          blocker: null,
        },
      },
    ],
    alerts: [],
    artifacts,
    scorecard: {
      decisionOwner: "CPO",
      reviewCadence: "Weekly",
      approvalState: "approved",
      criteria: [],
    },
    valueLedger: {
      updatedAt: "2026-08-10T12:00:00.000Z",
      projected: [],
      realized: [],
    },
    dataReadiness: [],
  };
}

describe("Source Stage 08 Award & SOW handoff readiness panel", () => {
  it("renders completed evidence, blockers, and exactly one next action", () => {
    const html = renderToStaticMarkup(
      createElement(SourceAwardSowHandoffReadinessPanel, {
        readiness: readiness(),
      }),
    );

    expect(html).toContain("Stage 08 · Award &amp; SOW handoff");
    expect(html).toContain("Candidate selection");
    expect(html).toContain("Approval readiness");
    expect(html).toContain("Executed agreement / SOW");
    expect(html).toContain("Contract 360 handoff");
    expect(html).toContain("Completed evidence");
    expect(html).toContain("Blockers");
    expect(html.match(/Exactly one next action/g)).toHaveLength(1);
    expect(html).toContain(
      "does not create awards, approvals, contracts, SOWs, or Contract 360 records",
    );
  });

  it("surfaces Stage 08 readiness inside the active transition workspace", () => {
    const html = renderToStaticMarkup(
      createElement(SourceActiveStageWorkspace, {
        event: transitionEvent(),
        missionReport: {
          recommendedNextAction: "Prepare handoff.",
        } as SourceAgentMissionReport,
        missionPreviewMissions: [],
      }),
    );

    expect(html).toContain("Stage 08 · Award &amp; SOW handoff");
    expect(html).toContain("Ready for canonical Contract 360 handoff?");
    expect(html).toContain(
      "Executed agreement or SOW evidence is not approved/locked",
    );
  });

  it("keeps pending-signature contract records blocked in the rendered transition workspace", () => {
    const html = renderToStaticMarkup(
      createElement(SourceActiveStageWorkspace, {
        event: transitionEvent([
          {
            id: "d27_selection_memo",
            title: "Selection memo",
            kind: "decision_memo",
            status: "approved",
            summary: "Selection memo.",
            sourceCount: 1,
            updatedAt: "2026-04-26T00:00:00.000Z",
          },
          {
            id: "d24_decision_brief",
            title: "Executive decision brief",
            kind: "decision_memo",
            status: "approved",
            summary: "Executive approval.",
            sourceCount: 1,
            updatedAt: "2026-04-26T00:00:00.000Z",
          },
          {
            id: "d28_contract_record",
            title: "Contract record pending signature gap log",
            kind: "artifact_packet",
            status: "locked",
            summary:
              "Contract-ready pending signature; signed contract not uploaded; final SOW missing.",
            sourceCount: 1,
            updatedAt: "2026-04-26T00:00:00.000Z",
          },
        ]),
        missionReport: {
          recommendedNextAction: "Prepare handoff.",
        } as SourceAgentMissionReport,
        missionPreviewMissions: [],
      }),
    );

    expect(html).toContain("Executed agreement/SOW blocked");
    expect(html).toContain(
      "Executed agreement or SOW evidence is not approved/locked",
    );
    expect(html).toContain("Handoff ready: no");
  });
});
