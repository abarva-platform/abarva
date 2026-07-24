/**
 * Nexus Pricing Engine — PR7 hardening: brief §12's "re-assert, don't just
 * trust PR3/PR6's own tests" governance requirements.
 *
 * PR3's `governed-projection.test.ts` and PR6's `business-case-projection.test.ts`
 * already prove their respective safe-summary shapes against ALL-MOCKED
 * dependencies (every upstream repository function replaced with a
 * hand-built return value). This file re-asserts the SAME "never the full
 * rate lines" / "never the granular labor breakdown" discipline against
 * REAL data that flowed through the REAL governed-load import pipeline and
 * the REAL approval/snapshot pipeline (via `../__fixtures__/pr7-e2e-harness`)
 * — an independent check that the safe-summary boundary holds for genuine
 * output, not only for a fixture the projection's own test author already
 * shaped to be safe.
 *
 * It also proves brief §12's audit-trail requirement end-to-end: that
 * `approved_by` / `approval_rationale` / `content_hash` / `version` are
 * ACTUALLY populated (non-null, non-empty) on a real commit and a real
 * approval — not merely present as unused schema columns.
 */
import {
  createPricingFixtureDb,
  createEstimateFixtureStore,
  wireReferenceReadMocks,
  wireRateCardReadMocks,
  wireEffortEnginePackMock,
  makeRateCardStorePort,
  makeInMemorySnapshotStore,
  buildClientRateCardCsv,
  resetPr7HarnessMocks,
  mockGetCurrentRateCard,
  mockListRateCardLines,
  mockGetCurrentTaxonomyVersion,
  mockListRoles,
  mockListRateBands,
  mockGetRoleByCode,
  mockListSeniorityLevels,
  mockReadEffortEnginePack,
  type PricingFixtureDb,
} from "../__fixtures__/pr7-e2e-harness";

jest.mock("../rate-card-repository", () => {
  const actual = jest.requireActual("../rate-card-repository");
  return {
    ...actual,
    getCurrentRateCard: (...args: unknown[]) => mockGetCurrentRateCard(...args),
    listRateCardLines: (...args: unknown[]) => mockListRateCardLines(...args),
  };
});
jest.mock("../reference-repository", () => {
  const actual = jest.requireActual("../reference-repository");
  return {
    ...actual,
    getCurrentTaxonomyVersion: (...args: unknown[]) => mockGetCurrentTaxonomyVersion(...args),
    listRoles: (...args: unknown[]) => mockListRoles(...args),
    listRateBands: (...args: unknown[]) => mockListRateBands(...args),
    getRoleByCode: (...args: unknown[]) => mockGetRoleByCode(...args),
    listSeniorityLevels: (...args: unknown[]) => mockListSeniorityLevels(...args),
  };
});
jest.mock("../effort-engine/model-registry", () => {
  const actual = jest.requireActual("../effort-engine/model-registry");
  return { ...actual, readEffortEnginePack: (...args: unknown[]) => mockReadEffortEnginePack(...args) };
});
// `buildGovernedPricingProjection` also reads `pricing_client_profiles`
// (unseeded by this harness — no client profile is committed in this test)
// and `pricing_model_versions` (also unseeded) — both real, direct-azureRead
// reads with no consumer-supplied fixture data needed for this test's
// purpose, so a simple "nothing seeded" fake is sufficient here.
jest.mock("../governed-load/client-profile-repository", () => {
  const actual = jest.requireActual("../governed-load/client-profile-repository");
  return { ...actual, getCurrentClientProfile: async () => null };
});
jest.mock("../governed-load/reference-lookup", () => {
  const actual = jest.requireActual("../governed-load/reference-lookup");
  return { ...actual, getCurrentModelVersion: async () => null };
});

const mockEstimateStoreRef: { current: ReturnType<typeof createEstimateFixtureStore> } = {
  current: createEstimateFixtureStore(),
};
jest.mock("../moves-workflow/estimate-repository", () => ({
  createDraftEstimate: (...args: unknown[]) => (mockEstimateStoreRef.current.createDraftEstimate as (...a: unknown[]) => unknown)(...args),
  getEstimate: (...args: unknown[]) => (mockEstimateStoreRef.current.getEstimate as (...a: unknown[]) => unknown)(...args),
  updateEstimateHeader: (...args: unknown[]) => (mockEstimateStoreRef.current.updateEstimateHeader as (...a: unknown[]) => unknown)(...args),
  listEstimateInputs: (...args: unknown[]) => (mockEstimateStoreRef.current.listEstimateInputs as (...a: unknown[]) => unknown)(...args),
  upsertEstimateInputs: (...args: unknown[]) => (mockEstimateStoreRef.current.upsertEstimateInputs as (...a: unknown[]) => unknown)(...args),
  listLineItems: (...args: unknown[]) => (mockEstimateStoreRef.current.listLineItems as (...a: unknown[]) => unknown)(...args),
  replaceLineItems: (...args: unknown[]) => (mockEstimateStoreRef.current.replaceLineItems as (...a: unknown[]) => unknown)(...args),
}));

import { previewClientRateCardImport, commitClientRateCardImport } from "../governed-load/rate-card-import";
import { buildGovernedPricingProjection } from "../governed-load/governed-projection";
import { buildBusinessCasePricingSummary } from "../governed-load/business-case-projection";
import { resolveActivityPacksForArchetype } from "../effort-engine/activity-packs";
import { listRequiredDriverCodesForArchetype } from "../moves-workflow/move-context-suggestions";
import { validateEstimateForRun } from "../moves-workflow/validation-gate";
import { runEstimate } from "../moves-workflow/execution-service";
import { createEstimateSnapshot, toScopeFingerprintInput } from "../effort-engine/snapshot-service";
import { loadRealEffortEnginePack } from "../effort-engine/__fixtures__/test-fixtures";

const REAL_PACK = loadRealEffortEnginePack();
const ARCHETYPE_CODE = "ARCH-01";

const DRIVER_QUANTITIES: Record<string, number> = {
  integration_count: 8,
  impacted_user_count: 1500,
  ai_use_case_count: 3,
  model_count: 2,
};

describe("PR7 governance re-assertion — safe-projection boundary + real audit-trail population", () => {
  let db: PricingFixtureDb;
  const tenantKey = "tenant-governance";
  const moveId = "move-governance";

  beforeEach(() => {
    resetPr7HarnessMocks();
    db = createPricingFixtureDb();
    wireReferenceReadMocks(db);
    wireRateCardReadMocks(db);
    wireEffortEnginePackMock();
    mockEstimateStoreRef.current = createEstimateFixtureStore();
  });

  it("buildGovernedPricingProjection, against a REAL committed rate card, never surfaces raw lines — only the documented safe summary", async () => {
    const roleCodes = resolveActivityPacksForArchetype(REAL_PACK, ARCHETYPE_CODE).flatMap((p) => p.roleMix.map((r) => r.roleCode));
    const csv = buildClientRateCardCsv(Array.from(new Set(roleCodes)));
    const preview = await previewClientRateCardImport({ tenantKey, cardCode: "ENTERPRISE", csvText: csv });
    const commit = await commitClientRateCardImport(
      { tenantKey, cardCode: "ENTERPRISE", lines: preview.linesToCommit, approvedBy: "admin-1", approvalRationale: "Governance re-assertion fixture" },
      makeRateCardStorePort(db, "client", tenantKey, "ENTERPRISE"),
    );
    expect(commit.action).toBe("new_version");

    const projection = await buildGovernedPricingProjection(tenantKey);

    // Re-assert the exact safe shape, independently of PR3's own test.
    expect(projection).toEqual({
      tenantKey,
      rateCard: {
        cardCode: "ENTERPRISE",
        version: expect.any(Number),
        status: "approved",
        effectiveFrom: null,
        effectiveTo: null,
      },
      coveragePct: expect.any(Number),
      unresolvedGapCount: expect.any(Number),
      clientProfile: null,
      modelVersion: null,
      taxonomyVersion: db.taxonomyVersion,
      generatedAt: expect.any(String),
    });

    // Structurally: no key on the returned object names anything
    // line/rate-value shaped — guards against a future field addition
    // silently widening the safe boundary without a deliberate decision.
    const forbiddenKeyFragments = ["line", "rateValue", "rate_value", "roleOrBandRef", "role_or_band_ref"];
    const serialized = JSON.stringify(projection).toLowerCase();
    for (const fragment of forbiddenKeyFragments) {
      expect(serialized).not.toContain(fragment.toLowerCase());
    }
  });

  it("buildBusinessCasePricingSummary, against a REAL approved snapshot, never surfaces line items or the granular labor/manual/hours breakdown", async () => {
    const roleCodes = resolveActivityPacksForArchetype(REAL_PACK, ARCHETYPE_CODE).flatMap((p) => p.roleMix.map((r) => r.roleCode));
    const csv = buildClientRateCardCsv(Array.from(new Set(roleCodes)));
    const preview = await previewClientRateCardImport({ tenantKey, cardCode: "ENTERPRISE", csvText: csv });
    const commit = await commitClientRateCardImport(
      { tenantKey, cardCode: "ENTERPRISE", lines: preview.linesToCommit, approvedBy: "admin-1", approvalRationale: "Governance re-assertion fixture" },
      makeRateCardStorePort(db, "client", tenantKey, "ENTERPRISE"),
    );

    const store = mockEstimateStoreRef.current;
    const estimate = await store.createDraftEstimate({
      tenantKey,
      moveId,
      scenarioName: "Governance re-assertion",
      archetypeCode: ARCHETYPE_CODE,
      modelVersion: REAL_PACK.modelVersion,
      createdBy: "estimator-1",
    });
    await store.updateEstimateHeader(estimate.id, {
      currency: "USD",
      targetStartDate: "2026-09-01",
      targetDurationWeeks: 16,
      selectedRateCardId: commit.cardId,
    });
    const driverCodes = listRequiredDriverCodesForArchetype(REAL_PACK, ARCHETYPE_CODE);
    await store.upsertEstimateInputs(
      estimate.id,
      driverCodes.map((driverCode) => ({
        inputKey: driverCode,
        value: DRIVER_QUANTITIES[driverCode] ?? 5,
        sourceType: "client_input" as const,
        confirmedBy: "estimator-1",
      })),
    );
    const inputs = await store.listEstimateInputs(estimate.id);
    expect(validateEstimateForRun(
      { currency: "USD", targetStartDate: "2026-09-01", targetDurationWeeks: 16, selectedRateCardId: commit.cardId },
      driverCodes,
      inputs.map((r) => ({ inputKey: r.input_key, value: r.value, confirmedAt: r.confirmed_at, overrideReason: r.override_reason, confidence: r.confidence })),
    ).ready).toBe(true);

    const runResult = await runEstimate({ estimateId: estimate.id, tenantKey });
    expect(runResult.totals.gapCount).toBe(0);

    const snapshotStore = makeInMemorySnapshotStore();
    const snapshot = await createEstimateSnapshot(
      {
        estimateId: estimate.id,
        tenantKey,
        moveId,
        archetypeCode: ARCHETYPE_CODE,
        modelVersion: runResult.modelVersion,
        scenarioKey: runResult.scenarioKey,
        currency: "USD",
        totals: runResult.totals,
        range: runResult.range,
        topAssumptions: runResult.topAssumptions,
        topUncertaintyDrivers: runResult.topUncertaintyDrivers,
        rateCardVersionId: commit.cardId,
        clientProfileVersionId: null,
        taxonomyVersion: db.taxonomyVersion,
        inputs: inputs.map(toScopeFingerprintInput),
        preparedBy: "estimator-1",
        approvedBy: "approver-1",
        approvalRationale: "Governance re-assertion — approved for safe-projection proof",
      },
      snapshotStore,
    );

    const summary = buildBusinessCasePricingSummary(snapshot);

    // Structural re-assertion, independent of PR6's own test: the safe
    // summary object literally has NO lineItems / costByActivityPack /
    // costByRole / internalVsExternal / totalLaborCostCents keys.
    expect(summary).not.toHaveProperty("lineItems");
    expect(summary).not.toHaveProperty("costByActivityPack");
    expect(summary).not.toHaveProperty("costByRole");
    expect(summary).not.toHaveProperty("internalVsExternal");
    expect((summary as unknown as Record<string, unknown>).totalLaborCostCents).toBeUndefined();
    expect((summary as unknown as Record<string, unknown>).totalManualCostCents).toBeUndefined();
    expect((summary as unknown as Record<string, unknown>).gapCount).toBeUndefined();
    expect(summary.lowCents).toBe(runResult.range.lowCents);
    expect(summary.expectedCents).toBe(runResult.range.expectedCents);
    expect(summary.highCents).toBe(runResult.range.highCents);

    // -----------------------------------------------------------------
    // Audit-trail proof (brief §12): approved_by / approval_rationale /
    // content_hash / version are ACTUALLY populated end-to-end, not just
    // unused schema columns.
    // -----------------------------------------------------------------
    expect(snapshot.approved_by).toBe("approver-1");
    expect(snapshot.approval_rationale).toBe("Governance re-assertion — approved for safe-projection proof");
    expect(snapshot.approved_at).toEqual(expect.any(String));
    expect(snapshot.upstream_scope_fingerprint.length).toBeGreaterThan(0);

    const rateCardHistory = db.rateCardScopes.get(`client::${tenantKey}::ENTERPRISE`);
    expect(rateCardHistory?.current?.approved_by).toBe("admin-1");
    expect(rateCardHistory?.current?.approval_rationale).toBe("Governance re-assertion fixture");
    expect(rateCardHistory?.current?.content_hash.length).toBeGreaterThan(0);
    expect(rateCardHistory?.current?.version).toBe(1);
  });
});
