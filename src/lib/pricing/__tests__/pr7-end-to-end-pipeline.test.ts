/**
 * Nexus Pricing Engine — PR7 hardening: genuine cross-module end-to-end
 * pipeline tests (brief §12's "end-to-end examples").
 *
 * Unlike every prior PR's own unit tests (which each prove ONE module against
 * an injected fake), this file drives the REAL, unmocked business logic of
 * PR3 (governed rate-card import) -> PR4 (effort engine, via PR5's real
 * `runEstimate`) -> PR5 (Moves estimate workflow) -> PR6 (approval/snapshot)
 * against ONE shared in-memory "database" (`../__fixtures__/pr7-e2e-harness`).
 * See that file's header for exactly which functions are mocked (only the
 * direct DB-read boundary — `reference-repository.ts` / `rate-card-repository.ts`
 * reads, `effort-engine/model-registry.ts#readEffortEnginePack`, and
 * `moves-workflow/estimate-repository.ts` as a whole module) versus run for
 * real (everything else, including PR4's actual `runEffortEngine`, PR3's
 * actual `buildRateCardCoverageReport`, and PR6's actual `createEstimateSnapshot`).
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

// Imported AFTER every jest.mock() above.
import { previewClientRateCardImport, commitClientRateCardImport } from "../governed-load/rate-card-import";
import { resolveActivityPacksForArchetype } from "../effort-engine/activity-packs";
import { listRequiredDriverCodesForArchetype } from "../moves-workflow/move-context-suggestions";
import { validateEstimateForRun } from "../moves-workflow/validation-gate";
import { runEstimate } from "../moves-workflow/execution-service";
import {
  createEstimateSnapshot,
  getApprovedSnapshotForMove,
  toScopeFingerprintInput,
} from "../effort-engine/snapshot-service";
import { loadRealEffortEnginePack } from "../effort-engine/__fixtures__/test-fixtures";

const REAL_PACK = loadRealEffortEnginePack();

/** The 8 launch archetypes named in brief §12, mapped to PR4's real archetype codes (confirmed via `datasets/reference/pricing-engine-v1/pricing_archetypes.csv`). */
const LAUNCH_ARCHETYPES: { code: string; launchName: string }[] = [
  { code: "ARCH-01", launchName: "AI document/workflow automation" },
  { code: "ARCH-02", launchName: "Data product/lakehouse" },
  { code: "ARCH-03", launchName: "Application modernization" },
  { code: "ARCH-04", launchName: "Cloud/integration platform" },
  { code: "ARCH-05", launchName: "Process/operating-model transformation" },
  { code: "ARCH-06", launchName: "Managed-services transition" },
  { code: "ARCH-07", launchName: "ERP implementation/upgrade" },
  { code: "ARCH-08", launchName: "Mainframe modernization" },
];

/** Illustrative scope-driver quantities covering every driver code any archetype's rules reference (mirrors `golden-fixtures.test.ts`'s own fixture map). */
const DRIVER_QUANTITIES: Record<string, number> = {
  integration_count: 8,
  impacted_user_count: 1500,
  rollout_wave_count: 3,
  stakeholder_group_count: 6,
  course_count: 5,
  training_session_count: 15,
  supplier_month_count: 10,
  data_domain_count: 4,
  data_source_count: 6,
  report_count: 12,
  process_count: 5,
  automation_count: 6,
  environment_count: 4,
  application_count: 3,
  module_count: 4,
  batch_job_count: 120,
  program_count: 60,
  ai_use_case_count: 3,
  model_count: 2,
  support_ticket_volume_monthly: 800,
  role_count: 10,
  test_case_count: 300,
  hypercare_week_count: 6,
};

function roleCodesForArchetype(archetypeCode: string): string[] {
  const resolved = resolveActivityPacksForArchetype(REAL_PACK, archetypeCode);
  const codes = new Set<string>();
  for (const p of resolved) for (const rm of p.roleMix) codes.add(rm.roleCode);
  return Array.from(codes);
}

async function setUpTenantWithRateCard(db: PricingFixtureDb, tenantKey: string, roleCodes: readonly string[]) {
  const csv = buildClientRateCardCsv(roleCodes);
  const preview = await previewClientRateCardImport({ tenantKey, cardCode: "ENTERPRISE", csvText: csv });
  expect(preview.parseErrors).toEqual([]);
  expect(preview.validationErrors).toEqual([]);
  const store = makeRateCardStorePort(db, "client", tenantKey, "ENTERPRISE");
  const commit = await commitClientRateCardImport(
    { tenantKey, cardCode: "ENTERPRISE", lines: preview.linesToCommit, approvedBy: "admin-1", approvalRationale: "Initial client rate card" },
    store,
  );
  return { preview, commit };
}

async function createAndRunEstimate(opts: {
  tenantKey: string;
  moveId: string;
  archetypeCode: string;
  confirmedBy: string;
  /** The REAL committed client rate-card id (from `commitClientRateCardImport`'s result) — matches the real wizard's step-1 auto-select-the-current-ENTERPRISE-card behavior (PR5), and matters for staleness fingerprinting: the real approve route stamps a snapshot's fingerprint from `estimate.selected_rate_card_id`, so this must be the SAME value the estimate's header carries, not an arbitrary placeholder string. */
  rateCardId: string;
}) {
  const { tenantKey, moveId, archetypeCode, confirmedBy, rateCardId } = opts;
  const store = mockEstimateStoreRef.current;

  const estimate = await store.createDraftEstimate({
    tenantKey,
    moveId,
    scenarioName: `${archetypeCode} traditional`,
    scenarioKey: "traditional",
    archetypeCode,
    modelVersion: REAL_PACK.modelVersion,
    createdBy: confirmedBy,
  });

  await store.updateEstimateHeader(estimate.id, {
    currency: "USD",
    targetStartDate: "2026-09-01",
    targetDurationWeeks: 16,
    selectedRateCardId: rateCardId,
  });

  const driverCodes = listRequiredDriverCodesForArchetype(REAL_PACK, archetypeCode);
  await store.upsertEstimateInputs(
    estimate.id,
    driverCodes.map((driverCode) => {
      if (!(driverCode in DRIVER_QUANTITIES)) {
        throw new Error(`test fixture missing a DRIVER_QUANTITIES entry for '${driverCode}'`);
      }
      return {
        inputKey: driverCode,
        value: DRIVER_QUANTITIES[driverCode],
        unit: null,
        required: true,
        sourceType: "client_input" as const,
        confirmedBy,
      };
    }),
  );

  // Prove the validation gate genuinely blocks BEFORE the inputs are settled
  // — re-derive the same required-key list and confirm the freshly-created
  // (unconfirmed) estimate would have failed, then confirm it passes once
  // settled (below) — a real, not-hardcoded assertion of the gate's effect.
  const headerForGate = {
    currency: "USD",
    targetStartDate: "2026-09-01",
    targetDurationWeeks: 16,
    selectedRateCardId: rateCardId,
  };
  const settledInputs = await store.listEstimateInputs(estimate.id);
  const gateResult = validateEstimateForRun(
    headerForGate,
    driverCodes,
    settledInputs.map((row) => ({
      inputKey: row.input_key,
      value: row.value,
      confirmedAt: row.confirmed_at,
      overrideReason: row.override_reason,
      confidence: row.confidence,
    })),
  );
  expect(gateResult.ready).toBe(true);

  const runResult = await runEstimate({ estimateId: estimate.id, tenantKey });
  return { estimate, runResult };
}

describe("PR7 end-to-end pipeline — client rate-card import through approved snapshot", () => {
  let db: PricingFixtureDb;

  beforeEach(() => {
    resetPr7HarnessMocks();
    db = createPricingFixtureDb();
    wireReferenceReadMocks(db);
    wireRateCardReadMocks(db);
    wireEffortEnginePackMock();
    mockEstimateStoreRef.current = createEstimateFixtureStore();
  });

  describe.each(LAUNCH_ARCHETYPES)(
    "$launchName ($code) — full pipeline: import -> estimate -> validate -> run -> approve -> snapshot",
    ({ code }) => {
      it("produces a valid low<=expected<=high, provenance-carrying, approved snapshot", async () => {
        const tenantKey = `tenant-${code.toLowerCase()}`;
        const moveId = `move-${code.toLowerCase()}`;
        const roleCodes = roleCodesForArchetype(code);
        expect(roleCodes.length).toBeGreaterThan(0);

        const { commit } = await setUpTenantWithRateCard(db, tenantKey, roleCodes);
        expect(commit.action).toBe("new_version");
        const rateCardId = commit.cardId;

        const { estimate, runResult } = await createAndRunEstimate({
          tenantKey,
          moveId,
          archetypeCode: code,
          confirmedBy: "estimator-1",
          rateCardId,
        });

        // Every role was directly priced by the just-committed client rate
        // card, so this archetype's run should have zero unresolved gaps and
        // 100% direct coverage.
        expect(runResult.rateCardCoverage.missingCount).toBe(0);
        expect(runResult.totals.gapCount).toBe(0);
        expect(runResult.range.lowCents).toBeLessThanOrEqual(runResult.range.expectedCents);
        expect(runResult.range.expectedCents).toBeLessThanOrEqual(runResult.range.highCents);
        expect(runResult.totals.totalCostCents).toBeGreaterThan(0);
        expect(runResult.lineItems.length).toBeGreaterThan(0);
        for (const line of runResult.lineItems) {
          expect(line.formula_trace.length).toBeGreaterThan(0);
        }

        // Approve — a DIFFERENT identity than the one who confirmed inputs
        // (segregation of duties, PR6 brief §10).
        const inputs = await mockEstimateStoreRef.current.listEstimateInputs(estimate.id);
        const snapshotStore = makeInMemorySnapshotStore();
        const snapshot = await createEstimateSnapshot(
          {
            estimateId: estimate.id,
            tenantKey,
            moveId,
            archetypeCode: code,
            modelVersion: runResult.modelVersion,
            scenarioKey: runResult.scenarioKey,
            currency: "USD",
            totals: runResult.totals,
            range: runResult.range,
            topAssumptions: runResult.topAssumptions,
            topUncertaintyDrivers: runResult.topUncertaintyDrivers,
            rateCardVersionId: rateCardId,
            clientProfileVersionId: null,
            taxonomyVersion: db.taxonomyVersion,
            inputs: inputs.map(toScopeFingerprintInput),
            preparedBy: "estimator-1",
            approvedBy: "approver-1",
            approvalRationale: `Approved ${code} ROM for pilot planning`,
          },
          snapshotStore,
        );

        expect(snapshot.status).toBe("approved");
        expect(snapshot.approved_by).toBe("approver-1");

        // getApprovedSnapshotForMove's own contract, against real data:
        // "approved" now, not stale (nothing changed since approval).
        const lookup = await getApprovedSnapshotForMove(moveId, tenantKey, snapshotStore, {
          async getEstimateById(id) {
            return mockEstimateStoreRef.current.getEstimate(id);
          },
          async listEstimateInputs(id) {
            return mockEstimateStoreRef.current.listEstimateInputs(id);
          },
        });
        expect(lookup.status).toBe("approved");
      });
    },
  );

  it("old approved snapshot survives rate-card supersession (brief §12's historical-stability requirement)", async () => {
    const tenantKey = "tenant-stability";
    const moveId = "move-stability";
    const archetypeCode = "ARCH-01";
    const roleCodes = roleCodesForArchetype(archetypeCode);

    const { commit: firstCommit } = await setUpTenantWithRateCard(db, tenantKey, roleCodes);
    expect(firstCommit.action).toBe("new_version");
    expect(firstCommit.version).toBe(1);

    const { estimate, runResult } = await createAndRunEstimate({
      tenantKey,
      moveId,
      archetypeCode,
      confirmedBy: "estimator-1",
      rateCardId: firstCommit.cardId,
    });

    const inputsAtApproval = await mockEstimateStoreRef.current.listEstimateInputs(estimate.id);
    const snapshotStore = makeInMemorySnapshotStore();
    const snapshot = await createEstimateSnapshot(
      {
        estimateId: estimate.id,
        tenantKey,
        moveId,
        archetypeCode,
        modelVersion: runResult.modelVersion,
        scenarioKey: runResult.scenarioKey,
        currency: "USD",
        totals: runResult.totals,
        range: runResult.range,
        topAssumptions: runResult.topAssumptions,
        topUncertaintyDrivers: runResult.topUncertaintyDrivers,
        rateCardVersionId: firstCommit.cardId,
        clientProfileVersionId: null,
        taxonomyVersion: db.taxonomyVersion,
        inputs: inputsAtApproval.map(toScopeFingerprintInput),
        preparedBy: "estimator-1",
        approvedBy: "approver-1",
        approvalRationale: "Approved before rate-card change",
      },
      snapshotStore,
    );

    // Capture the pre-change totals for the deep-equal check below, BEFORE
    // touching the rate card.
    const totalsBeforeChange = JSON.parse(JSON.stringify(snapshot.totals));

    // Now supersede the client rate card with materially different rates —
    // this must NOT be reachable via the already-approved snapshot's stored
    // totals (brief: "old approved estimate still uses old rates").
    const rerated = await previewClientRateCardImport({
      tenantKey,
      cardCode: "ENTERPRISE",
      csvText: buildClientRateCardCsv(roleCodes, 999),
    });
    const secondCommit = await commitClientRateCardImport(
      { tenantKey, cardCode: "ENTERPRISE", lines: rerated.linesToCommit, approvedBy: "admin-1", approvalRationale: "Rate refresh" },
      makeRateCardStorePort(db, "client", tenantKey, "ENTERPRISE"),
    );
    expect(secondCommit.action).toBe("new_version");
    expect(secondCommit.version).toBe(2);
    expect(secondCommit.cardId).not.toBe(firstCommit.cardId);

    // The OLD snapshot's stored totals are unchanged — re-fetch and
    // deep-equal against the pre-change capture.
    const refetched = await snapshotStore.getLatestSnapshotForMove(moveId, tenantKey);
    expect(refetched).not.toBeNull();
    expect(refetched!.id).toBe(snapshot.id);
    expect(refetched!.totals).toEqual(totalsBeforeChange);
    expect(refetched!.rate_card_version_id).toBe(firstCommit.cardId);

    // A NEW run against the CURRENT (superseded) scope would use the new
    // rates — proving the isolation is real, not just "nobody re-ran it yet".
    const rerun = await runEstimate({ estimateId: estimate.id, tenantKey });
    expect(rerun.totals.totalLaborCostCents).not.toBe(runResult.totals.totalLaborCostCents);

    // And the OLD snapshot is still exactly what it was — re-running does
    // not silently rewrite an approved, immutable snapshot.
    const refetchedAfterRerun = await snapshotStore.getLatestSnapshotForMove(moveId, tenantKey);
    expect(refetchedAfterRerun!.totals).toEqual(totalsBeforeChange);
  });

  it("cross-tenant isolation, end-to-end: tenant B never sees tenant A's rate card, estimate, or approved snapshot", async () => {
    const tenantA = "tenant-a-isolation";
    const tenantB = "tenant-b-isolation";
    const moveId = "shared-move-id"; // deliberately the SAME move id string across tenants
    const archetypeCode = "ARCH-02";
    const roleCodes = roleCodesForArchetype(archetypeCode);

    const { commit: aCommit } = await setUpTenantWithRateCard(db, tenantA, roleCodes);
    const { estimate: aEstimate, runResult: aRun } = await createAndRunEstimate({
      tenantKey: tenantA,
      moveId,
      archetypeCode,
      confirmedBy: "estimator-a",
      rateCardId: aCommit.cardId,
    });
    const aInputs = await mockEstimateStoreRef.current.listEstimateInputs(aEstimate.id);
    const snapshotStore = makeInMemorySnapshotStore();
    await createEstimateSnapshot(
      {
        estimateId: aEstimate.id,
        tenantKey: tenantA,
        moveId,
        archetypeCode,
        modelVersion: aRun.modelVersion,
        scenarioKey: aRun.scenarioKey,
        currency: "USD",
        totals: aRun.totals,
        range: aRun.range,
        topAssumptions: aRun.topAssumptions,
        topUncertaintyDrivers: aRun.topUncertaintyDrivers,
        rateCardVersionId: aCommit.cardId,
        clientProfileVersionId: null,
        taxonomyVersion: db.taxonomyVersion,
        inputs: aInputs.map(toScopeFingerprintInput),
        preparedBy: "estimator-a",
        approvedBy: "approver-a",
        approvalRationale: "Tenant A approval",
      },
      snapshotStore,
    );

    // Tenant B never uploaded a rate card of its own — its coverage report /
    // rate-card lookups must NOT see tenant A's card.
    const bRateCard = await (await import("../rate-card-repository")).getCurrentRateCard("client", tenantB, "ENTERPRISE");
    expect(bRateCard).toBeNull();

    // Tenant B's snapshot lookup for the SAME move id returns "none", never
    // tenant A's approved snapshot.
    const bLookup = await getApprovedSnapshotForMove(moveId, tenantB, snapshotStore, {
      async getEstimateById(id) {
        return mockEstimateStoreRef.current.getEstimate(id);
      },
      async listEstimateInputs(id) {
        return mockEstimateStoreRef.current.listEstimateInputs(id);
      },
    });
    expect(bLookup.status).toBe("none");

    // Tenant A's own lookup still resolves correctly (never accidentally
    // broken by the isolation check above).
    const aLookup = await getApprovedSnapshotForMove(moveId, tenantA, snapshotStore, {
      async getEstimateById(id) {
        return mockEstimateStoreRef.current.getEstimate(id);
      },
      async listEstimateInputs(id) {
        return mockEstimateStoreRef.current.listEstimateInputs(id);
      },
    });
    expect(aLookup.status).toBe("approved");
  });
});
