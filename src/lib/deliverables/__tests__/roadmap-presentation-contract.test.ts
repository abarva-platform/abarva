import {
  buildRoadmapPresentationContract,
  roadmapContentHash,
  roadmapContractStamp,
  ROADMAP_CONTRACT_VERSION,
  type RoadmapContractSeed,
} from "../roadmap-presentation-contract";

function seed(
  over: Partial<Omit<RoadmapContractSeed, "contractVersion">> = {},
): Omit<RoadmapContractSeed, "contractVersion"> {
  return {
    lifecycleState: "review_draft",
    phase: 4,
    executiveConclusion:
      "A four-horizon transition builds the foundation first, proves value in one function, then scales.",
    sponsorDecision:
      "Authorize foundation funding and confirm decision rights.",
    horizons: [
      {
        name: "Mobilize",
        outcome: "Sponsorship, funding and decision rights established.",
      },
      {
        name: "Establish Foundation",
        outcome: "Trusted data and control loop operational.",
      },
    ],
    decisionGates: [
      {
        name: "Funding authorized",
        betweenHorizons: "Mobilize → Establish Foundation",
      },
    ],
    valueMilestones: [
      {
        name: "First measurable result demonstrated",
        horizon: "Deliver Priority Outcomes",
      },
    ],
    dependencies: [
      {
        item: "ITSM text + taxonomy access",
        evidenceStatus: "evidence_required",
      },
    ],
    workstreamItems: [
      {
        workstream: "Data",
        horizon: "Establish Foundation",
        outcome: "Trusted source identified",
        evidenceStatus: "recommended",
      },
    ],
    risks: ["Data quality of ticket text"],
    caveats: ["Timing is illustrative until a committed plan is approved."],
    lineage: {
      moveId: "move-1",
      tenantKey: "meridian",
      architectureRef: "deliv-arch-1",
    },
    appendix: ["Full workstream×horizon detail table."],
    ...over,
  };
}

describe("roadmap presentation contract — one source, stamped + hashed", () => {
  it("stamps the contract version and a derived content hash", () => {
    const c = buildRoadmapPresentationContract(seed());
    expect(c.contractVersion).toBe(ROADMAP_CONTRACT_VERSION);
    expect(c.contentHash).toMatch(/^[0-9a-f]{32}$/);
  });

  it("is deterministic — identical content always hashes the same", () => {
    expect(
      roadmapContentHash({
        ...seed(),
        contractVersion: ROADMAP_CONTRACT_VERSION,
      }),
    ).toBe(
      roadmapContentHash({
        ...seed(),
        contractVersion: ROADMAP_CONTRACT_VERSION,
      }),
    );
  });

  it("is order-independent — reordering array/object content that is semantically equal keeps the hash stable for identical data", () => {
    const a = buildRoadmapPresentationContract(seed());
    const b = buildRoadmapPresentationContract(seed());
    expect(a.contentHash).toBe(b.contentHash);
  });

  it("changes the hash when any semantic content changes", () => {
    const base = buildRoadmapPresentationContract(seed());
    const changed = buildRoadmapPresentationContract(
      seed({ executiveConclusion: "A different thesis entirely." }),
    );
    expect(changed.contentHash).not.toBe(base.contentHash);
  });

  it("changes the hash when the lifecycle state changes (governance state is part of the contract)", () => {
    const draft = buildRoadmapPresentationContract(
      seed({ lifecycleState: "review_draft" }),
    );
    const final = buildRoadmapPresentationContract(
      seed({ lifecycleState: "exit_approved_final" }),
    );
    expect(draft.contentHash).not.toBe(final.contentHash);
  });

  it("the stamp carries version + hash for embedding in every output", () => {
    const c = buildRoadmapPresentationContract(seed());
    const stamp = roadmapContractStamp(c);
    expect(stamp).toContain(`v${ROADMAP_CONTRACT_VERSION}`);
    expect(stamp).toContain(c.contentHash);
  });

  it("the hash excludes the contentHash field itself (no self-reference)", () => {
    const c = buildRoadmapPresentationContract(seed());
    const { contentHash, ...withoutHash } = c;
    expect(roadmapContentHash(withoutHash)).toBe(contentHash);
  });
});
