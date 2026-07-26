import JSZip from "jszip";

import { composeRoadmapDownload } from "../roadmap-download-service";
import {
  buildPersistedRoadmapRecord,
  type PersistedRoadmapRecord,
} from "../roadmap-artifact-persistence";
import { buildGovernedRoadmapArtifact } from "../build-governed-roadmap-artifact";
import {
  ROADMAP_SO_OPEN,
  ROADMAP_SO_CLOSE,
  ROADMAP_STRUCTURED_OUTPUT_VERSION,
} from "../roadmap-structured-output";

async function record(): Promise<PersistedRoadmapRecord> {
  const o = {
    schemaVersion: ROADMAP_STRUCTURED_OUTPUT_VERSION,
    executiveConclusion:
      "A four-stage transition builds trusted data first, proves value, then scales only after controls are established.",
    sponsorDecision: "Authorize foundation funding.",
    lifecycleStateRef: "review_draft",
    horizonOutcomes: {
      Mobilize: "Funding set.",
      "Establish Foundation": "Data live.",
      "Deliver Priority Outcomes": "Value proven.",
      "Scale and Optimize": "Extended.",
    },
    cells: [
      {
        workstream: "Governance & Controls",
        horizon: "Mobilize",
        outcome: "rights",
        decisionOrGate: "Control approval",
        evidenceStatus: "recommended",
      },
      {
        workstream: "Data",
        horizon: "Establish Foundation",
        outcome: "model",
        evidenceStatus: "recommended",
      },
      {
        workstream: "AI / Automation",
        horizon: "Deliver Priority Outcomes",
        outcome: "auto",
        evidenceStatus: "illustrative",
      },
      {
        workstream: "Business & Process",
        horizon: "Scale and Optimize",
        outcome: "ext",
        evidenceStatus: "illustrative",
      },
    ],
    decisionGates: [
      { name: "Control approval", criteria: "controls established" },
    ],
    valueMilestones: [
      { name: "First result", horizon: "Deliver Priority Outcomes" },
    ],
    criticalDependencies: [
      { item: "data", evidenceStatus: "evidence_required" },
    ],
    risks: ["r"],
    caveats: ["c"],
    appendix: ["a"],
    sourceLineageRefs: ["accepted P3 architecture"],
  };
  const res = await buildGovernedRoadmapArtifact({
    modelText: `A four-stage transition, a sequencing argument.\n\n${ROADMAP_SO_OPEN}\n${JSON.stringify(o)}\n${ROADMAP_SO_CLOSE}`,
    pipeline: "golden_bar",
    lineage: { moveId: "m", tenantKey: "meridian" },
    lifecycleState: "review_draft",
    phase: 4,
    generatedAt: "2026-07-25T00:00:00Z",
  });
  if (!res.ok) throw new Error(res.reason);
  return buildPersistedRoadmapRecord({
    contract: res.contract,
    provenance: res.provenance,
    artifactId: "a1",
    generationRunId: "run",
    lifecycleStateVersion: "lc1",
  });
}

const meridian = { tenantKey: "meridian", canReadRestricted: false };

describe("composeRoadmapDownload", () => {
  it("serves an editable PPTX (200, correct content type + filename) re-rendered from the contract", async () => {
    const rec = await record();
    const r = await composeRoadmapDownload({
      requester: meridian,
      target: { record: rec, status: "active", availableVersions: [1] },
      format: "pptx",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.httpStatus).toBe(200);
    expect(r.contentType).toContain("presentationml");
    expect(r.filename).toBe("executive-roadmap-v1.pptx");
    const zip = await JSZip.loadAsync(r.body as Buffer);
    expect(Object.keys(zip.files).some((n) => /slide1\.xml/.test(n))).toBe(
      true,
    );
  });

  it("refuses cross-tenant with a non-enumerating 404", async () => {
    const rec = await record();
    const r = await composeRoadmapDownload({
      requester: { tenantKey: "apex", canReadRestricted: true },
      target: { record: rec, status: "active", availableVersions: [1] },
      format: "pptx",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.httpStatus).toBe(404);
      expect(r.code).toBe("roadmap_not_found");
    }
  });

  it("refuses restricted contract JSON without permission (403)", async () => {
    const rec = await record();
    const r = await composeRoadmapDownload({
      requester: meridian,
      target: { record: rec, status: "active", availableVersions: [1] },
      format: "contract",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.httpStatus).toBe(403);
  });

  it("serves contract JSON to an audit/admin caller (200)", async () => {
    const rec = await record();
    const r = await composeRoadmapDownload({
      requester: { tenantKey: "meridian", canReadRestricted: true },
      target: { record: rec, status: "active", availableVersions: [1] },
      format: "contract",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.contentType).toContain("json");
  });

  it("no persisted contract → 404 (route refuses, never a blank artifact)", async () => {
    const r = await composeRoadmapDownload({
      requester: meridian,
      target: { record: null, status: "active", availableVersions: [] },
      format: "docx",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.httpStatus).toBe(404);
  });
});
