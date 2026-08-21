const getProgramByIdMock = jest.fn();
const fromMock = jest.fn();

let deliverablesFixture: Array<{
  id: string;
  deliverable_type_key: string;
  status: string;
}>;
let modulesFixture: Array<{
  module_key: string;
  status: string;
  state_jsonb?: Record<string, unknown> | null;
}>;
let participantsFixture: Array<{ approval_authority: string | null }>;
let approvalRequestsFixture: Array<{
  request_status: string | null;
  brief_snapshot: Record<string, unknown> | null;
}>;
let milestonesFixture: Array<{
  id: string;
  name: string | null;
  status: string | null;
}>;
let evidenceFixture: Array<{ id: string }>;
let deliverableVersionsFixture: Array<{
  content: string | null;
  structured_data: Record<string, unknown> | null;
  generated_at: string;
}>;
let roleApprovalsFixture: Array<{
  role: string;
  status: string;
  approver_user_id: string | null;
  approver_name: string | null;
  outstanding_conditions: string | null;
  decided_at: string | null;
}>;

jest.mock("@/lib/programs/queries", () => ({
  __esModule: true,
  getProgramById: (...args: unknown[]) => getProgramByIdMock(...args),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  __esModule: true,
  getAzureWriteFluentClient: () => ({ from: fromMock }),
}));

import { evaluateGate } from "@/lib/programs/governance";

function tableResult(table: string) {
  if (table === "deliverables_v2") {
    const filters: Record<string, unknown> = {};
    const chain: {
      select: jest.Mock;
      eq: jest.Mock;
      maybeSingle: jest.Mock;
      then: <TResult1 = { data: typeof deliverablesFixture }, TResult2 = never>(
        onfulfilled?:
          | ((value: {
              data: typeof deliverablesFixture;
            }) => TResult1 | PromiseLike<TResult1>)
          | null,
        onrejected?:
          | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
          | null,
      ) => Promise<TResult1 | TResult2>;
    } = {
      select: jest.fn(() => chain),
      eq: jest.fn((field: string, value: unknown) => {
        filters[field] = value;
        return chain;
      }),
      maybeSingle: jest.fn(() => {
        const row = deliverablesFixture.find((deliverable) => {
          if (filters.id && deliverable.id !== filters.id) return false;
          return true;
        });
        return Promise.resolve({
          data: row
            ? {
                ...row,
                created_by: "person-1",
                current_version: 1,
                signed_off_version: row.status === "signed_off" ? 1 : null,
              }
            : null,
          error: null,
        });
      }),
      then: (onfulfilled, onrejected) =>
        Promise.resolve({ data: deliverablesFixture }).then(
          onfulfilled,
          onrejected,
        ),
    };
    return {
      select: chain.select,
    };
  }

  if (table === "program_modules") {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: modulesFixture })),
      })),
    };
  }

  if (table === "engagement_participants") {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: participantsFixture })),
      })),
    };
  }

  if (table === "program_approval_requests") {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() =>
              Promise.resolve({ data: approvalRequestsFixture }),
            ),
          })),
        })),
      })),
    };
  }

  if (table === "program_milestones") {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: milestonesFixture })),
        })),
      })),
    };
  }

  if (table === "deliverable_versions") {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() =>
              Promise.resolve({ data: deliverableVersionsFixture }),
            ),
          })),
        })),
      })),
    };
  }

  if (table === "deliverable_role_approvals") {
    const chain: {
      select: jest.Mock;
      eq: jest.Mock;
      then: <
        TResult1 = { data: typeof roleApprovalsFixture; error: null },
        TResult2 = never,
      >(
        onfulfilled?:
          | ((value: {
              data: typeof roleApprovalsFixture;
              error: null;
            }) => TResult1 | PromiseLike<TResult1>)
          | null,
        onrejected?:
          | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
          | null,
      ) => Promise<TResult1 | TResult2>;
    } = {
      select: jest.fn(() => chain),
      eq: jest.fn(() => chain),
      then: (onfulfilled, onrejected) =>
        Promise.resolve({ data: roleApprovalsFixture, error: null }).then(
          onfulfilled,
          onrejected,
        ),
    };
    return {
      select: chain.select,
    };
  }

  if (table === "program_evidence_items") {
    return {
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          in: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: evidenceFixture })),
          })),
        })),
      })),
    };
  }

  throw new Error(`Unexpected table ${table}`);
}

describe("evaluateGate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 4,
      archetype: "analytics_modernization",
    });
    deliverablesFixture = [
      {
        id: "business-case",
        deliverable_type_key: "business_case",
        status: "signed_off",
      },
      {
        id: "readiness",
        deliverable_type_key: "readiness_and_change_plan",
        status: "signed_off",
      },
      {
        id: "roadmap",
        deliverable_type_key: "execution_roadmap",
        status: "signed_off",
      },
    ];
    modulesFixture = [
      { module_key: "funding_approval", status: "completed" },
      { module_key: "sponsor_alignment", status: "completed" },
    ];
    participantsFixture = [];
    approvalRequestsFixture = [];
    milestonesFixture = [{ id: "m-1", name: "Mobilize", status: "upcoming" }];
    evidenceFixture = [];
    deliverableVersionsFixture = [];
    roleApprovalsFixture = [];
    fromMock.mockImplementation(tableResult);
  });

  it("does not let P4 module completion replace signed roadmap, business case, and change plan artifacts", async () => {
    // The P4→P5 gate folds in funding/mobilization concerns under the
    // 6-phase doctrine. Module completion alone (without the signed
    // execution_roadmap, business_case, and readiness_and_change_plan
    // deliverables) must not pass the hard checks.
    deliverablesFixture = [];
    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1" },
      "program-1",
      4,
      5,
    );

    expect(result.pass).toBe(false);
    expect(result.failedChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          check: "execution_roadmap_drafted",
          severity: "hard",
        }),
        expect.objectContaining({
          check: "business_case_approved",
          severity: "hard",
        }),
        expect.objectContaining({
          check: "readiness_and_change_plan_signed_off",
          severity: "hard",
        }),
      ]),
    );
  });

  it("blocks business_case_approved when the deliverable is signed off but its required roles are not all approved", async () => {
    // business_case requires business+finance approval (REQUIRED_APPROVAL_ROLES
    // in deliverable-role-approvals.ts). Single-actor sign-off alone must no
    // longer be sufficient for a covered type.
    deliverablesFixture = [
      {
        id: "business-case",
        deliverable_type_key: "business_case",
        status: "signed_off",
      },
      {
        id: "readiness",
        deliverable_type_key: "readiness_and_change_plan",
        status: "signed_off",
      },
      {
        id: "roadmap",
        deliverable_type_key: "execution_roadmap",
        status: "signed_off",
      },
    ];
    roleApprovalsFixture = [
      {
        role: "business",
        status: "approved",
        approver_user_id: "person-1",
        approver_name: "Jane Doe, CEO",
        outstanding_conditions: null,
        decided_at: "2026-07-20T00:00:00Z",
      },
      // finance still pending — not all required roles approved.
    ];

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1" },
      "program-1",
      4,
      5,
    );

    expect(result.pass).toBe(false);
    expect(result.failedChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          check: "business_case_approved",
          severity: "hard",
        }),
      ]),
    );
  });

  it("passes business_case_approved once the deliverable is signed off AND every required role is approved", async () => {
    deliverablesFixture = [
      {
        id: "business-case",
        deliverable_type_key: "business_case",
        status: "signed_off",
      },
      {
        id: "readiness",
        deliverable_type_key: "readiness_and_change_plan",
        status: "signed_off",
      },
      {
        id: "roadmap",
        deliverable_type_key: "execution_roadmap",
        status: "signed_off",
      },
    ];
    roleApprovalsFixture = [
      {
        role: "business",
        status: "approved",
        approver_user_id: "person-1",
        approver_name: "Jane Doe, CEO",
        outstanding_conditions: null,
        decided_at: "2026-07-20T00:00:00Z",
      },
      {
        role: "finance",
        status: "approved",
        approver_user_id: "person-2",
        approver_name: "John Smith, CFO",
        outstanding_conditions: null,
        decided_at: "2026-07-20T00:05:00Z",
      },
    ];

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1" },
      "program-1",
      4,
      5,
    );

    expect(result.failedChecks).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ check: "business_case_approved" }),
      ]),
    );
  });

  it("does not require any role approval for a deliverable type absent from REQUIRED_APPROVAL_ROLES (existing single-actor sign-off is unaffected)", async () => {
    // 'design_brief' is a design_approved alias but NOT itself a key in
    // REQUIRED_APPROVAL_ROLES (only target_state_architecture and
    // operating_model_design are) — signed_off alone must remain sufficient,
    // with no deliverable_role_approvals row needed at all.
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 3,
      archetype: null,
    });
    deliverablesFixture = [
      {
        id: "design",
        deliverable_type_key: "design_brief",
        status: "signed_off",
      },
      {
        id: "trace",
        deliverable_type_key: "requirements_traceability",
        status: "signed_off",
      },
    ];
    roleApprovalsFixture = [];

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1" },
      "program-1",
      3,
      4,
    );

    expect(result.failedChecks).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ check: "design_approved" }),
      ]),
    );
  });

  it("uses any signed-off design-family deliverable instead of letting an older generated draft mask the approved design spec", async () => {
    // Live sandbox regression 2026-07-23: P3 generated artifacts created
    // design-family rows before the user accepted a compact design_spec. The
    // gate must evaluate the family, not whichever row Postgres happens to
    // return first, otherwise a stale in_review generated row can hide a valid
    // signed-off design record.
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 3,
      archetype: null,
    });
    deliverablesFixture = [
      {
        id: "architecture-draft",
        deliverable_type_key: "target_state_architecture",
        status: "in_review",
      },
      {
        id: "design-spec",
        deliverable_type_key: "design_spec",
        status: "signed_off",
      },
      {
        id: "trace",
        deliverable_type_key: "requirements_traceability",
        status: "signed_off",
      },
    ];
    modulesFixture = [];
    roleApprovalsFixture = [];

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1" },
      "program-1",
      3,
      4,
    );

    expect(result.failedChecks).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ check: "design_approved" }),
      ]),
    );
  });

  it("regression: a P3 architecture deliverable whose generation is still pending (in_review, not signed off) does not satisfy design_approved", async () => {
    // Phase Advancement Control audit, scenario "pending generation": a
    // deliverables_v2 row can exist (generation started) without being
    // signed off yet. This must block the hard check exactly like a
    // missing row — advancement while generation is still in flight must
    // never be treated as a pass.
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 3,
      archetype: null,
    });
    deliverablesFixture = [
      {
        id: "design",
        deliverable_type_key: "target_state_architecture",
        status: "in_review",
      },
    ];
    modulesFixture = [];

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1" },
      "program-1",
      3,
      4,
    );

    expect(result.pass).toBe(false);
    expect(result.failedChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ check: "design_approved", severity: "hard" }),
      ]),
    );
  });

  it("regression: a P3 architecture deliverable whose generation failed does not satisfy design_approved", async () => {
    // Phase Advancement Control audit, scenario "failed generation": a
    // deliverables_v2 row with a failed/errored status must block the hard
    // check, not be silently treated as present-and-fine.
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 3,
      archetype: null,
    });
    deliverablesFixture = [
      {
        id: "design",
        deliverable_type_key: "target_state_architecture",
        status: "error",
      },
    ];
    modulesFixture = [];

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1" },
      "program-1",
      3,
      4,
    );

    expect(result.pass).toBe(false);
    expect(result.failedChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ check: "design_approved", severity: "hard" }),
      ]),
    );
  });

  it("regression: requirements_design_outcome_trace no longer passes on free text alone with zero real P3 deliverables and no completed module (the live incident)", async () => {
    // Live incident 2026-07-20: a real Move (MEMBER AI ASSIST) advanced
    // P3->P4 with 0 P3 deliverables ever generated, because this hard check's
    // free-text fallback matched generic words ("outcome", "validation") in
    // an in-progress (not completed) phase_3_* module's captured text alone.
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 3,
      archetype: null,
    });
    deliverablesFixture = [];
    modulesFixture = [
      {
        module_key: "phase_3_design_notes",
        status: "in_progress",
        state_jsonb: {
          value:
            "Recommended outcome: proceed with validation of the design choice next.",
        },
      },
    ];

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1" },
      "program-1",
      3,
      4,
    );

    expect(result.failedChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          check: "requirements_design_outcome_trace",
          severity: "hard",
        }),
      ]),
    );
  });

  it("requirements_design_outcome_trace passes on free text once the phase_3 module is actually completed (real user action, not just draft text)", async () => {
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 3,
      archetype: null,
    });
    deliverablesFixture = [];
    modulesFixture = [
      {
        module_key: "phase_3_design_notes",
        status: "completed",
        state_jsonb: {
          value:
            "Recommended outcome: proceed with validation of the design choice next.",
        },
      },
    ];

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1" },
      "program-1",
      3,
      4,
    );

    expect(result.failedChecks).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ check: "requirements_design_outcome_trace" }),
      ]),
    );
  });

  it("regression: P5 launch/cadence checks do not pass on free text alone without signed deliverables or completed modules", async () => {
    // These hard checks must be backed by signed P5 deliverables or completed
    // phase modules, never by draft free text alone.
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 5,
      archetype: "agent_assist",
    });
    deliverablesFixture = [
      {
        id: "handoff",
        deliverable_type_key: "handoff_package",
        status: "draft",
      },
      {
        id: "value-contract",
        deliverable_type_key: "value_measurement_contract",
        status: "draft",
      },
    ];
    modulesFixture = [
      {
        module_key: "phase_5_launch_readiness",
        status: "in_progress",
        state_jsonb: {
          value:
            "Draft notes: launch readiness go/no-go criteria still being worked.",
        },
      },
      {
        module_key: "phase_5_governance_cadence",
        status: "in_progress",
        state_jsonb: {
          value:
            "Draft notes: tower cadence and governance review still being worked.",
        },
      },
    ];

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1" },
      "program-1",
      5,
      6,
    );

    expect(result.failedChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          check: "launch_readiness_attested",
          severity: "hard",
        }),
        expect.objectContaining({
          check: "tower_cadence_defined",
          severity: "hard",
        }),
      ]),
    );
  });

  it("blocks P2 to P3 when the signed Discovery report declares unresolved hard gaps", async () => {
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 2,
      archetype: "ams_consolidation",
    });
    deliverablesFixture = [
      {
        id: "discovery-report",
        deliverable_type_key: "discovery_report",
        status: "signed_off",
      },
    ];
    evidenceFixture = [{ id: "p2-workshop-notes" }];
    deliverableVersionsFixture = [
      {
        content:
          "P2 Discover & Diagnose synthesis. HARD gaps: Technical Owner not yet named; " +
          "MTTR baseline not yet pulled from ITSM. CONDITIONAL PROCEED. Do not advance to P3 design until baseline attestation is complete.",
        structured_data: null,
        generated_at: "2026-05-02T00:00:00.000Z",
      },
    ];

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1" },
      "program-1",
      2,
      3,
    );

    expect(result.pass).toBe(false);
    expect(result.failedChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          check: "discovery_baseline_attested",
          severity: "hard",
        }),
        expect.objectContaining({
          check: "discovery_stakeholders_named",
          severity: "hard",
        }),
        expect.objectContaining({
          check: "p2_readiness_cleared",
          reason: expect.stringContaining(
            "signed Discovery Report still contains unresolved hard-gap",
          ),
          severity: "hard",
        }),
      ]),
    );
    expect(result.requiresApproval).toBe(false);
  });

  it("accepts signed P2 Discovery Report content as ingested workshop evidence", async () => {
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 2,
      archetype: "analytics_modernization",
    });
    deliverablesFixture = [
      {
        id: "discovery-report",
        deliverable_type_key: "discovery_report",
        status: "signed_off",
      },
    ];
    evidenceFixture = [];
    deliverableVersionsFixture = [
      {
        content:
          "P2 Discovery Report. Attendees: Dr. Anita Krishnamurthy sponsor, Marcus Chen data owner, " +
          "Linda Tran clinical informatics, Priya Nair revenue cycle, and Omar Haddad security. " +
          "Workshop notes: data discovery session mapped Epic, claims, coding, prior auth, and VBC feeds. " +
          "Baselines captured and owner attestation recorded. Source of record: Meridian analytics intake log and Epic/claims lineage workshop. " +
          "Stakeholder map names required owners. Contradiction: shadow SaaS tools bypass central lineage. " +
          "P3 readiness recommendation: proceed to Design.",
        structured_data: null,
        generated_at: "2026-05-02T00:00:00.000Z",
      },
    ];

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1" },
      "program-1",
      2,
      3,
    );

    expect(result.failedChecks.map((check) => check.check)).not.toContain(
      "discovery_notes_ingested",
    );
    expect(
      result.failedChecks.filter((check) => check.severity === "hard"),
    ).toEqual([]);
    expect(result.requiresApproval).toBe(true);
  });

  it("accepts completed P2 phase capture as discovery notes and stakeholder evidence", async () => {
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 2,
      archetype: "contact_center_agent_assist",
    });
    deliverablesFixture = [
      {
        id: "discovery-report",
        deliverable_type_key: "discovery_report",
        status: "signed_off",
      },
    ];
    evidenceFixture = [];
    deliverableVersionsFixture = [];
    modulesFixture = [
      {
        module_key: "phase_2_current_state_findings",
        status: "completed",
        state_jsonb: {
          value:
            "Current state findings show fragmented claims, CRM, prior authorization, benefits, knowledge, and call-center process evidence.",
        },
      },
      {
        module_key: "phase_2_baseline_metrics",
        status: "completed",
        state_jsonb: {
          value:
            "Baseline metrics captured: average handle time, first-call resolution, transfer rate, repeat contact, cost, quality, and volume.",
        },
      },
      {
        module_key: "phase_2_gaps_root_causes",
        status: "completed",
        state_jsonb: {
          value:
            "Gaps and root causes are evidence-backed and explain data quality, workflow, and governance blockers.",
        },
      },
      {
        module_key: "phase_2_process_handoffs",
        status: "completed",
        state_jsonb: {
          value:
            "Process handoffs name operations, supervisor queues, compliance, security, architecture, and data ownership roles.",
        },
      },
      {
        module_key: "phase_2_data_quality_governance",
        status: "completed",
        state_jsonb: {
          value:
            "Data quality and governance findings name source ownership, privacy controls, audit evidence, and steward accountability.",
        },
      },
      {
        module_key: "phase_2_evidence_confidence",
        status: "completed",
        state_jsonb: {
          value:
            "Evidence confidence marks which findings are strong, partial, stale, synthetic, or require client completion.",
        },
      },
      {
        module_key: "phase_2_recommendation",
        status: "completed",
        state_jsonb: {
          value:
            "Recommendation: proceed to Design with no unresolved hard gaps, carrying caveats around source readiness.",
        },
      },
    ];

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1" },
      "program-1",
      2,
      3,
    );

    expect(result.failedChecks.map((check) => check.check)).not.toContain(
      "discovery_notes_ingested",
    );
    expect(result.failedChecks.map((check) => check.check)).not.toContain(
      "discovery_stakeholders_named",
    );
    expect(
      result.failedChecks.filter((check) => check.severity === "hard"),
    ).toEqual([]);
    expect(result.requiresApproval).toBe(true);
  });

  it("does not block P2 to P3 on future-looking P3 gate risks in the signed Discovery Report", async () => {
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 2,
      archetype: "store_operations_analytics",
    });
    deliverablesFixture = [
      {
        id: "discovery-report",
        deliverable_type_key: "discovery_report",
        status: "signed_off",
      },
    ];
    evidenceFixture = [];
    deliverableVersionsFixture = [
      {
        content:
          "P1 Discovery Report. Attendees: Carlos Rivera sponsor, Priya Iyer lead, " +
          "Brandon Hayes store operations, James Wright data products, and Michael Tanaka supply chain. " +
          "Workshop notes: POS/RMS/WMS lineage workshop captured inventory accuracy, replenishment exception cycle time, " +
          "digital substitution rate, store task SLA, and demand forecast override rate. " +
          "Baselines captured and owner attestation recorded. Source of record: POS/RMS/WMS lineage workshop and store operations intake log. " +
          "Stakeholder map names required owners. Contradiction: digital promise accuracy depends on near-real-time item availability, but Oracle RMS and WMS are batch-lagged. " +
          "Security/compliance owner not yet named; this is a soft gap at P2 but becomes a hard blocker at P3→P4 and must be named before P3 gate close. " +
          "P3 readiness recommendation: proceed to Design.",
        structured_data: null,
        generated_at: "2026-05-02T00:00:00.000Z",
      },
    ];

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1" },
      "program-1",
      2,
      3,
    );

    expect(
      result.failedChecks.filter((check) => check.severity === "hard"),
    ).toEqual([]);
    expect(result.requiresApproval).toBe(true);
  });

  it("does not block P2 to P3 on P3-entry soft follow-ups in the signed Discovery Report", async () => {
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 2,
      archetype: "digital_banking_risk_controls",
    });
    deliverablesFixture = [
      {
        id: "discovery-report",
        deliverable_type_key: "discovery_report",
        status: "signed_off",
      },
    ];
    evidenceFixture = [];
    deliverableVersionsFixture = [
      {
        content:
          "P1 Discovery Report. Attendees: Ethan Brooks sponsor, Lena Ortiz lead, " +
          "Rachel Singh fraud operations, Priya Mehta compliance, Nadia Torres model risk, James Liu data platform, and Kevin Walsh internal audit. " +
          "Workshop notes: digital onboarding, fraud, payments, KYC/AML, model-risk inventory, and audit evidence repository were mapped. " +
          "Baselines captured and owner attestation recorded. Source of record: First Capital risk-control intake log and workshop notes. " +
          "Stakeholder map names required human owners with no hard-owner gaps. " +
          "Contradiction: audit remediation urgency is high, but evidence lineage is scattered across control teams. " +
          "Two soft items outstanding — Kevin Walsh to confirm audit-finding register extract at P3 entry and Lena Ortiz to confirm system-level data access rights before P3 scoping begins. " +
          "These are flagged for P3 entry resolution, not blocking advance. No unresolved hard gaps. " +
          "P3 readiness recommendation: proceed to Design.",
        structured_data: null,
        generated_at: "2026-05-02T00:00:00.000Z",
      },
    ];

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1" },
      "program-1",
      2,
      3,
    );

    expect(
      result.failedChecks.filter((check) => check.severity === "hard"),
    ).toEqual([]);
    expect(result.requiresApproval).toBe(true);
  });

  it("accepts a signed P0 origination brief as the seed artifact without overloading discovery_report", async () => {
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 0,
      archetype: null,
    });
    deliverablesFixture = [
      {
        id: "origination-brief",
        deliverable_type_key: "origination_brief",
        status: "signed_off",
      },
    ];
    participantsFixture = [{ approval_authority: "sponsor" }];
    approvalRequestsFixture = [];
    deliverableVersionsFixture = [
      {
        content:
          "P0 Origination Brief. Problem trigger: Epic, claims, coding, and prior-auth analytics are fragmented. " +
          "Value hypothesis: a governed analytics modernization will improve trusted delivery speed through a shared evidence family. " +
          "Scope boundary: prior authorization and coding quality use case first. " +
          "P1 handoff: first evidence request is current-state analytics cycle time and data lineage completeness. " +
          "Discovery capacity time box: four-week P1 discovery.",
        structured_data: null,
        generated_at: "2026-05-02T00:00:00.000Z",
      },
    ];

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1" },
      "program-1",
      0,
      1,
    );

    expect(result.failedChecks).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ check: "program_seed_recorded" }),
        expect.objectContaining({ check: "value_hypothesis_seed" }),
      ]),
    );
    expect(result.failedChecks.map((check) => check.check)).not.toContain(
      "discovery_report_signed_off",
    );
  });

  it("accepts sponsor evidence inside a signed P0 origination brief for live-created programs", async () => {
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 0,
      archetype: "platform_modernization",
    });
    deliverablesFixture = [
      {
        id: "origination-brief",
        deliverable_type_key: "origination_brief",
        status: "signed_off",
      },
    ];
    participantsFixture = [];
    approvalRequestsFixture = [];
    deliverableVersionsFixture = [
      {
        content:
          "P0 Origination Brief. Sponsor: Dr. Anita Krishnamurthy. " +
          "Problem trigger: Epic, claims, coding, and prior-auth analytics are fragmented. " +
          "Value hypothesis: a governed analytics modernization will improve trusted delivery speed. " +
          "Scope boundary: prior authorization and coding quality first cohort. " +
          "P1 handoff: first evidence family is source-system inventory, data lineage, and analytics cycle time. " +
          "Discovery capacity envelope: four-week P1 discovery with sponsor cadence.",
        structured_data: null,
        generated_at: "2026-05-02T00:00:00.000Z",
      },
    ];

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1" },
      "program-1",
      0,
      1,
    );

    expect(result.failedChecks.map((check) => check.check)).not.toContain(
      "sponsor_assigned",
    );
    expect(
      result.failedChecks.filter((check) => check.severity === "hard"),
    ).toEqual([]);
    expect(result.requiresApproval).toBe(true);
  });

  it("combines approved Setup brief and signed P0 seed text for the value-hypothesis gate", async () => {
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 0,
      archetype: "platform_modernization",
    });
    deliverablesFixture = [
      {
        id: "origination-brief",
        deliverable_type_key: "origination_brief",
        status: "signed_off",
      },
    ];
    participantsFixture = [];
    approvalRequestsFixture = [
      {
        request_status: "approved",
        brief_snapshot: {
          sponsor: "Dr. Anita Krishnamurthy",
          problem_statement:
            "Epic, claims, coding, prior-auth, and VBC analytics are fragmented.",
          target_outcome:
            "Improve trusted analytics delivery speed and quality.",
        },
      },
    ];
    deliverableVersionsFixture = [
      {
        content:
          "Status: P0 seed signed off. Value hypothesis: governed analytics modernization improves trusted delivery speed. " +
          "First cohort: care coordination and revenue-cycle analytics. " +
          "Evidence family: source-system inventory, lineage baseline, and analytics cycle time. " +
          "Discovery capacity envelope: four-week P1 discovery.",
        structured_data: null,
        generated_at: "2026-05-02T00:00:00.000Z",
      },
    ];

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1" },
      "program-1",
      0,
      1,
    );

    expect(result.failedChecks.map((check) => check.check)).not.toContain(
      "value_hypothesis_seed",
    );
    expect(
      result.failedChecks.filter((check) => check.severity === "hard"),
    ).toEqual([]);
    expect(result.requiresApproval).toBe(true);
  });

  it("evaluates P0 approval from the seven saved charter fields instead of brittle generated-brief keywords", async () => {
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 0,
      archetype: "ai_product_enablement",
      problemStatement:
        "Members experience long calls because agents navigate disconnected systems.",
      targetOutcome:
        "Lower avoidable handle time while improving first-call resolution.",
      timelineHorizon:
        "Trusted access to CRM, claims, eligibility, prior authorization, knowledge, audit logs, and PHI controls.",
      charter: {
        problem_statement:
          "Members experience long calls because agents navigate disconnected systems.",
        archetype:
          "Contact Center Agent Assist - agent augmentation for member-service operations.",
        sponsor_candidate:
          "Chief Digital and Information Officer with VP Operations as operating owner.",
        scope_boundary:
          "In: claims status, prior authorization status, benefits, eligibility, CRM history, and agent knowledge lookup. Out: adjudication and direct clinical advice.",
        evidence_family:
          "Member-service metrics, call transcripts, CRM history, claims samples, knowledge base, system inventory, controls, and value assumptions.",
        value_hypothesis:
          "Lower avoidable handle time, repeat contact, transfers, and manual rework while improving first-call resolution.",
        foundation_readiness:
          "Integrated patient, claims, and call-center data on a governed cloud platform.",
      },
    });
    deliverablesFixture = [
      {
        id: "origination-brief",
        deliverable_type_key: "origination_brief",
        status: "signed_off",
      },
    ];
    participantsFixture = [];
    approvalRequestsFixture = [];
    deliverableVersionsFixture = [
      {
        content: "P0 record approved.",
        structured_data: null,
        generated_at: "2026-07-16T00:00:00.000Z",
      },
    ];

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1" },
      "program-1",
      0,
      1,
    );

    expect(result.failedChecks).toEqual([]);
    expect(result.pass).toBe(true);
    expect(result.requiresApproval).toBe(true);
  });

  it("blocks P0 to P1 when only the Setup approval snapshot exists", async () => {
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 0,
      archetype: "platform_modernization",
    });
    deliverablesFixture = [];
    participantsFixture = [{ approval_authority: "sponsor" }];
    approvalRequestsFixture = [
      {
        request_status: "approved",
        brief_snapshot: {
          classification: "platform_modernization",
          problem_statement:
            "Analytics delivery across Epic, claims, coding, prior auth, and VBC is fragmented.",
          target_outcome:
            "30% faster analytics delivery with better trust and quality.",
        },
      },
    ];
    deliverableVersionsFixture = [];

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1" },
      "program-1",
      0,
      1,
    );

    expect(result.pass).toBe(false);
    expect(result.requiresApproval).toBe(false);
    expect(result.failedChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          check: "program_seed_recorded",
          severity: "hard",
        }),
        expect.objectContaining({
          check: "value_hypothesis_seed",
          severity: "hard",
        }),
      ]),
    );
  });

  it("passes the P5 to Tower handoff when package, value contract, and launch cadence are signed off", async () => {
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 5,
      archetype: "agent_assist",
    });
    deliverablesFixture = [
      {
        id: "handoff",
        deliverable_type_key: "handoff_package",
        status: "signed_off",
      },
      {
        id: "value-contract",
        deliverable_type_key: "value_measurement_contract",
        status: "signed_off",
      },
    ];
    modulesFixture = [
      {
        module_key: "phase_5_launch_readiness",
        status: "completed",
        state_jsonb: {
          value:
            "Launch readiness: go/no-go criteria, environments, access, and owner attestation are ready.",
        },
      },
      {
        module_key: "phase_5_governance_cadence",
        status: "completed",
        state_jsonb: {
          value:
            "Tower governance cadence: weekly measurement review, reporting cadence, and escalation path.",
        },
      },
      {
        module_key: "phase_5_risks_open_items",
        status: "completed",
        state_jsonb: {
          value:
            "Open risks and client-to-complete items are recorded with mitigation owners.",
        },
      },
    ];

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1" },
      "program-1",
      5,
      6,
    );

    expect(result.pass).toBe(true);
    expect(result.failedChecks).toEqual([]);
    expect(result.requiresApproval).toBe(true);
  });

  it("passes the P5 to Tower handoff from signed P5 deliverables even when separate phase text was not captured", async () => {
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 5,
      archetype: "agent_assist",
    });
    deliverablesFixture = [
      {
        id: "handoff",
        deliverable_type_key: "handoff_package",
        status: "signed_off",
      },
      {
        id: "value-contract",
        deliverable_type_key: "value_measurement_contract",
        status: "signed_off",
      },
    ];
    modulesFixture = [];

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1" },
      "program-1",
      5,
      6,
    );

    expect(result.pass).toBe(true);
    expect(result.failedChecks).toEqual([]);
    expect(result.requiresApproval).toBe(true);
  });
});

describe("evaluateGate — classify fast lane (moves_classify_fast_lane_v1)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    participantsFixture = [];
    approvalRequestsFixture = [];
    milestonesFixture = [];
    evidenceFixture = [];
    deliverableVersionsFixture = [];
    roleApprovalsFixture = [];
    deliverablesFixture = [];
    modulesFixture = [];
    fromMock.mockImplementation(tableResult);
  });

  it("is a no-op (no_rule, same as before this feature existed) when the tier is unset, even for an enrolled tenant", async () => {
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 1,
      archetype: "agent_assist",
      charter: {},
    });

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1", clientKey: "meridian" },
      "program-1",
      1,
      5,
    );

    expect(result.pass).toBe(false);
    expect(result.failedChecks).toEqual([
      expect.objectContaining({ check: "no_rule" }),
    ]);
  });

  it("is a no-op when the tier is straightforward but the tenant is NOT enrolled in the flag", async () => {
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 1,
      archetype: "agent_assist",
      charter: {
        p0_extended_intake_fields_v1: { tier: "Straightforward" },
      },
    });

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1", clientKey: "apexretail" },
      "program-1",
      1,
      5,
    );

    expect(result.pass).toBe(false);
    expect(result.failedChecks).toEqual([
      expect.objectContaining({ check: "no_rule" }),
    ]);
  });

  it("is a no-op when the tenant is enrolled but the tier is substantial (not straightforward)", async () => {
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 1,
      archetype: "agent_assist",
      charter: {
        p0_extended_intake_fields_v1: { tier: "Substantial" },
      },
    });

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1", clientKey: "meridian" },
      "program-1",
      1,
      5,
    );

    expect(result.pass).toBe(false);
    expect(result.failedChecks).toEqual([
      expect.objectContaining({ check: "no_rule" }),
    ]);
  });

  it("passes P1 -> P5 directly when the tier is straightforward AND the tenant is enrolled", async () => {
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 1,
      archetype: "agent_assist",
      charter: {
        p0_extended_intake_fields_v1: { tier: "Straightforward" },
      },
    });

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1", clientKey: "meridian" },
      "program-1",
      1,
      5,
    );

    expect(result.pass).toBe(true);
    expect(result.failedChecks).toEqual([]);
    expect(result.requiresApproval).toBe(true);
    expect(result.approverRole).toBe("sponsor");
  });

  it("does not touch the normal P1 -> P2 transition even for an enrolled, straightforward-tagged Move", async () => {
    // The fast lane is an ADDITIONAL option, not a replacement — a
    // straightforward Move whose sponsor chooses the normal path must still
    // see the real P1->P2 gate criteria (charter_signed_off etc.), unaffected
    // by tier or the fast-lane flag.
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 1,
      archetype: "agent_assist",
      charter: {
        p0_extended_intake_fields_v1: { tier: "Straightforward" },
      },
    });

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1", clientKey: "meridian" },
      "program-1",
      1,
      2,
    );

    expect(result.failedChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ check: "charter_signed_off" }),
      ]),
    );
    expect(result.failedChecks.some((f) => f.check === "no_rule")).toBe(false);
  });

  it("never applies the fast lane to any pair other than exactly (1, 5), regardless of tier or enrollment", async () => {
    getProgramByIdMock.mockResolvedValue({
      id: "program-1",
      currentPhase: 2,
      archetype: "agent_assist",
      charter: {
        p0_extended_intake_fields_v1: { tier: "Straightforward" },
      },
    });

    const result = await evaluateGate(
      { clientId: "client-1", userId: "person-1", clientKey: "meridian" },
      "program-1",
      2,
      5,
    );

    expect(result.failedChecks).toEqual([
      expect.objectContaining({ check: "no_rule" }),
    ]);
  });
});
