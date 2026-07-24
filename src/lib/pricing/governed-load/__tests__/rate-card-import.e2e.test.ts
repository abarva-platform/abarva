/**
 * PR3 governed-load — mandatory end-to-end scenario (per the execution
 * prompt): parse a client CSV with 5 rows (mix of valid, one invalid role
 * ref, one duplicate) -> see correct per-row errors -> fix and re-parse ->
 * preview shows 5 added -> approve -> re-upload identical content -> no-op
 * (no new version) -> change one rate -> re-upload -> preview shows 1
 * changed, approve -> new version, old version superseded, `is_current`
 * flips correctly.
 *
 * `getCurrentRateCard` / `listRateCardLines` (the PR2 read path) are mocked
 * against a tiny in-memory fixture "database" that the fake `RateCardStorePort`
 * (the PR2 write seam, unmocked/real `createRateCardVersion` logic) also
 * writes into — so the test proves THIS pipeline (parse -> validate -> diff
 * -> commit) drives PR2's real idempotency/versioning logic correctly
 * end-to-end, without touching a live database.
 */
import { describe, expect, it, beforeEach } from "@jest/globals";
import type { RateCardStorePort } from "../../rate-card-repository";
import type { PricingRateCardLineRow } from "../../types";

const mockGetCurrentRateCard = jest.fn();
const mockListRateCardLines = jest.fn();
const mockLoadRateCardReferenceSnapshot = jest.fn();

jest.mock("../../rate-card-repository", () => {
  const actual = jest.requireActual("../../rate-card-repository");
  return {
    ...actual,
    getCurrentRateCard: (...args: unknown[]) => mockGetCurrentRateCard(...args),
    listRateCardLines: (...args: unknown[]) => mockListRateCardLines(...args),
  };
});
jest.mock("../reference-lookup", () => ({
  loadRateCardReferenceSnapshot: (...args: unknown[]) => mockLoadRateCardReferenceSnapshot(...args),
}));

// Imported AFTER the mocks.
import { commitClientRateCardImport, previewClientRateCardImport } from "../rate-card-import";

const TENANT_KEY = "apex-retail";
const CARD_CODE = "ENTERPRISE";
const REFS = {
  taxonomyVersion: 1,
  roleCodes: new Set(["ROL-001", "ROL-002", "ROL-003", "ROL-004"]),
  rateBandCodes: new Set<string>(),
  levelCodes: new Set(["LVL-01", "LVL-02", "LVL-03", "LVL-04"]),
};

interface FixtureDb {
  currentCard: { id: string; version: number; contentHash: string } | null;
  lines: PricingRateCardLineRow[];
  history: { id: string; version: number; isCurrent: boolean }[];
  insertCalls: number;
}

function makeFixtureDb(): FixtureDb {
  return { currentCard: null, lines: [], history: [], insertCalls: 0 };
}

function wireFakeStoreAndReads(db: FixtureDb): RateCardStorePort {
  mockGetCurrentRateCard.mockImplementation(async () =>
    db.currentCard
      ? {
          id: db.currentCard.id,
          scope_type: "client",
          tenant_key: TENANT_KEY,
          move_id: null,
          card_code: CARD_CODE,
          parent_rate_card_id: null,
          version: db.currentCard.version,
          is_current: true,
          content_hash: db.currentCard.contentHash,
          status: "approved",
          approved_by: null,
          approved_at: null,
          approval_rationale: null,
          effective_from: null,
          effective_to: null,
          created_at: "2026-08-01T00:00:00.000Z",
        }
      : null,
  );
  mockListRateCardLines.mockImplementation(async (cardVersionId: string) =>
    db.lines.filter((l) => l.card_version_id === cardVersionId),
  );

  return {
    async getCurrent() {
      return db.currentCard;
    },
    async insertNewVersion(input) {
      db.insertCalls += 1;
      if (input.previousCardId) {
        const prev = db.history.find((h) => h.id === input.previousCardId);
        if (prev) prev.isCurrent = false;
      }
      db.history.push({ id: input.id, version: input.version, isCurrent: true });
      db.currentCard = { id: input.id, version: input.version, contentHash: input.contentHash };
      db.lines = input.lines.map((line, i) => ({
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
        tenant_key: TENANT_KEY,
        content_hash: line.contentHash,
        created_at: "2026-08-01T00:00:00.000Z",
      }));
    },
  };
}

const HEADER =
  "role_or_band_ref,level,provider_ref,location_ref,rate_basis,unit,rate_value,currency,valid_from,valid_to";

describe("governed-load rate-card import — full end-to-end scenario", () => {
  beforeEach(() => {
    mockGetCurrentRateCard.mockReset();
    mockListRateCardLines.mockReset();
    mockLoadRateCardReferenceSnapshot.mockReset();
    mockLoadRateCardReferenceSnapshot.mockResolvedValue(REFS);
  });

  it("runs the complete parse -> error -> fix -> preview -> approve -> no-op -> change -> new-version-and-supersede flow", async () => {
    const db = makeFixtureDb();
    const store = wireFakeStoreAndReads(db);

    // ---- Step 1: 5 rows — 3 valid, 1 invalid role ref, 1 duplicate of row 1
    const badCsv = [
      HEADER,
      "ROL-001,LVL-01,,,client_negotiated,hour,400,USD,2026-08-01,",
      "ROL-002,LVL-02,,,client_negotiated,hour,500,USD,2026-08-01,",
      "ROL-003,LVL-03,,,client_negotiated,hour,600,USD,2026-08-01,",
      "ROL-999,LVL-01,,,client_negotiated,hour,400,USD,2026-08-01,", // invalid role ref
      "ROL-001,LVL-01,,,client_negotiated,hour,400,USD,2026-08-01,", // duplicate of row 1
    ].join("\n");

    const badPreview = await previewClientRateCardImport({
      tenantKey: TENANT_KEY,
      cardCode: CARD_CODE,
      csvText: badCsv,
    });

    expect(badPreview.validRowCount).toBe(3);
    expect(badPreview.validationErrors).toHaveLength(2);
    expect(badPreview.validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ rowNumber: 4, code: "unresolved_role_or_band_ref" }),
        expect.objectContaining({ rowNumber: 5, code: "duplicate_row" }),
      ]),
    );
    expect(db.insertCalls).toBe(0); // preview never writes

    // ---- Step 2: fix and re-parse — 5 valid, unique rows
    const fixedCsv = [
      HEADER,
      "ROL-001,LVL-01,,,client_negotiated,hour,400,USD,2026-08-01,",
      "ROL-002,LVL-02,,,client_negotiated,hour,500,USD,2026-08-01,",
      "ROL-003,LVL-03,,,client_negotiated,hour,600,USD,2026-08-01,",
      "ROL-004,LVL-01,,,client_negotiated,hour,700,USD,2026-08-01,",
      "ROL-001,LVL-02,,,client_negotiated,hour,410,USD,2026-08-01,", // distinct: different level than row 1
    ].join("\n");

    const fixedPreview = await previewClientRateCardImport({
      tenantKey: TENANT_KEY,
      cardCode: CARD_CODE,
      csvText: fixedCsv,
    });
    expect(fixedPreview.parseErrors).toEqual([]);
    expect(fixedPreview.validationErrors).toEqual([]);
    expect(fixedPreview.validRowCount).toBe(5);
    expect(fixedPreview.currentVersion).toBeNull();
    expect(fixedPreview.diff.added).toHaveLength(5);
    expect(fixedPreview.diff.changed).toEqual([]);
    expect(fixedPreview.diff.unchanged).toEqual([]);

    // ---- Step 3: approve
    const firstCommit = await commitClientRateCardImport(
      {
        tenantKey: TENANT_KEY,
        cardCode: CARD_CODE,
        lines: fixedPreview.linesToCommit,
        approvedBy: "user-approver-1",
        approvalRationale: "Client MSA rates confirmed",
      },
      store,
    );
    expect(firstCommit).toMatchObject({ action: "new_version", version: 1, previousVersion: null });
    expect(db.insertCalls).toBe(1);
    expect(db.history).toEqual([{ id: firstCommit.cardId, version: 1, isCurrent: true }]);

    // ---- Step 4: re-upload identical content -> preview shows all unchanged, commit is a no-op
    const identicalPreview = await previewClientRateCardImport({
      tenantKey: TENANT_KEY,
      cardCode: CARD_CODE,
      csvText: fixedCsv,
    });
    expect(identicalPreview.currentVersion).toBe(1);
    expect(identicalPreview.diff.unchanged).toHaveLength(5);
    expect(identicalPreview.diff.added).toEqual([]);
    expect(identicalPreview.diff.changed).toEqual([]);

    const noopCommit = await commitClientRateCardImport(
      {
        tenantKey: TENANT_KEY,
        cardCode: CARD_CODE,
        lines: identicalPreview.linesToCommit,
        approvedBy: "user-approver-1",
      },
      store,
    );
    expect(noopCommit).toMatchObject({ action: "noop", version: 1 });
    expect(db.insertCalls).toBe(1); // no duplicate insert
    expect(db.history).toHaveLength(1); // no second "current" row created

    // ---- Step 5: change one rate -> preview shows exactly 1 changed -> approve -> new version 2, version 1 superseded
    const changedCsv = fixedCsv.replace(
      "ROL-001,LVL-01,,,client_negotiated,hour,400,USD,2026-08-01,",
      "ROL-001,LVL-01,,,client_negotiated,hour,475,USD,2026-08-01,",
    );
    const changedPreview = await previewClientRateCardImport({
      tenantKey: TENANT_KEY,
      cardCode: CARD_CODE,
      csvText: changedCsv,
    });
    expect(changedPreview.currentVersion).toBe(1);
    expect(changedPreview.diff.changed).toHaveLength(1);
    expect(changedPreview.diff.changed[0].before.rateValue).toBe(400);
    expect(changedPreview.diff.changed[0].after.rateValue).toBe(475);
    expect(changedPreview.diff.unchanged).toHaveLength(4);
    expect(changedPreview.diff.added).toEqual([]);
    expect(changedPreview.diff.removed).toEqual([]);

    const secondCommit = await commitClientRateCardImport(
      {
        tenantKey: TENANT_KEY,
        cardCode: CARD_CODE,
        lines: changedPreview.linesToCommit,
        approvedBy: "user-approver-2",
      },
      store,
    );
    expect(secondCommit).toMatchObject({ action: "new_version", version: 2, previousVersion: 1 });
    expect(db.insertCalls).toBe(2);

    // is_current flips correctly: exactly one current row, and it's version 2.
    const currentRows = db.history.filter((h) => h.isCurrent);
    expect(currentRows).toHaveLength(1);
    expect(currentRows[0].version).toBe(2);
    const versionOneRow = db.history.find((h) => h.version === 1)!;
    expect(versionOneRow.isCurrent).toBe(false);
  });
});
