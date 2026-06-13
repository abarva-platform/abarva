// Wiring proof: generator → File Cabinet bridge, stage-gate completion feeder, and
// approval-record → File Cabinet artifact. Persist is injected (no Blob/DB); renderers run.
import { persistGeneratedDeliverable } from "@/lib/source/file-cabinet/deliverable-bridge";
import { buildStageCompletion } from "@/lib/source/stage-gate/completion-feeder";
import {
  renderApprovalRecordHtml,
  persistApprovalArtifact,
} from "@/lib/source/stage-gate/approval-artifact";
import { getAmsStageGate } from "@/lib/source/stage-gate/ams-stage-gates";
import { goodDocument } from "@/lib/deliverables/orchestrator/__fixtures__/ams-rfp";
import type { SourceArtifactRecord } from "@/lib/source/file-cabinet/types";
import type { ApprovalRecord } from "@/lib/source/stage-gate/types";

describe("persistGeneratedDeliverable (generator → File Cabinet)", () => {
  it("renders + persists DOCX, HTML preview, and Excel companion as distinct versioned types", async () => {
    const calls: Array<Record<string, unknown>> = [];
    const persist = (async (input: Record<string, unknown>) => {
      calls.push(input);
      return {
        id: `art-${calls.length}`,
        artifactType: input.artifactType,
      } as unknown as SourceArtifactRecord;
    }) as never;

    const records = await persistGeneratedDeliverable(
      goodDocument(),
      {
        clientId: "c1",
        tenantKey: "skyharbor-air",
        sourceEventId: "evt-1",
        artifactType: "rfp_package",
        status: "preliminary",
        evidenceFamiliesUsed: ["sla_baseline"],
      },
      { persist },
    );
    // goodDocument has an xlsx-flagged table → companion present → 3 artifacts
    expect(records).toHaveLength(3);
    const types = calls.map((c) => c.artifactType);
    expect(types).toEqual([
      "rfp_package",
      "rfp_package__preview",
      "rfp_package__companion",
    ]);
    const formats = calls.map((c) => c.fileFormat);
    expect(formats).toEqual(["docx", "html", "xlsx"]);
    expect(
      calls.every(
        (c) => c.artifactGroup === "generated" && c.status === "preliminary",
      ),
    ).toBe(true);
    // docx bytes are a real .docx (PK zip)
    expect((calls[0].bytes as Buffer).subarray(0, 2).toString("latin1")).toBe(
      "PK",
    );
  });
});

describe("buildStageCompletion (signals → satisfied keys)", () => {
  it("maps each requirement by kind to the right signal set", () => {
    const def = getAmsStageGate("rfp_design")!; // reqs: rfp_sections_drafted(artifact,MV), pricing_template(artifact,MV), evaluation_weights(decision), procurement_review(review), legal_review(review)
    const completion = buildStageCompletion(def, {
      presentArtifactTypes: ["rfp_sections_drafted", "pricing_template"],
      decisionsMade: ["evaluation_weights"],
      reviewsSignedOff: ["procurement_review"],
    });
    expect(
      completion.satisfiedRequirementKeys.has("rfp_sections_drafted"),
    ).toBe(true);
    expect(completion.satisfiedRequirementKeys.has("evaluation_weights")).toBe(
      true,
    );
    expect(completion.satisfiedRequirementKeys.has("procurement_review")).toBe(
      true,
    );
    expect(completion.satisfiedRequirementKeys.has("legal_review")).toBe(false); // not signed off
  });

  it("evidence requirements satisfied only by agent_ready families", () => {
    const def = getAmsStageGate("evidence_baseline")!;
    const completion = buildStageCompletion(def, {
      agentReadyFamilies: ["application_inventory", "service_tower_scope"],
    });
    expect(
      completion.satisfiedRequirementKeys.has("application_inventory"),
    ).toBe(true);
    expect(completion.satisfiedRequirementKeys.has("ticket_volumes")).toBe(
      false,
    );
  });
});

describe("approval artifact", () => {
  const rec: ApprovalRecord = {
    archetype: "AMS_IT_OUTSOURCING",
    stageKey: "rfp_design",
    stageName: "RFP Package Design",
    decision: "approve_with_gaps",
    approver: "maestro",
    approvedAt: "2026-06-10T00:00:00Z",
    rationale: "Exec deadline; finalize weights in parallel.",
    gapsAcknowledged: ["Final evaluation weights confirmed"],
    risksAccepted: ["Scoring is not defensible; protest risk."],
    downstreamImpacts: ["evaluation_criteria"],
    followUpItems: [{ item: "Confirm weights", owner: "Procurement" }],
    artifactLabel: "preliminary",
    allowIssueReady: false,
    readinessSnapshot: {
      currentCompletion: 0.4,
      minimumViableMet: true,
      gateStatusBeforeDecision: "ready_with_gaps",
      gapCount: 3,
    },
  };

  it("renders an HTML record with rationale, gaps, risks, follow-ups, snapshot", () => {
    const html = renderApprovalRecordHtml(rec);
    expect(html).toMatch(/Gate Approval Record/);
    expect(html).toMatch(/Exec deadline/);
    expect(html).toMatch(/Final evaluation weights/);
    expect(html).toMatch(/Issue-ready allowed:<\/b> no/);
    expect(html).toMatch(/Confirm weights/);
  });

  it("persists through the EXISTING source artifact registry (blob + decision_brief row)", async () => {
    let uploadedPath: string | null = null;
    let registered: Record<string, unknown> | null = null;
    const upload = (async (_bucket: string, path: string) => {
      uploadedPath = path;
    }) as never;
    const register = (async (input: Record<string, unknown>) => {
      registered = input;
      return { id: input.artifactId } as never;
    }) as never;
    const out = await persistApprovalArtifact(
      rec,
      {
        tenantKey: "skyharbor-air",
        sourceEventId: "evt-1",
        sourceEventRowId: "evt-1",
        generatedBy: "maestro",
      },
      { upload, register },
    );
    expect(out.id).toBeTruthy();
    expect(uploadedPath).toMatch(/^skyharbor-air\/evt-1\//); // existing registry path convention
    expect(registered!.artifactFamily).toBe("decision_brief");
    expect(registered!.artifactKind).toBe("gate_approval_record");
    expect(registered!.sourceOrigin).toBe("generated");
    expect(registered!.sourceFormat).toBe("html");
    expect(registered!.originalName as string).toContain("rfp_design");
    // playbook stage keys must map to the registry's stage vocabulary (DB CHECK):
    // 'rfp_design' -> 'rfp_rfi_package'; an unmapped key 500s in prod (pre-flight find).
    expect(registered!.stageKey).toBe("rfp_rfi_package");
  });
});
