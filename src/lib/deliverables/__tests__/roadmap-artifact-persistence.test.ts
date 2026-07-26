import JSZip from "jszip";

import {
  buildPersistedRoadmapRecord,
  authorizeRoadmapDownload,
  renderPersistedRoadmap,
  ROADMAP_RENDERER_VERSIONS,
  type PersistedRoadmapRecord,
  type RoadmapSyncMetadata,
} from "../roadmap-artifact-persistence";
import { buildGovernedRoadmapArtifact } from "../build-governed-roadmap-artifact";
import {
  ROADMAP_SO_OPEN,
  ROADMAP_SO_CLOSE,
  ROADMAP_STRUCTURED_OUTPUT_VERSION,
} from "../roadmap-structured-output";

const NOW = "2026-07-25T00:00:00.000Z";

function output(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: ROADMAP_STRUCTURED_OUTPUT_VERSION,
    executiveConclusion:
      "A four-stage transition establishes trusted data first, proves value in one function, then scales only after controls are established.",
    sponsorDecision:
      "Authorize foundation funding and confirm decision rights.",
    lifecycleStateRef: "review_draft",
    horizonOutcomes: {
      Mobilize: "Sponsorship and funding established.",
      "Establish Foundation": "Trusted data operational.",
      "Deliver Priority Outcomes": "Priority outcome proven.",
      "Scale and Optimize": "Operating model extended.",
    },
    cells: [
      {
        workstream: "Governance & Controls",
        horizon: "Mobilize",
        outcome: "Decision rights agreed",
        decisionOrGate: "Control approval",
        evidenceStatus: "recommended",
      },
      {
        workstream: "Data",
        horizon: "Establish Foundation",
        outcome: "Data model live",
        dependency: "taxonomy access",
        evidenceStatus: "recommended",
      },
      {
        workstream: "AI / Automation",
        horizon: "Deliver Priority Outcomes",
        outcome: "Automation live",
        evidenceStatus: "illustrative",
      },
      {
        workstream: "Business & Process",
        horizon: "Scale and Optimize",
        outcome: "Model extended",
        evidenceStatus: "illustrative",
      },
    ],
    decisionGates: [
      { name: "Control approval", criteria: "Governance controls established" },
    ],
    valueMilestones: [
      { name: "First measurable result", horizon: "Deliver Priority Outcomes" },
    ],
    criticalDependencies: [
      { item: "Data access", evidenceStatus: "evidence_required" },
    ],
    risks: ["Data quality"],
    caveats: ["Illustrative timing."],
    appendix: ["Detail."],
    sourceLineageRefs: ["accepted P3 architecture"],
    ...overrides,
  };
}

function modelText(
  o: unknown,
  narrative = "A four-stage transition, a sequencing argument.",
) {
  return `${narrative}\n\n${ROADMAP_SO_OPEN}\n${JSON.stringify(o)}\n${ROADMAP_SO_CLOSE}`;
}

async function governedRecord(
  overrides: Record<string, unknown> = {},
  prior: { sync: RoadmapSyncMetadata } | null = null,
): Promise<PersistedRoadmapRecord> {
  const res = await buildGovernedRoadmapArtifact({
    modelText: modelText(output(overrides)),
    pipeline: "golden_bar",
    lineage: {
      moveId: "meridian-move",
      tenantKey: "meridian",
      architectureRef: "arch-1",
    },
    lifecycleState: "review_draft",
    phase: 4,
    generatedAt: NOW,
  });
  if (!res.ok) throw new Error("governed build failed: " + res.reason);
  return buildPersistedRoadmapRecord({
    contract: res.contract,
    provenance: res.provenance,
    artifactId: "artifact-1",
    generationRunId: "run-1",
    lifecycleStateVersion: "lc-v1",
    prior,
  });
}

describe("buildPersistedRoadmapRecord — immutable sync metadata + versioning", () => {
  it("captures every required sync field", async () => {
    const rec = await governedRecord();
    const s = rec.sync;
    expect(s.tenantKey).toBe("meridian");
    expect(s.moveId).toBe("meridian-move");
    expect(s.artifactId).toBe("artifact-1");
    expect(s.pipeline).toBe("golden_bar");
    expect(s.contractVersion).toBe(rec.contract.contractVersion);
    expect(s.contentHash).toBe(rec.contract.contentHash);
    expect(s.lifecycleStateVersion).toBe("lc-v1");
    expect(s.structuredOutputSchemaVersion).toBe(
      ROADMAP_STRUCTURED_OUTPUT_VERSION,
    );
    expect(s.sourceLineageRefs).toContain("accepted P3 architecture");
    expect(s.generationRunId).toBe("run-1");
    expect(s.generatedAt).toBe(NOW);
    expect(s.validationResult).toBe("passed");
    expect(s.contradictionCheckResult).toBe("passed");
    expect(s.rendererVersions).toEqual(ROADMAP_RENDERER_VERSIONS);
    expect(s.version).toBe(1);
    expect(s.supersedesContentHash).toBeNull();
  });

  it("a regenerated contract is a NEW version that supersedes, never overwrites", async () => {
    const v1 = await governedRecord();
    // Regenerate with different content → different hash → version 2 pointing at v1.
    const v2 = await governedRecord(
      {
        executiveConclusion:
          "A revised four-stage transition sequences trusted data, proof, then controlled scale for durable value.",
      },
      { sync: v1.sync },
    );
    expect(v2.sync.version).toBe(2);
    expect(v2.sync.supersedesContentHash).toBe(v1.sync.contentHash);
    expect(v2.sync.contentHash).not.toBe(v1.sync.contentHash);
  });
});

describe("authorizeRoadmapDownload — honest, non-enumerating refusals", () => {
  const requester = { tenantKey: "meridian", canReadRestricted: false };
  const active = (rec: PersistedRoadmapRecord) => ({
    record: rec,
    status: "active" as const,
    availableVersions: [rec.sync.version],
  });

  it("allows a same-tenant HTML/DOCX/PPTX download of an active artifact", async () => {
    const rec = await governedRecord();
    for (const format of ["html", "docx", "pptx"] as const) {
      expect(
        authorizeRoadmapDownload({ requester, target: active(rec), format })
          .allowed,
      ).toBe(true);
    }
  });

  it("no contract → 404 roadmap_not_found", () => {
    const d = authorizeRoadmapDownload({
      requester,
      target: { record: null, status: "active", availableVersions: [] },
      format: "pptx",
    });
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.code).toBe("roadmap_not_found");
  });

  it("cross-tenant → non-enumerating 404 (never 403)", async () => {
    const rec = await governedRecord();
    const d = authorizeRoadmapDownload({
      requester: { tenantKey: "apex", canReadRestricted: true },
      target: active(rec),
      format: "pptx",
    });
    expect(d.allowed).toBe(false);
    if (!d.allowed) {
      expect(d.httpStatus).toBe(404);
      expect(d.code).toBe("roadmap_not_found");
    }
  });

  it("restricted contract/provenance require restricted-read permission", async () => {
    const rec = await governedRecord();
    const denied = authorizeRoadmapDownload({
      requester,
      target: active(rec),
      format: "contract",
    });
    expect(denied.allowed).toBe(false);
    if (!denied.allowed) expect(denied.code).toBe("roadmap_forbidden");
    const allowed = authorizeRoadmapDownload({
      requester: { tenantKey: "meridian", canReadRestricted: true },
      target: active(rec),
      format: "provenance",
    });
    expect(allowed.allowed).toBe(true);
  });

  it("rejected → 409 rejected; superseded (no version asked) → 409 superseded", async () => {
    const rec = await governedRecord();
    const rejected = authorizeRoadmapDownload({
      requester,
      target: { record: rec, status: "rejected", availableVersions: [1] },
      format: "pptx",
    });
    expect(rejected.allowed).toBe(false);
    if (!rejected.allowed)
      expect(rejected.code).toBe("roadmap_artifact_rejected");
    const superseded = authorizeRoadmapDownload({
      requester,
      target: { record: rec, status: "superseded", availableVersions: [1, 2] },
      format: "pptx",
    });
    expect(superseded.allowed).toBe(false);
    if (!superseded.allowed)
      expect(superseded.code).toBe("roadmap_artifact_superseded");
  });

  it("unavailable requested version → 404 version_not_available", async () => {
    const rec = await governedRecord();
    const d = authorizeRoadmapDownload({
      requester,
      target: { record: rec, status: "active", availableVersions: [1] },
      format: "pptx",
      requestedVersion: 9,
    });
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.code).toBe("roadmap_version_not_available");
  });
});

describe("renderPersistedRoadmap — re-render from stored contract, never regenerate", () => {
  it("renders each format from the persisted contract with the stored hash", async () => {
    const rec = await governedRecord();
    const html = await renderPersistedRoadmap(rec, "html");
    expect(
      html.ok &&
        html.format === "html" &&
        html.body.includes(rec.contract.contentHash),
    ).toBe(true);
    const docx = await renderPersistedRoadmap(rec, "docx");
    if (!docx.ok || docx.format !== "docx") throw new Error("docx");
    const dz = await JSZip.loadAsync(docx.body);
    expect(await dz.files["word/document.xml"].async("string")).toContain(
      rec.contract.contentHash,
    );
  });

  it("null record → governed contract_missing, no render", async () => {
    const r = await renderPersistedRoadmap(null, "pptx");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("roadmap_contract_missing");
  });

  it("tampered stored contract (hash no longer matches) → contract_missing", async () => {
    const rec = await governedRecord();
    const tampered: PersistedRoadmapRecord = {
      ...rec,
      contract: { ...rec.contract, executiveConclusion: "SILENTLY EDITED" },
    };
    const r = await renderPersistedRoadmap(tampered, "html");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("roadmap_contract_missing");
  });
});
