import {
  buildCorrectionPlan,
  sanitizeGatesPassed,
} from "../correct-member-ai-assist-phase";

const authorizedMove = {
  id: "cd51e4fe-b5c4-4024-bc46-73afaff4e4b7",
  name: "MEMBER AI ASSIST",
  graph_node_id: "HEALTHCARE_PROVIDER-MEMBER-2026",
  client_id: "client",
  client_slug: "meridian-health",
  client_name: "Meridian Health",
  status: "active",
  lifecycle_state: null,
  current_phase: 4,
  gates_passed: [1, 2, 3, 4, { phase: 4, status: "approved" }, { phase: 2, status: "approved" }],
  metadata: {},
  updated_at: null,
};

describe("correct-member-ai-assist-phase", () => {
  it("removes the disputed P4 gate while preserving earlier gates", () => {
    expect(sanitizeGatesPassed(authorizedMove.gates_passed, 3)).toEqual([
      1,
      2,
      3,
      { phase: 2, status: "approved" },
    ]);
  });

  it("plans the authorized P4 to P3 correction only for the exact Move identity", () => {
    expect(buildCorrectionPlan(authorizedMove, { expectedCurrentPhase: 4, targetPhase: 3 })).toMatchObject({
      status: "would_correct",
    });

    expect(
      buildCorrectionPlan({ ...authorizedMove, current_phase: 3 }, { expectedCurrentPhase: 4, targetPhase: 3 }),
    ).toMatchObject({
      status: "already_at_target",
    });

    expect(
      buildCorrectionPlan({ ...authorizedMove, name: "Other Move" }, { expectedCurrentPhase: 4, targetPhase: 3 }),
    ).toMatchObject({
      status: "blocked",
    });

    expect(
      buildCorrectionPlan({ ...authorizedMove, graph_node_id: "OTHER" }, { expectedCurrentPhase: 4, targetPhase: 3 }),
    ).toMatchObject({
      status: "blocked",
    });
  });
});
