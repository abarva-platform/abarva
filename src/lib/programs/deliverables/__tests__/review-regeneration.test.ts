import {
  buildReviewRegenerationPrompt,
  buildReviewRegenerationPlan,
  parseReviewFeedbackText,
} from "../review-regeneration";
import type { MoveArtifactRow } from "../move-artifacts";

const artifact: MoveArtifactRow = {
  artifact_id: "artifact-v1",
  move_id: "move-1",
  phase: 2,
  artifact_type: "session_artifact",
  artifact_family: "session_artifact",
  title: "Discovery Quality Proof",
  file_name: "discovery-quality-proof.md",
  file_format: "md",
  blob_container: "context-drops",
  blob_path: "moves/lakeshore/move-1/sessions/session_artifact/discovery-quality-proof.md",
  file_size: 100,
  version: 1,
  status: "aligned",
  generated_by: "tester",
  generated_at: "2026-06-27T00:00:00Z",
  quality_score: null,
  unsupported_claims_count: 0,
  lifecycle_state: "current",
  created_at: "2026-06-27T00:00:00Z",
  metadata: {},
};

describe("Moves review regeneration helpers", () => {
  it("parses client feedback into applied review items", () => {
    const items = parseReviewFeedbackText(`Client review notes:
- Add the AP exception aging caveat before final approval.
- Show the quality check and keep the output preliminary.`);

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      id: "feedback-01",
      area: "Evidence and readiness",
      priority: "high",
      status: "applied_to_regenerated_draft",
    });
    expect(items[1]?.area).toBe("Quality and artifact status");
  });

  it("builds a preliminary regenerated version with visible quality metadata", () => {
    const plan = buildReviewRegenerationPlan({
      artifact,
      feedbackText:
        "Add a revision log and mark the artifact preliminary until the client uploads invoice exception logs.",
      requestedBy: "lakeshore-cio@example.com",
      now: new Date("2026-06-27T12:00:00Z"),
    });

    expect(plan.fileName).toBe("discovery-quality-proof-v2-review-regenerated.md");
    expect(plan.qualityStatus).toBe("Passed with caveats");
    expect(plan.goldenBarStatus).toBe("Passed with caveats");
    expect(plan.metadata.regeneratedFromArtifactId).toBe("artifact-v1");
    expect(plan.metadata.feedbackItemCount).toBe(1);
    expect(plan.body).toContain("This is a safe regenerated draft");
    expect(plan.body).toContain("Client-To-Complete Fields");
  });

  it("builds a complete-artifact Claude regeneration prompt, not a patch prompt", () => {
    const plan = buildReviewRegenerationPlan({
      artifact,
      feedbackText:
        "Make current-state handoffs more explicit and distinguish process issues from AI opportunities.",
      now: new Date("2026-06-27T12:00:00Z"),
    });
    const prompt = buildReviewRegenerationPrompt({
      artifact,
      artifactKey: "discovery_report",
      phase: 2,
      feedbackText:
        "Make current-state handoffs more explicit and distinguish process issues from AI opportunities.",
      feedbackItems: plan.feedbackItems,
      originalArtifactBody: "<html><body><h1>Original diagnostic</h1></body></html>",
    });

    expect(prompt.outputFormat).toBe("html");
    expect(prompt.maxTokens).toBeGreaterThan(30000);
    expect(prompt.user).toContain("COMPLETE UPDATED ARTIFACT");
    expect(prompt.user).toContain("Original artifact to revise");
    expect(prompt.user).toContain("Current-State Handoff Map");
    expect(prompt.user).toContain("Process vs Data vs Policy vs Ownership vs AI Matrix");
    expect(prompt.user).toContain("not a short delta note");
  });
});
