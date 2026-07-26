import {
  selectRoadmapTarget,
  type RoadmapVersionCandidate,
} from "../roadmap-current-resolver";
import { roadmapProvenanceHeaders } from "../roadmap-download-service";
import { authorizeRoadmapDownload } from "../roadmap-artifact-persistence";
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

async function record(
  version: number,
  conclusionSuffix = "",
): Promise<PersistedRoadmapRecord> {
  const o = {
    schemaVersion: ROADMAP_STRUCTURED_OUTPUT_VERSION,
    executiveConclusion:
      "A four-stage transition builds trusted data first, proves value, then scales only after controls are established." +
      conclusionSuffix,
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
    lineage: { moveId: "meridian-move", tenantKey: "meridian" },
    lifecycleState: "review_draft",
    phase: 4,
    generatedAt: "2026-07-25T00:00:00Z",
  });
  if (!res.ok) throw new Error(res.reason);
  const rec = buildPersistedRoadmapRecord({
    contract: res.contract,
    provenance: res.provenance,
    artifactId: "art",
    generationRunId: "run-" + version,
    lifecycleStateVersion: "lc-1",
  });
  // stamp the version onto sync so provenance headers reflect it
  return { ...rec, sync: { ...rec.sync, version } };
}

describe("selectRoadmapTarget — resolve current / explicit version, never manufacture", () => {
  it("current = the newest version that carries a valid governed record", async () => {
    const v2 = await record(2, " v2"),
      v3 = await record(3, " v3");
    const candidates: RoadmapVersionCandidate[] = [
      { version: 3, record: v3 },
      { version: 2, record: v2 },
      { version: 1, record: null },
    ];
    const t = selectRoadmapTarget({ candidates, deliverableStatus: "active" });
    expect(t.record?.sync.version).toBe(3);
    expect(t.availableVersions).toEqual([2, 3]); // v1 has no valid record
    expect(t.status).toBe("active");
  });

  it("a failed generation attempt (newest version, no record) does NOT hide the prior valid version", async () => {
    const v2 = await record(2);
    const candidates: RoadmapVersionCandidate[] = [
      { version: 3, record: null }, // failed attempt: narrative persisted, no governed contract
      { version: 2, record: v2 },
    ];
    const t = selectRoadmapTarget({ candidates, deliverableStatus: "active" });
    expect(t.record?.sync.version).toBe(2); // falls back to the latest VALID version
    expect(t.availableVersions).toEqual([2]);
  });

  it("explicit version returns that version's record; a version without a record → null (→ not_found)", async () => {
    const v2 = await record(2);
    const candidates: RoadmapVersionCandidate[] = [
      { version: 3, record: null },
      { version: 2, record: v2 },
    ];
    expect(
      selectRoadmapTarget({
        candidates,
        deliverableStatus: "active",
        requestedVersion: 2,
      }).record?.sync.version,
    ).toBe(2);
    expect(
      selectRoadmapTarget({
        candidates,
        deliverableStatus: "active",
        requestedVersion: 3,
      }).record,
    ).toBeNull();
  });

  it("a rejected deliverable → status rejected (authorizer refuses 409)", async () => {
    const v1 = await record(1);
    const t = selectRoadmapTarget({
      candidates: [{ version: 1, record: v1 }],
      deliverableStatus: "rejected",
    });
    expect(t.status).toBe("rejected");
    const d = authorizeRoadmapDownload({
      requester: { tenantKey: "meridian", canReadRestricted: false },
      target: t,
      format: "pptx",
    });
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.code).toBe("roadmap_artifact_rejected");
  });

  it("a superseded deliverable (no version asked) → 409 superseded", async () => {
    const v1 = await record(1);
    const t = selectRoadmapTarget({
      candidates: [{ version: 1, record: v1 }],
      deliverableStatus: "superseded",
    });
    const d = authorizeRoadmapDownload({
      requester: { tenantKey: "meridian", canReadRestricted: false },
      target: t,
      format: "pptx",
    });
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.code).toBe("roadmap_artifact_superseded");
  });

  it("no versions with a valid record → record null (→ governed roadmap_not_found)", () => {
    const t = selectRoadmapTarget({
      candidates: [{ version: 1, record: null }],
      deliverableStatus: "active",
    });
    expect(t.record).toBeNull();
    const d = authorizeRoadmapDownload({
      requester: { tenantKey: "meridian", canReadRestricted: false },
      target: t,
      format: "html",
    });
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.code).toBe("roadmap_not_found");
  });
});

describe("roadmapProvenanceHeaders — stable governed identifiers, not deliverables_v2.id", () => {
  it("exposes contract version, hash, lifecycle, run id, pipeline, version — no raw DB id", async () => {
    const rec = await record(3);
    const h = roadmapProvenanceHeaders(rec);
    expect(h["x-roadmap-content-hash"]).toBe(rec.contract.contentHash);
    expect(h["x-roadmap-contract-version"]).toBe(rec.contract.contractVersion);
    expect(h["x-roadmap-pipeline"]).toBe("golden_bar");
    expect(h["x-roadmap-version"]).toBe("3");
    expect(h["x-roadmap-generation-run-id"]).toBe("run-3");
    // No header leaks a raw deliverables_v2 id.
    expect(
      Object.keys(h).some((k) => /deliverable.*id|deliverables_v2/i.test(k)),
    ).toBe(false);
  });
});
