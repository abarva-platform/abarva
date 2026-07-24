/**
 * Nexus Pricing Engine — PR7 shared end-to-end test harness.
 *
 * Prior PRs (PR2-PR6) each proved their OWN module in isolation against an
 * injected in-memory fake (see e.g. `governed-load/__tests__/rate-card-import.e2e.test.ts`,
 * which fakes `../../rate-card-repository`'s `getCurrentRateCard`/
 * `listRateCardLines` reads behind a real `RateCardStorePort` write seam).
 * PR7's job is to prove the FULL pipeline works across those module
 * boundaries in one run — a real CSV import feeding PR4's real engine,
 * producing a PR6 snapshot — without duplicating any single module's
 * already-proven unit tests.
 *
 * This harness is the shared "fake database" every PR7 end-to-end test
 * builds on. It is NOT a test file itself (kept out of any `__tests__`
 * directory on purpose — Jest's default `testMatch` treats every file
 * under a `__tests__` ancestor directory as its own test suite, exactly the
 * reason `effort-engine/__fixtures__/test-fixtures.ts` already uses this same
 * sibling-`__fixtures__` convention).
 *
 * Design: rather than faking raw SQL text (fragile — every repository
 * hand-writes its own INSERT/UPDATE column lists), this harness fakes at the
 * SAME boundary the codebase's own authors already designed for
 * testability:
 *
 *   - `reference-repository.ts` / `rate-card-repository.ts` reads are backed
 *     by jest.fn() mocks (consuming test files wire these into
 *     `jest.mock(...)` calls — Jest hoisting requires the `jest.mock(path,
 *     factory)` call itself to live in the consuming test file, but the
 *     factory body may safely reference these IMPORTED `mock`-prefixed
 *     jest.fn() refs, since factories run lazily after imports resolve).
 *   - `rate-card-repository.ts#createRateCardVersion` / effort-engine's
 *     `snapshot-service.ts#createEstimateSnapshot` are exercised via their
 *     REAL, already-designed injectable store ports (`RateCardStorePort`,
 *     `SnapshotStorePort`) — no mocking needed, these functions already run
 *     for real against an in-memory port.
 *   - `moves-workflow/estimate-repository.ts` is mocked as a WHOLE module
 *     (same technique `moves-workflow/__tests__/execution-service.test.ts`
 *     already uses) backed by a real, stateful in-memory table here — every
 *     OTHER function `execution-service.ts#runEstimate` calls
 *     (`readEffortEnginePack`, `resolveActivityPacksForArchetype`,
 *     `runEffortEngine`, `computeRange`, `buildRateCardCoverageReport`,
 *     `resolveRoleRatesForTenant`) runs FOR REAL, unmocked.
 *
 * The result: `previewClientRateCardImport` / `commitClientRateCardImport`
 * (PR3, real) -> `createDraftEstimate` / `upsertEstimateInputs` (PR5, faked
 * table) -> `validateEstimateForRun` (PR5, real, pure) -> `runEstimate` (PR5,
 * real — which itself calls PR4's real `runEffortEngine` and PR3's real
 * `buildRateCardCoverageReport`) -> `createEstimateSnapshot` (PR6, real) all
 * run as their REAL, unmocked implementations, sharing ONE in-memory
 * "database" — a genuine cross-module-boundary proof, not another
 * single-module unit test.
 */
import { randomUUID } from "node:crypto";
import {
  loadRealEffortEnginePack,
  loadRealRoleRateSnapshot,
} from "../effort-engine/__fixtures__/test-fixtures";
import type { RateCardStorePort } from "../rate-card-repository";
import type { SnapshotStorePort } from "../effort-engine/snapshot-service";
import type {
  PricingEstimateInputRow,
  PricingEstimateLineItemRow,
  PricingEstimateRow,
  PricingEstimateSnapshotRow,
  PricingRateBandRow,
  PricingRateCardLineRow,
  PricingRateCardRow,
  PricingRateCardScopeType,
  PricingRoleRow,
} from "../types";
import type { UpdateEstimateHeaderInput, UpsertEstimateInputRecord } from "../moves-workflow/types";

// ---------------------------------------------------------------------------
// jest.fn() mock refs — imported (not created) by consuming test files' own
// `jest.mock(...)` factories. Every name is `mock`-prefixed so Jest's
// out-of-scope-variable check for hoisted `jest.mock` factories allows it.
// ---------------------------------------------------------------------------

export const mockGetCurrentRateCard = jest.fn();
export const mockListRateCardLines = jest.fn();
export const mockGetCurrentTaxonomyVersion = jest.fn();
export const mockListRoles = jest.fn();
export const mockListRateBands = jest.fn();
export const mockGetRoleByCode = jest.fn();
export const mockListSeniorityLevels = jest.fn();
export const mockReadEffortEnginePack = jest.fn();

export function resetPr7HarnessMocks(): void {
  mockGetCurrentRateCard.mockReset();
  mockListRateCardLines.mockReset();
  mockGetCurrentTaxonomyVersion.mockReset();
  mockListRoles.mockReset();
  mockListRateBands.mockReset();
  mockGetRoleByCode.mockReset();
  mockListSeniorityLevels.mockReset();
  mockReadEffortEnginePack.mockReset();
}

// ---------------------------------------------------------------------------
// Reference/taxonomy fixture data (real PR1 CSVs) + rate-card in-memory table
// ---------------------------------------------------------------------------

export const PR7_TAXONOMY_VERSION = 1;

function buildFullRoleRows(): PricingRoleRow[] {
  const snapshot = loadRealRoleRateSnapshot();
  return snapshot.roles.map((r) => ({
    id: `role-${r.role_code}`,
    taxonomy_version: PR7_TAXONOMY_VERSION,
    role_code: r.role_code,
    canonical_name: r.role_code,
    tower_code: "TWR-01",
    capability_code: "CAP-001",
    role_family_code: "RF-0001",
    role_type: "delivery",
    allowed_level_min: "Manager",
    allowed_level_max: "Director",
    default_rate_band_code: r.default_rate_band_code,
    internal_external_default: "internal",
    billable_default: true,
    source_artifact: null,
    source_row: null,
    source_label: null,
    status: "active",
    tenant_key: null,
    content_hash: "hash",
    created_at: "2026-01-01T00:00:00.000Z",
  }));
}

function buildFullRateBandRows(): PricingRateBandRow[] {
  const snapshot = loadRealRoleRateSnapshot();
  return snapshot.rateBands.map((b) => ({
    id: `band-${b.rate_band_code}`,
    taxonomy_version: PR7_TAXONOMY_VERSION,
    rate_band_code: b.rate_band_code,
    role_code: b.role_code,
    level_code: b.level_code,
    currency: b.currency,
    rate_basis: "hourly",
    rate_unit: "hour",
    loaded_rate: b.indicative_bill_rate,
    scarcity_adj_rate: b.indicative_bill_rate,
    indicative_bill_rate: b.indicative_bill_rate,
    valid_from: "2026-01-01",
    source: "pr1-seed",
    confidence: "medium",
    approval_status: "global_starter_unapproved",
    status: "active",
    tenant_key: null,
    content_hash: "hash",
    created_at: "2026-01-01T00:00:00.000Z",
  }));
}

export interface RateCardScopeState {
  current: PricingRateCardRow | null;
  lines: PricingRateCardLineRow[];
  /** Every version ever inserted, in insertion order — the audit trail this harness's tests assert against. */
  history: PricingRateCardRow[];
  insertCount: number;
}

export interface PricingFixtureDb {
  taxonomyVersion: number;
  roles: PricingRoleRow[];
  rateBands: PricingRateBandRow[];
  /** Keyed by `${scopeType}::${tenantKey ?? "__global__"}::${cardCode}`. */
  rateCardScopes: Map<string, RateCardScopeState>;
  /** card_version_id -> that (possibly now-superseded) version's lines, so a historical version's lines remain queryable exactly like the real (never-deleted) `pricing_rate_card_lines` table. */
  historicalLines: Map<string, PricingRateCardLineRow[]>;
}

function rateCardScopeKey(scopeType: PricingRateCardScopeType, tenantKey: string | null, cardCode: string): string {
  return `${scopeType}::${tenantKey ?? "__global__"}::${cardCode}`;
}

export function createPricingFixtureDb(): PricingFixtureDb {
  return {
    taxonomyVersion: PR7_TAXONOMY_VERSION,
    roles: buildFullRoleRows(),
    rateBands: buildFullRateBandRows(),
    rateCardScopes: new Map(),
    historicalLines: new Map(),
  };
}

function scopeState(db: PricingFixtureDb, scopeType: PricingRateCardScopeType, tenantKey: string | null, cardCode: string): RateCardScopeState {
  const key = rateCardScopeKey(scopeType, tenantKey, cardCode);
  let state = db.rateCardScopes.get(key);
  if (!state) {
    state = { current: null, lines: [], history: [], insertCount: 0 };
    db.rateCardScopes.set(key, state);
  }
  return state;
}

/**
 * Wires `mockGetCurrentRateCard` / `mockListRateCardLines` (the direct-read
 * boundary `coverage-report.ts` / `rate-card-resolver.ts` /
 * `governed-load/rate-card-import.ts`'s preview step all call) against `db`.
 * Call once per test from `beforeEach`, AFTER the consuming file's own
 * `jest.mock("../rate-card-repository", ...)` (or the relative-path
 * equivalent) has wired `getCurrentRateCard`/`listRateCardLines` through to
 * these same mock refs.
 */
export function wireRateCardReadMocks(db: PricingFixtureDb): void {
  mockGetCurrentRateCard.mockImplementation(
    async (scopeType: PricingRateCardScopeType, tenantKey: string | null, cardCode: string) =>
      scopeState(db, scopeType, tenantKey, cardCode).current,
  );
  mockListRateCardLines.mockImplementation(async (cardVersionId: string) => {
    // Every real caller (coverage-report.ts, rate-card-resolver.ts,
    // rate-card-import.ts's preview step) first fetches the CURRENT card via
    // getCurrentRateCard, then looks up ITS lines by id — so matching
    // against each scope's current-card id (plus the historical-lines side
    // table for superseded versions, populated by makeRateCardStorePort) is
    // sufficient.
    for (const state of db.rateCardScopes.values()) {
      if (state.current?.id === cardVersionId) return state.lines;
    }
    return db.historicalLines.get(cardVersionId) ?? [];
  });
}

export function wireReferenceReadMocks(db: PricingFixtureDb): void {
  mockGetCurrentTaxonomyVersion.mockImplementation(async () => ({
    id: "taxonomy-1",
    version: db.taxonomyVersion,
    generated_from: "pr1-seed",
    source_sha256: "hash",
    content_hash: "hash",
    status: "active" as const,
    is_current: true,
    tenant_key: null,
    created_at: "2026-01-01T00:00:00.000Z",
  }));
  mockListRoles.mockImplementation(async () => db.roles);
  mockListRateBands.mockImplementation(async () => db.rateBands);
  mockGetRoleByCode.mockImplementation(async (_taxonomyVersion: number, roleCode: string) =>
    db.roles.find((r) => r.role_code === roleCode) ?? null,
  );
  // `pricing_seniority_levels` isn't consulted by anything this harness's
  // callers need beyond satisfying `loadRateCardReferenceSnapshot`'s read —
  // a small, real-shaped stub set is sufficient (no test asserts on level
  // resolution against this harness).
  mockListSeniorityLevels.mockImplementation(async () => [
    { level_code: "Manager", level_name: "Manager", rank: 3 },
    { level_code: "Director", level_name: "Director", rank: 2 },
  ]);
}

export function wireEffortEnginePackMock(): void {
  const pack = loadRealEffortEnginePack();
  mockReadEffortEnginePack.mockResolvedValue(pack);
}

/**
 * A real `RateCardStorePort` (PR2's own injectable write seam) backed by
 * `db` — `createRateCardVersion` / `commitClientRateCardImport` run their
 * REAL idempotency logic against this, exactly as PR2/PR3 designed.
 */
export function makeRateCardStorePort(
  db: PricingFixtureDb,
  scopeType: PricingRateCardScopeType,
  tenantKey: string | null,
  cardCode: string,
): RateCardStorePort {
  return {
    async getCurrent() {
      const state = scopeState(db, scopeType, tenantKey, cardCode);
      return state.current ? { id: state.current.id, version: state.current.version, contentHash: state.current.content_hash } : null;
    },
    async insertNewVersion(input) {
      const state = scopeState(db, scopeType, tenantKey, cardCode);
      state.insertCount += 1;
      if (input.previousCardId) {
        const prev = state.history.find((h) => h.id === input.previousCardId);
        if (prev) prev.is_current = false;
        // Preserve the superseded version's own lines for historical lookups
        // (matches the real table: rows are never deleted, only `is_current`
        // flips) — this is what `wireRateCardReadMocks`'s `listRateCardLines`
        // fallback reads for an id that is no longer any scope's `current`.
        db.historicalLines.set(input.previousCardId, state.lines);
      }
      const row: PricingRateCardRow = {
        id: input.id,
        scope_type: input.scopeType,
        tenant_key: input.tenantKey,
        move_id: input.moveId,
        card_code: input.cardCode,
        parent_rate_card_id: input.parentRateCardId,
        version: input.version,
        is_current: true,
        content_hash: input.contentHash,
        status: input.status,
        approved_by: input.approvedBy,
        approved_at: input.approvedAt,
        approval_rationale: input.approvalRationale,
        effective_from: null,
        effective_to: null,
        created_at: new Date().toISOString(),
      };
      state.history.push(row);
      state.current = row;
      state.lines = input.lines.map(
        (line, i): PricingRateCardLineRow => ({
          id: `line-${input.id}-${i}`,
          card_version_id: input.id,
          role_or_band_ref: line.roleOrBandRef,
          level: line.level ?? null,
          provider_ref: line.providerRef ?? null,
          location_ref: line.locationRef ?? null,
          rate_basis: line.rateBasis,
          unit: line.unit,
          rate_value: line.rateValue,
          currency: line.currency ?? "USD",
          valid_from: line.validFrom,
          valid_to: line.validTo ?? null,
          tenant_key: tenantKey,
          content_hash: line.contentHash,
          created_at: new Date().toISOString(),
        }),
      );
    },
  };
}

export function currentRateCardLines(db: PricingFixtureDb, scopeType: PricingRateCardScopeType, tenantKey: string | null, cardCode: string): PricingRateCardLineRow[] {
  return scopeState(db, scopeType, tenantKey, cardCode).lines;
}

export function rateCardHistory(db: PricingFixtureDb, scopeType: PricingRateCardScopeType, tenantKey: string | null, cardCode: string): PricingRateCardRow[] {
  return scopeState(db, scopeType, tenantKey, cardCode).history;
}

/** Convenience: a valid, deterministic client-rate-card CSV pricing every role code in `roleCodes` at a fixed rate, so a full pipeline test can achieve 100% direct coverage for the roles it actually needs. */
export function buildClientRateCardCsv(roleCodes: readonly string[], baseRate = 200): string {
  const header = "role_or_band_ref,level,provider_ref,location_ref,rate_basis,unit,rate_value,currency,valid_from,valid_to";
  const rows = roleCodes.map(
    (code, i) => `${code},,,,client_negotiated,hour,${baseRate + i},USD,2026-01-01,`,
  );
  return [header, ...rows].join("\n");
}

// ---------------------------------------------------------------------------
// Estimate-workflow in-memory table (moves-workflow/estimate-repository.ts,
// mocked as a whole module by consuming test files, backed by this store).
// ---------------------------------------------------------------------------

export interface CreateDraftEstimateFixtureInput {
  tenantKey: string;
  moveId: string;
  scenarioName: string;
  scenarioKey?: string;
  archetypeCode: string;
  modelVersion: number;
  currency?: string;
  targetStartDate?: string | null;
  targetDurationWeeks?: number | null;
  selectedRateCardId?: string | null;
  scenarioGroupId?: string | null;
  createdBy?: string | null;
}

/** A real, STATEFUL fake for every `moves-workflow/estimate-repository.ts` export `execution-service.ts#runEstimate` (and the wizard's own service functions) call — mirrors the real replace-on-rerun / upsert-by-key / header-patch semantics exactly, just in memory. */
export function createEstimateFixtureStore() {
  const estimates = new Map<string, PricingEstimateRow>();
  const inputs = new Map<string, Map<string, PricingEstimateInputRow>>();
  const lineItems = new Map<string, PricingEstimateLineItemRow[]>();

  async function createDraftEstimate(input: CreateDraftEstimateFixtureInput): Promise<PricingEstimateRow> {
    const now = new Date().toISOString();
    const row: PricingEstimateRow = {
      id: randomUUID(),
      tenant_key: input.tenantKey,
      move_id: input.moveId,
      scenario_group_id: input.scenarioGroupId ?? randomUUID(),
      scenario_name: input.scenarioName,
      scenario_key: input.scenarioKey ?? "traditional",
      archetype_code: input.archetypeCode,
      model_version: input.modelVersion,
      currency: input.currency ?? "USD",
      target_start_date: input.targetStartDate ?? null,
      target_duration_weeks: input.targetDurationWeeks ?? null,
      selected_rate_card_id: input.selectedRateCardId ?? null,
      status: "draft",
      last_run_id: null,
      last_run_at: null,
      created_by: input.createdBy ?? null,
      created_at: now,
      updated_at: now,
    };
    estimates.set(row.id, row);
    inputs.set(row.id, new Map());
    lineItems.set(row.id, []);
    return row;
  }

  async function getEstimate(estimateId: string): Promise<PricingEstimateRow | null> {
    return estimates.get(estimateId) ?? null;
  }

  async function updateEstimateHeader(estimateId: string, patch: UpdateEstimateHeaderInput): Promise<void> {
    const existing = estimates.get(estimateId);
    if (!existing) return;
    // Mirrors the REAL `estimate-repository.ts#updateEstimateHeader`'s
    // `HEADER_FIELD_MAP` camelCase -> snake_case column translation exactly
    // (this fixture stands IN for that whole module, so it must reproduce
    // that mapping itself rather than spreading the camelCase patch directly
    // onto the snake_case row).
    const columnPatch: Partial<PricingEstimateRow> = {};
    if ("scenarioName" in patch) columnPatch.scenario_name = patch.scenarioName;
    if ("scenarioKey" in patch) columnPatch.scenario_key = patch.scenarioKey;
    if ("archetypeCode" in patch) columnPatch.archetype_code = patch.archetypeCode;
    if ("currency" in patch) columnPatch.currency = patch.currency;
    if ("targetStartDate" in patch) columnPatch.target_start_date = patch.targetStartDate ?? null;
    if ("targetDurationWeeks" in patch) columnPatch.target_duration_weeks = patch.targetDurationWeeks ?? null;
    if ("selectedRateCardId" in patch) columnPatch.selected_rate_card_id = patch.selectedRateCardId ?? null;
    if ("status" in patch) columnPatch.status = patch.status;
    estimates.set(estimateId, { ...existing, ...columnPatch, updated_at: new Date().toISOString() });
  }

  async function listEstimateInputs(estimateId: string): Promise<PricingEstimateInputRow[]> {
    return Array.from((inputs.get(estimateId) ?? new Map()).values());
  }

  async function upsertEstimateInputs(
    estimateId: string,
    records: readonly UpsertEstimateInputRecord[],
  ): Promise<PricingEstimateInputRow[]> {
    const byKey = inputs.get(estimateId) ?? new Map<string, PricingEstimateInputRow>();
    const now = new Date().toISOString();
    const written: PricingEstimateInputRow[] = [];
    for (const input of records) {
      const prior = byKey.get(input.inputKey);
      const row: PricingEstimateInputRow = {
        id: prior?.id ?? randomUUID(),
        estimate_id: estimateId,
        input_key: input.inputKey,
        value: input.value,
        unit: input.unit ?? prior?.unit ?? null,
        required: input.required ?? prior?.required ?? false,
        source_type: input.sourceType,
        source_ref: input.sourceRef ?? prior?.source_ref ?? null,
        confidence: input.confidence ?? prior?.confidence ?? null,
        confirmed_by: input.confirmedBy !== undefined ? input.confirmedBy : (prior?.confirmed_by ?? null),
        confirmed_at: input.confirmedBy !== undefined ? (input.confirmedBy ? now : null) : (prior?.confirmed_at ?? null),
        override_reason: input.overrideReason ?? prior?.override_reason ?? null,
        model_version: input.modelVersion ?? prior?.model_version ?? null,
        created_at: prior?.created_at ?? now,
        updated_at: now,
      };
      byKey.set(input.inputKey, row);
      written.push(row);
    }
    inputs.set(estimateId, byKey);
    return written;
  }

  async function listLineItems(estimateId: string): Promise<PricingEstimateLineItemRow[]> {
    return lineItems.get(estimateId) ?? [];
  }

  async function replaceLineItems(
    estimateId: string,
    tenantKey: string,
    rows: readonly Omit<PricingEstimateLineItemRow, "id" | "estimate_id" | "tenant_key" | "run_id" | "created_at">[],
  ): Promise<{ runId: string; ranAt: string }> {
    const runId = randomUUID();
    const ranAt = new Date().toISOString();
    const full = rows.map(
      (row): PricingEstimateLineItemRow => ({
        ...row,
        id: randomUUID(),
        estimate_id: estimateId,
        tenant_key: tenantKey,
        run_id: runId,
        created_at: ranAt,
      }),
    );
    lineItems.set(estimateId, full);
    const existing = estimates.get(estimateId);
    if (existing) {
      estimates.set(estimateId, { ...existing, last_run_id: runId, last_run_at: ranAt, updated_at: ranAt });
    }
    return { runId, ranAt };
  }

  return {
    estimates,
    inputs,
    lineItems,
    createDraftEstimate,
    getEstimate,
    updateEstimateHeader,
    listEstimateInputs,
    upsertEstimateInputs,
    listLineItems,
    replaceLineItems,
  };
}

// ---------------------------------------------------------------------------
// Snapshot store (effort-engine/snapshot-service.ts's REAL injectable port —
// no mocking needed, `createEstimateSnapshot`/`getApprovedSnapshotForMove`
// already accept this as an explicit last argument).
// ---------------------------------------------------------------------------

export function makeInMemorySnapshotStore(): SnapshotStorePort & { rows: PricingEstimateSnapshotRow[] } {
  const rows: PricingEstimateSnapshotRow[] = [];
  return {
    rows,
    async insertSnapshot(row) {
      rows.push(row);
    },
    async getLatestSnapshotForMove(moveId, tenantKey) {
      const matches = rows
        .filter((r) => r.move_id === moveId && r.tenant_key === tenantKey)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
      return matches[0] ?? null;
    },
  };
}

