import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { getHomeReviewBundle } from "@/lib/home/preview/golden-snapshot";
import { homeRecordSourceToken } from "@/lib/home/preview/record-source-token";
import { renderHomeWalkthroughHtml } from "@/lib/home/export/walkthrough-export";
import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import { answerHomeAvaQuestion } from "@/lib/home/preview/ava-answer";
import {
  attachHomeInsightAdmission,
  validateHomeInsightAdmission,
  type HomeInsightAdmission,
} from "../home-admission";
import { insightHash, insightUuid, INSIGHT_RULES } from "../engine";
import { candidateGovernance } from "../store";
import type { InsightPlan } from "../types";
import type { HomeRecordRenderSource } from "@/lib/home/preview/types";

jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: jest.fn(),
}));

const tenantKey = CANONICAL_TENANT_KEYS.find((key) =>
  getHomeReviewBundle(key),
)!;
const base = getHomeReviewBundle(tenantKey)!;
const source: HomeRecordRenderSource = {
  kind: "ecl_serving_projection",
  canonicalSnapshotHash: "base-marker",
  contextVersion: {
    assessmentId: "test-insight-admission",
    projectionContentHash: "a".repeat(64),
    sourceSetHash: "b".repeat(64),
    sourceLineageHash: "c".repeat(64),
    deterministicPacketHash: "d".repeat(64),
    narrativePacketHash: "d".repeat(64),
    narrativeGeneratedAt: "2026-10-12T00:00:00Z",
    dataAsOf: "2026-10-12",
    sourceCoverage: { totalRecordRows: 1, linkedRecordRows: 1, families: [] },
    coherence: "coherent",
  },
};
const baseToken = homeRecordSourceToken(tenantKey, source);
function fixture(): HomeInsightAdmission {
  const finding = {
    id: insightUuid("test-finding"),
    ruleKey: "risk-critical-dependency" as const,
    kind: "record_finding" as const,
    headline: "A declared dependency needs review.",
    detail:
      "A rated risk links a critical application to its hosting platform.",
    objectIds: [insightUuid("application")],
    relationshipIds: [insightUuid("edge")],
    measureIds: [],
    sourceRecordIds: [insightUuid("source")],
    cubeSliceIds: [],
    caveats: ["Synthetic reference; not client-attested."],
    reviewState: "not_reviewed" as const,
    agentReady: false as const,
  };
  const result = {
    findings: [finding],
    evaluations: [],
    inventory: {},
    excluded: { objects: 0, relationships: 0, measures: 0 },
  };
  const sourceSetHash = "e".repeat(64);
  const ruleSetHash = insightHash(INSIGHT_RULES);
  const resultHash = insightHash(result);
  const plan: InsightPlan = {
    ...result,
    tenantKey,
    assessmentId: source.contextVersion!.assessmentId,
    asOf: "2026-10-12",
    sourceSetHash,
    ruleSetHash,
    resultHash,
    releaseId: insightUuid({
      tenant: tenantKey,
      assessment: source.contextVersion!.assessmentId,
      sourceSetHash,
      ruleSetHash,
    }),
    loadVersionHash: insightHash({ sourceSetHash, ruleSetHash, resultHash }),
  };
  const approval = {
    approved_by: "Morgan Example",
    approved_at: "2026-10-12",
    assessment_id: plan.assessmentId,
    source_set_hash: plan.loadVersionHash,
    release_record:
      "docs/releases/records/2026-10-12-home-integrated-insight-admission.md",
  };
  return {
    plan,
    manifest: {
      dataset_id: "test-insights",
      title: "Synthetic local test",
      client_key: tenantKey,
      source_layer: "signal",
      classification: "confidential",
      owner: "Example",
      source_basis: "Canonical local test",
      ingestion_method: "operator_aca_job",
      retrieval_plan: "postgres_fts",
      retrieval_proof_required: true,
      expected_object_count: 1,
      approved_by: "Morgan Example",
      approved_at: "2026-10-12",
      load_approval: approval,
      serving_approval: { ...approval, surface: "home" },
    },
    review: {
      contractVersion: "home-insight-review/v1",
      tenantKey,
      assessmentId: plan.assessmentId,
      releaseId: plan.releaseId,
      loadVersionHash: plan.loadVersionHash,
      baseHomeRecordToken: baseToken,
      reviewedBy: "Morgan Example",
      reviewedAt: "2026-10-12",
      findings: [
        {
          findingId: finding.id,
          findingHash: insightHash(finding),
          governance: {
            ...candidateGovernance(plan, finding, "local-test"),
            agent_readiness_status: "agent_ready",
            retrievability: "fts_indexed",
            confidence_level: "medium",
            confidence_rationale: "Local fixture review only",
            cited_render_verified_at: "2026-10-12T00:00:00Z",
            last_reviewed_at: "2026-10-12T00:00:00Z",
          },
        },
      ],
    },
  };
}
const check = (admission: HomeInsightAdmission) =>
  validateHomeInsightAdmission({
    admission,
    tenantKey,
    assessmentId: source.contextVersion!.assessmentId,
    baseHomeRecordToken: baseToken,
  });

it("admits an exact reviewed version without changing its candidate governance", () => {
  const admission = fixture();
  expect(() => check(admission)).not.toThrow();
  expect(admission.plan.findings[0].agentReady).toBe(false);
  expect(admission.plan.findings[0].reviewState).toBe("not_reviewed");
});
it.each([
  "tenant",
  "assessment",
  "home",
  "result",
  "candidate",
  "reviewer",
  "source",
  "confidence",
  "index",
  "citation",
  "restricted",
  "approval",
])("refuses a changed or unready %s binding", (field) => {
  const a = fixture();
  const governed = a.review.findings[0].governance;
  if (field === "tenant")
    a.review.tenantKey = CANONICAL_TENANT_KEYS.find(
      (key) => key !== tenantKey,
    )!;
  if (field === "assessment") a.review.assessmentId = "other-assessment";
  if (field === "home") a.review.baseHomeRecordToken = "f".repeat(64);
  if (field === "result") a.plan.findings[0].detail = "Unreviewed change";
  if (field === "candidate") a.review.findings[0].findingHash = "f".repeat(64);
  if (field === "reviewer") a.review.reviewedBy = "Automated Agent";
  if (field === "source") governed.source_references = [];
  if (field === "confidence") governed.confidence_level = "unverified";
  if (field === "index") governed.retrievability = "not_indexed";
  if (field === "citation") governed.cited_render_verified_at = null;
  if (field === "restricted") governed.classification = "restricted";
  if (field === "approval")
    (a.manifest as { serving_approval: unknown }).serving_approval = null;
  expect(() => check(a)).toThrow();
});
it("requires exactly one review per finding", () => {
  const a = fixture();
  a.review.findings.push(a.review.findings[0]);
  expect(() => check(a)).toThrow();
});
it.each(["reviewed_snapshot", "reviewed_snapshot_fallback"] as const)(
  "never enriches %s with new data",
  (kind) => {
    expect(() =>
      attachHomeInsightAdmission(
        base,
        { ...source, kind },
        baseToken,
        fixture(),
      ),
    ).toThrow();
  },
);
it("changes the page/advisor/export equality marker and preserves inspectable source signals", () => {
  const a = fixture();
  const next = attachHomeInsightAdmission(base, source, baseToken, a);
  expect(homeRecordSourceToken(tenantKey, next.recordSource)).not.toBe(
    baseToken,
  );
  expect(next.bundle.contextVersion).toEqual(next.recordSource.contextVersion);
  expect(next.bundle.thesis.signalPacket.signals.at(-1)?.evidenceRefs).toEqual(
    a.plan.findings[0].sourceRecordIds,
  );
  const claim = next.bundle.chapters
    .find((chapter) => chapter.chapterId === "what_needs_attention")!
    .key_insights.at(-1)!;
  expect(claim.statement).toContain("not client-attested");
  expect(claim.evidence_ids).toEqual([
    next.bundle.thesis.signalPacket.signals.at(-1)!.id,
  ]);
  expect(next.bundle.technologyEstate).toBe(base.technologyEstate);
  expect(
    renderHomeWalkthroughHtml({
      ...next,
      tenantLabel: "Synthetic test",
      format: "html",
    }),
  ).toContain("A declared dependency needs review.");
  expect(renderHomeWalkthroughHtml({ ...next, tenantLabel: "Synthetic test", format: "html" }))
    .toContain(homeRecordSourceToken(tenantKey, next.recordSource));
});
it("provides the same admitted claim to aVa even with a different chapter active", async () => {
  const create = jest.fn().mockResolvedValue({
    content: [
      {
        type: "text",
        text: JSON.stringify({
          status: "no_data",
          direct_answer: "No broader conclusion established.",
          cited_claim_tags: [],
          visual: { type: "none" },
          caveats: ["Keep the declared dependency scope."],
        }),
      },
    ],
  });
  (getAuditedAnthropicClient as jest.Mock).mockResolvedValue({
    client: { messages: { create } },
    auditId: "test",
    dataClass: "confidential",
  });
  const next = attachHomeInsightAdmission(base, source, baseToken, fixture());
  await answerHomeAvaQuestion({
    bundle: next.bundle,
    tenantKey,
    activeChapterId: "our_business",
    question: "Where do risk dependencies threaten execution?",
  });
  expect(create).toHaveBeenCalled();
  expect(JSON.stringify(create.mock.calls[0][0])).toContain(
    "A declared dependency needs review.",
  );
  expect(JSON.stringify(create.mock.calls[0][0])).toContain(
    "not client-attested",
  );
});
