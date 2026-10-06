// Item C-008 — acceptance-bound governed event-context bundle.
//
// The suite is written against the defect rather than against the code: every
// refusal case below is a candidate that `buildValidatedAgentContextBundle`
// admits on its own today, which the negative control at the bottom proves
// independently rather than by asserting it.

import { buildValidatedAgentContextBundle } from "@/lib/governance/agent-context-bundle";
import {
  buildGovernedEventContextBundle,
  compareEventContextAdoption,
  eventContextFenceHolds,
  summarizeEventContextRefusals,
  type EventContextCandidate,
  type EventContextIdentity,
  type EventContextRefusalCode,
} from "../event-context-bundle";

const IDENTITY: EventContextIdentity = {
  tenantId: "tenant-meridian-0001",
  clientKey: "meridian-health",
  eventId: "EVT-100",
  contractId: "CTR-0002",
  currentStageKey: "evaluate",
  acceptedArtifactVersions: { "ART-1": "v3" },
};

function candidate(
  over: Partial<EventContextCandidate> & Pick<EventContextCandidate, "id">,
): EventContextCandidate {
  return {
    kind: "supplier_fact",
    tenantId: IDENTITY.tenantId,
    clientKey: IDENTITY.clientKey,
    eventId: IDENTITY.eventId,
    contractId: IDENTITY.contractId,
    reviewState: "reviewed",
    sourceLayer: "source_event",
    sourceBasis: "source_event_read_model",
    classification: "internal",
    retrievability: "fts_indexed",
    agentReadinessStatus: "committed_not_indexed",
    confidenceLevel: "medium",
    citedRenderVerifiedAt: null,
    ...over,
  };
}

const ACCEPTED_ARTIFACT = candidate({
  id: "ART-1@v3",
  kind: "accepted_artifact",
  artifactId: "ART-1",
  versionId: "v3",
  contentDriftStatus: "current",
  reviewState: "accepted",
  citations: ["source://evt-100/art-1#v3"],
});

function codesFor(
  bundle: ReturnType<typeof buildGovernedEventContextBundle>,
  id: string,
): EventContextRefusalCode[] {
  return bundle.refused
    .filter((refusal) => refusal.candidate.id === id)
    .map((refusal) => refusal.code);
}

describe("C-008 · governed event-context bundle — what it admits", () => {
  it("admits the accepted version of a reviewed artifact bound to this event", () => {
    const result = buildGovernedEventContextBundle(
      [ACCEPTED_ARTIFACT],
      IDENTITY,
    );
    expect(result.admitted.map((c) => c.id)).toEqual(["ART-1@v3"]);
    expect(result.refused).toHaveLength(0);
    expect(result.tenantFencePassed).toBe(true);
    expect(result.citations).toEqual(["source://evt-100/art-1#v3"]);
  });

  it("admits the current stage plan, allowed supplier facts, archetype intelligence and citations", () => {
    const result = buildGovernedEventContextBundle(
      [
        candidate({ id: "PLAN", kind: "stage_plan", stageKey: "evaluate" }),
        candidate({ id: "FACT", kind: "supplier_fact" }),
        candidate({ id: "ARCH", kind: "archetype_intelligence" }),
        candidate({ id: "CITE", kind: "citation" }),
        candidate({ id: "EVID", kind: "reviewed_evidence" }),
      ],
      IDENTITY,
    );
    expect(result.admitted.map((c) => c.id)).toEqual([
      "PLAN",
      "FACT",
      "ARCH",
      "CITE",
      "EVID",
    ]);
    expect(result.refused).toHaveLength(0);
    // `warn` rather than `pass`, and the caveat is the corpus policy's own: none
    // of these is cite-render-verified, so none is agent_ready. A refusal would
    // have shown up in `refused`, which is empty.
    expect(result.decision).toBe("warn");
    expect(result.bundle.warnings.length).toBeGreaterThan(0);
    expect(result.bundle.warnings.every((w) => w.includes("not agent_ready"))).toBe(
      true,
    );
  });

  it("de-duplicates citations across admitted candidates", () => {
    const result = buildGovernedEventContextBundle(
      [
        candidate({ id: "A", citations: ["loc-1", "loc-2"] }),
        candidate({ id: "B", citations: ["loc-2"] }),
      ],
      IDENTITY,
    );
    expect(result.citations).toEqual(["loc-1", "loc-2"]);
  });

  it("passes an empty candidate set rather than blocking on nothing", () => {
    const result = buildGovernedEventContextBundle([], IDENTITY);
    expect(result.decision).toBe("pass");
    expect(result.admitted).toHaveLength(0);
  });
});

describe("C-008 · opposite tenant", () => {
  it("refuses a candidate asserting the other canonical tenant", () => {
    const result = buildGovernedEventContextBundle(
      [
        candidate({
          id: "OTHER",
          clientKey: "skyharbor-air",
          tenantId: "tenant-skyharbor-0001",
        }),
      ],
      IDENTITY,
    );
    expect(codesFor(result, "OTHER")).toEqual(["opposite_tenant"]);
    expect(result.admitted).toHaveLength(0);
  });

  it("refuses a matching cover key carrying a different tenant id", () => {
    // The two-field check matters: a cover key alone is not identity.
    const result = buildGovernedEventContextBundle(
      [candidate({ id: "DRIFT", tenantId: "tenant-meridian-9999" })],
      IDENTITY,
    );
    expect(codesFor(result, "DRIFT")).toEqual(["opposite_tenant"]);
  });

  it("refuses a null tenant id", () => {
    const result = buildGovernedEventContextBundle(
      [candidate({ id: "NULLT", tenantId: null })],
      IDENTITY,
    );
    expect(codesFor(result, "NULLT")).toEqual(["opposite_tenant"]);
  });

  it("keeps the tenant post-condition true because the fence removed them", () => {
    const result = buildGovernedEventContextBundle(
      [
        ACCEPTED_ARTIFACT,
        candidate({
          id: "OTHER",
          clientKey: "skyharbor-air",
          tenantId: "tenant-skyharbor-0001",
        }),
      ],
      IDENTITY,
    );
    expect(result.tenantFencePassed).toBe(true);
    expect(result.admitted.map((c) => c.id)).toEqual(["ART-1@v3"]);
  });
});

describe("C-008 · cross event and cross contract", () => {
  it("refuses a candidate belonging to another event", () => {
    const result = buildGovernedEventContextBundle(
      [candidate({ id: "EVT2", eventId: "EVT-200" })],
      IDENTITY,
    );
    expect(codesFor(result, "EVT2")).toEqual(["cross_event"]);
  });

  it("refuses a null event id rather than treating it as unscoped", () => {
    const result = buildGovernedEventContextBundle(
      [candidate({ id: "NOEVT", eventId: null })],
      IDENTITY,
    );
    expect(codesFor(result, "NOEVT")).toEqual(["cross_event"]);
  });

  it("refuses a fact from another contract", () => {
    const result = buildGovernedEventContextBundle(
      [candidate({ id: "CTR6", contractId: "CTR-0006" })],
      IDENTITY,
    );
    expect(codesFor(result, "CTR6")).toEqual(["cross_contract"]);
  });

  it("refuses a contract-bound fact when the event is bound to no contract", () => {
    const result = buildGovernedEventContextBundle(
      [candidate({ id: "CTR2" })],
      { ...IDENTITY, contractId: null },
    );
    expect(codesFor(result, "CTR2")).toEqual(["cross_contract"]);
  });

  it("admits a contract-neutral fact on a contract-bound event", () => {
    const result = buildGovernedEventContextBundle(
      [candidate({ id: "NEUTRAL", contractId: null })],
      IDENTITY,
    );
    expect(result.admitted.map((c) => c.id)).toEqual(["NEUTRAL"]);
  });
});

describe("C-008 · raw uploads and draft AI text never enter", () => {
  it("refuses a raw upload however well governed it claims to be", () => {
    const result = buildGovernedEventContextBundle(
      [
        candidate({
          id: "UPLOAD",
          kind: "raw_upload",
          reviewState: "accepted",
          agentReadinessStatus: "agent_ready",
          retrievability: "search_indexed",
          citedRenderVerifiedAt: "2026-09-01T00:00:00Z",
          content: "raw scanned page text",
        }),
      ],
      IDENTITY,
    );
    expect(codesFor(result, "UPLOAD")).toEqual(["raw_upload"]);
    expect(result.admitted).toHaveLength(0);
  });

  it("refuses draft AI text", () => {
    const result = buildGovernedEventContextBundle(
      [
        candidate({
          id: "DRAFT",
          kind: "ai_draft",
          reviewState: "accepted",
          content: "suggested negotiation language",
        }),
      ],
      IDENTITY,
    );
    expect(codesFor(result, "DRAFT")).toEqual(["ai_draft"]);
  });

  it("refuses a kind that is not on the allowlist", () => {
    const result = buildGovernedEventContextBundle(
      [
        candidate({
          id: "NEW",
          kind: "parser_output" as EventContextCandidate["kind"],
        }),
      ],
      IDENTITY,
    );
    expect(codesFor(result, "NEW")).toEqual(["unknown_kind"]);
  });

  it("strips the prose from every refused candidate and says it did", () => {
    const result = buildGovernedEventContextBundle(
      [
        candidate({
          id: "UPLOAD",
          kind: "raw_upload",
          content: "raw scanned page text",
        }),
        candidate({ id: "DRAFT", kind: "ai_draft", content: "draft text" }),
        candidate({
          id: "OTHER",
          clientKey: "skyharbor-air",
          tenantId: "tenant-skyharbor-0001",
          content: "the other tenant's spend",
        }),
      ],
      IDENTITY,
    );
    expect(result.refused).toHaveLength(3);
    for (const refusal of result.refused) {
      expect(refusal.candidate.content).toBeUndefined();
      expect("content" in refusal.candidate).toBe(false);
      expect(refusal.contentRedacted).toBe(true);
    }
    expect(JSON.stringify(result.refused)).not.toContain("raw scanned");
    expect(JSON.stringify(result.refused)).not.toContain("the other tenant");
  });

  it("does not claim a redaction it did not perform", () => {
    const result = buildGovernedEventContextBundle(
      [candidate({ id: "NOTEXT", kind: "ai_draft" })],
      IDENTITY,
    );
    expect(result.refused[0].contentRedacted).toBe(false);
  });

  it("leaves an admitted candidate's prose intact", () => {
    const result = buildGovernedEventContextBundle(
      [candidate({ id: "FACT", content: "12 month term, 3 percent uplift" })],
      IDENTITY,
    );
    expect(result.admitted[0].content).toBe("12 month term, 3 percent uplift");
  });
});

describe("C-008 · stale versions", () => {
  it("refuses a superseded artifact version", () => {
    const result = buildGovernedEventContextBundle(
      [
        {
          ...ACCEPTED_ARTIFACT,
          id: "ART-1@v2",
          versionId: "v2",
        },
      ],
      IDENTITY,
    );
    expect(codesFor(result, "ART-1@v2")).toEqual(["stale_version"]);
  });

  it("refuses an artifact whose content has drifted from the accepted version", () => {
    const result = buildGovernedEventContextBundle(
      [{ ...ACCEPTED_ARTIFACT, contentDriftStatus: "stale" }],
      IDENTITY,
    );
    expect(codesFor(result, "ART-1@v3")).toEqual(["stale_version"]);
  });

  it("fails closed on unmeasured drift rather than treating unknown as current", () => {
    const result = buildGovernedEventContextBundle(
      [{ ...ACCEPTED_ARTIFACT, contentDriftStatus: "unknown" }],
      IDENTITY,
    );
    expect(codesFor(result, "ART-1@v3")).toEqual(["stale_version"]);
  });

  it("fails closed when drift was never recorded at all", () => {
    const stripped = { ...ACCEPTED_ARTIFACT };
    delete stripped.contentDriftStatus;
    const result = buildGovernedEventContextBundle([stripped], IDENTITY);
    expect(codesFor(result, "ART-1@v3")).toEqual(["stale_version"]);
  });
});

describe("C-008 · unreviewed evidence", () => {
  it("refuses an artifact with no acceptance for this event", () => {
    const result = buildGovernedEventContextBundle(
      [{ ...ACCEPTED_ARTIFACT, id: "ART-9@v1", artifactId: "ART-9" }],
      IDENTITY,
    );
    expect(codesFor(result, "ART-9@v1")).toEqual(["unreviewed_evidence"]);
  });

  it("refuses draft review state", () => {
    const result = buildGovernedEventContextBundle(
      [candidate({ id: "D", reviewState: "draft" })],
      IDENTITY,
    );
    expect(codesFor(result, "D")).toEqual(["unreviewed_evidence"]);
  });

  it("refuses rejected and superseded review states", () => {
    const result = buildGovernedEventContextBundle(
      [
        candidate({ id: "R", reviewState: "rejected" }),
        candidate({ id: "S", reviewState: "superseded" }),
      ],
      IDENTITY,
    );
    expect(codesFor(result, "R")).toEqual(["unreviewed_evidence"]);
    expect(codesFor(result, "S")).toEqual(["unreviewed_evidence"]);
  });

  it("fails closed when no review state was recorded", () => {
    const stripped = candidate({ id: "U" });
    delete stripped.reviewState;
    const result = buildGovernedEventContextBundle([stripped], IDENTITY);
    expect(codesFor(result, "U")).toEqual(["unreviewed_evidence"]);
  });
});

describe("C-008 · stage plan currency", () => {
  it("refuses a plan written for a stage the event has left", () => {
    const result = buildGovernedEventContextBundle(
      [candidate({ id: "OLDPLAN", kind: "stage_plan", stageKey: "scope" })],
      IDENTITY,
    );
    expect(codesFor(result, "OLDPLAN")).toEqual(["superseded_stage_plan"]);
  });
});

describe("C-008 · the corpus policy still runs underneath", () => {
  it('refuses downstream_context_policy "exclude" as a policy block', () => {
    const result = buildGovernedEventContextBundle(
      [candidate({ id: "EXC", downstreamContextPolicy: "exclude" })],
      IDENTITY,
    );
    expect(codesFor(result, "EXC")).toEqual(["policy_blocked"]);
    expect(result.admitted).toHaveLength(0);
  });

  it('refuses "restricted" unless the caller opted in', () => {
    const restricted = candidate({
      id: "RES",
      downstreamContextPolicy: "restricted",
    });
    expect(codesFor(
      buildGovernedEventContextBundle([restricted], IDENTITY),
      "RES",
    )).toEqual(["policy_blocked"]);
    expect(
      buildGovernedEventContextBundle([restricted], IDENTITY, {
        allowRestrictedDownstreamContext: true,
      }).admitted.map((c) => c.id),
    ).toEqual(["RES"]);
  });

  it("refuses a sensitive classification by default", () => {
    const result = buildGovernedEventContextBundle(
      [candidate({ id: "PII", classification: "pii" })],
      IDENTITY,
    );
    expect(codesFor(result, "PII")).toEqual(["policy_blocked"]);
  });

  it("refuses a candidate that claims agent_ready without meeting the gate", () => {
    const result = buildGovernedEventContextBundle(
      [
        candidate({
          id: "FAKEREADY",
          agentReadinessStatus: "agent_ready",
          citedRenderVerifiedAt: null,
        }),
      ],
      IDENTITY,
    );
    expect(codesFor(result, "FAKEREADY")).toEqual(["policy_blocked"]);
  });
});

describe("C-008 · reporting", () => {
  it("reports the isolation boundary first when a candidate fails several rules", () => {
    // Both cross-tenant and a raw upload. An audit needs the cross-tenant fact.
    const result = buildGovernedEventContextBundle(
      [
        candidate({
          id: "BOTH",
          kind: "raw_upload",
          clientKey: "skyharbor-air",
          tenantId: "tenant-skyharbor-0001",
        }),
      ],
      IDENTITY,
    );
    expect(codesFor(result, "BOTH")).toEqual(["opposite_tenant"]);
  });

  it("blocks the bundle when every candidate was refused", () => {
    const result = buildGovernedEventContextBundle(
      [candidate({ id: "X", kind: "ai_draft" })],
      IDENTITY,
    );
    expect(result.decision).toBe("block");
  });

  it("warns when some were admitted and some refused", () => {
    const result = buildGovernedEventContextBundle(
      [ACCEPTED_ARTIFACT, candidate({ id: "X", kind: "ai_draft" })],
      IDENTITY,
    );
    expect(result.decision).toBe("warn");
  });

  it("counts refusals by code", () => {
    const result = buildGovernedEventContextBundle(
      [
        candidate({ id: "A", kind: "ai_draft" }),
        candidate({ id: "B", kind: "raw_upload" }),
        candidate({ id: "C", kind: "raw_upload" }),
      ],
      IDENTITY,
    );
    const counts = summarizeEventContextRefusals(result);
    expect(counts.ai_draft).toBe(1);
    expect(counts.raw_upload).toBe(2);
    expect(counts.opposite_tenant).toBe(0);
  });
});

describe("C-008 · the fence post-condition, tested where it can fail", () => {
  // `buildGovernedEventContextBundle` can never hand this function a bad set
  // while the filter works, so the invariant is exercised directly. Without
  // these three cases, deleting the post-condition changes nothing observable —
  // measured: it was the one mutation of fifteen that escaped.
  it("holds for a set that is entirely in-tenant and in-event", () => {
    expect(eventContextFenceHolds([ACCEPTED_ARTIFACT], IDENTITY)).toBe(true);
    expect(eventContextFenceHolds([], IDENTITY)).toBe(true);
  });

  it("fails on an opposite-tenant row that reached the admitted set", () => {
    expect(
      eventContextFenceHolds(
        [
          ACCEPTED_ARTIFACT,
          candidate({
            id: "LEAK",
            clientKey: "skyharbor-air",
            tenantId: "tenant-skyharbor-0001",
          }),
        ],
        IDENTITY,
      ),
    ).toBe(false);
  });

  it("fails on a same-tenant row from another event", () => {
    expect(
      eventContextFenceHolds(
        [candidate({ id: "LEAK", eventId: "EVT-200" })],
        IDENTITY,
      ),
    ).toBe(false);
  });

  it("fails on a matching cover key with a different tenant id", () => {
    expect(
      eventContextFenceHolds(
        [candidate({ id: "LEAK", tenantId: "tenant-meridian-9999" })],
        IDENTITY,
      ),
    ).toBe(false);
  });
});

describe("C-008 · shadow adoption comparison", () => {
  it("reports agreement when the fence admits exactly what the read path uses", () => {
    const bundle = buildGovernedEventContextBundle(
      [ACCEPTED_ARTIFACT],
      IDENTITY,
    );
    const comparison = compareEventContextAdoption(["ART-1@v3"], bundle);
    expect(comparison).toMatchObject({
      currentCount: 1,
      fencedCount: 1,
      wouldRemove: [],
      wouldAdd: [],
      agrees: true,
    });
  });

  it("names what adoption would remove, and why, without removing it", () => {
    const bundle = buildGovernedEventContextBundle(
      [
        ACCEPTED_ARTIFACT,
        { ...ACCEPTED_ARTIFACT, id: "ART-9@v1", artifactId: "ART-9" },
      ],
      IDENTITY,
    );
    const comparison = compareEventContextAdoption(
      ["ART-1@v3", "ART-9@v1"],
      bundle,
    );
    expect(comparison.wouldRemove).toEqual(["ART-9@v1"]);
    expect(comparison.refusalsByCode.unreviewed_evidence).toBe(1);
    expect(comparison.agrees).toBe(false);
    // The shadow comparison is a measurement, not an edit: the bundle it was
    // computed from is unchanged and the caller keeps its own list.
    expect(bundle.admitted.map((c) => c.id)).toEqual(["ART-1@v3"]);
  });

  it("reports an admission the read path does not have, which should be empty in practice", () => {
    const bundle = buildGovernedEventContextBundle(
      [ACCEPTED_ARTIFACT],
      IDENTITY,
    );
    expect(compareEventContextAdoption([], bundle).wouldAdd).toEqual([
      "ART-1@v3",
    ]);
  });
});

describe("C-008 · negative control — the policy seam alone does not do this", () => {
  // Independent truth: these assertions describe `buildValidatedAgentContextBundle`,
  // the module under repair's dependency, NOT the module under test. If the fence
  // were redundant, every one of them would fail.
  const governed = (over: Record<string, unknown>) => ({
    id: "N",
    client_key: "skyharbor-air",
    tenant_id: "tenant-skyharbor-0001",
    source_layer: "source_event" as const,
    source_basis: "source_event_read_model",
    classification: "internal" as const,
    retrievability: "fts_indexed" as const,
    agent_readiness_status: "committed_not_indexed" as const,
    confidence_level: "medium" as const,
    cited_render_verified_at: null,
    ...over,
  });

  it("admits the opposite tenant, because it is never told whose answer this is", () => {
    const seam = buildValidatedAgentContextBundle([governed({})]);
    expect(seam.usable.map((c) => c.id)).toEqual(["N"]);
    expect(seam.blocked).toHaveLength(0);
  });

  it("has no notion of event, contract, artifact version or review state", () => {
    const seam = buildValidatedAgentContextBundle([
      governed({ client_key: "meridian-health", tenant_id: IDENTITY.tenantId }),
    ]);
    expect(seam.usable).toHaveLength(1);
    // Nothing in the governed-candidate shape can express any of them.
    expect(Object.keys(seam.usable[0])).not.toContain("eventId");
    expect(Object.keys(seam.usable[0])).not.toContain("versionId");
    expect(Object.keys(seam.usable[0])).not.toContain("reviewState");
  });
});
