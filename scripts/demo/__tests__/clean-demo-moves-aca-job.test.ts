import { CLEAN_DEMO_MOVES } from "../clean-demo-moves";
import {
  archivePlanHash,
  buildDbEngagement,
  isTestMoveName,
  p1ReferenceDrafts,
} from "../clean-demo-moves-aca-job";

describe("governed clean demo Moves job mapping", () => {
  it("maps the canonical engagement row without inventing values or gate state", () => {
    for (const move of CLEAN_DEMO_MOVES) {
      const row = buildDbEngagement(move, "client-id", "sponsor-id");
      expect(row.graph_node_id).toMatch(/^eng_demo_clean_mer_move_/);
      expect(row.client_id).toBe("client-id");
      expect(row.industry_code).toBe(move.industryCode);
      expect(["FRONT_OFFICE", "MIDDLE_OFFICE", "BACK_OFFICE"]).toContain(row.function_code);
      expect(["GROW", "OPTIMISE", "CONTROL"]).toContain(row.objective_code);
      expect(row.function_code).toBe(move.functionCode);
      expect(row.objective_code).toBe(move.objectiveCode);
      expect(row.topic_code).toBe(move.topicCode);
      expect(row.program_archetype).toBe(move.programArchetype);
      expect(row.current_phase).toBe(move.entryPhase);
      expect(row.lifecycle_state).toBe("shaping");
      expect(row.origin_source).toBe("intelligence_candidate");
      expect(row.value_projected_low_usd).toBeNull();
      expect(row.value_projected_high_usd).toBeNull();
      expect(row.value_verified_status).toBe("pending");
      expect(row.gates_passed).toEqual([]);
      expect(row.charter.provenance_class).toBe("synthetic_reference");
      if (move.charter) {
        const scaffold = row.charter.scaffold as Record<string, unknown>;
        expect(scaffold.evidence_state).toBe("open");
        expect(scaffold.evidence_cleared).toBe(false);
        expect(scaffold.open_evidence).toEqual(move.openEvidence);
      }
    }
  });

  it("maps charter content into P1 reference drafts without persisted capture values", () => {
    for (const move of CLEAN_DEMO_MOVES) {
      const rows = p1ReferenceDrafts(move);
      if (!move.charter) {
        expect(rows).toEqual([]);
        continue;
      }
      expect(rows.map((row) => row.module_key)).toEqual([
        "phase_1_sponsor_commitment",
        "phase_1_scope_boundary",
        "phase_1_success_criteria",
        "phase_1_stakeholder_map",
        "phase_1_decision_rights",
        "phase_1_evidence_plan",
        "phase_1_business_change_assessment",
      ]);
      for (const row of rows) {
        expect(row.status).toBe("not_started");
        expect(row.state_jsonb.value).toBe("");
        expect(row.state_jsonb.provenance_class).toBe("synthetic_reference");
        expect(row.state_jsonb.requires_human_review).toBe(true);
        expect(row.state_jsonb.gate_credit).toBe(false);
      }
      expect(rows[6].state_jsonb).toMatchObject({ open: true });
      expect("synthetic_reference_draft" in rows[6].state_jsonb).toBe(false);
    }
  });

  it("uses the exact test-name patterns and produces an order-independent preflight seal", () => {
    expect(isTestMoveName("Synthetic Agent Assist Claude E2E 1002")).toBe(true);
    expect(isTestMoveName("Contact Center Member Service Move")).toBe(false);
    expect(
      archivePlanHash([
        { id: "b", name: "B", status: "active", lifecycle_state: "shaping" },
        { id: "a", name: "A", status: "active", lifecycle_state: null },
      ]),
    ).toBe(
      archivePlanHash([
        { id: "a", name: "A", status: "active", lifecycle_state: null },
        { id: "b", name: "B", status: "active", lifecycle_state: "shaping" },
      ]),
    );
    expect(
      archivePlanHash([
        { id: "a", name: "A", status: "active", lifecycle_state: null },
      ]),
    ).not.toBe(
      archivePlanHash([
        { id: "a", name: "A", status: "active", lifecycle_state: "archived" },
      ]),
    );
  });
});
