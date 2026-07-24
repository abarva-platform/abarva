/**
 * Nexus Pricing Engine — PR3 governed-load rate-card import orchestration.
 *
 * Ties together `csv-parse.ts` -> `semantic-validation.ts` ->
 * `rate-card-diff.ts` -> `../rate-card-repository.ts` (PR2) into the two
 * governed-load steps the brief asks for:
 *
 *   1. `previewClientRateCardImport` — parse + validate + diff ONLY. Never
 *      writes to the database. This is what
 *      `POST /api/admin/pricing/rate-cards/import` calls.
 *   2. `commitClientRateCardImport` — takes the (already-validated) lines an
 *      operator approved and calls PR2's `createRateCardVersion`, which owns
 *      the idempotency contract (no-op on unchanged content, new version +
 *      supersede on changed content). This file does not reimplement any of
 *      that decision logic — it only shapes the input.
 *
 * TENANCY: every function here takes an already-canonicalized `tenantKey`
 * (per PRICING_ENGINE_CURRENT_STATE.md §10, canonicalize at the API
 * boundary — see `src/app/api/admin/pricing/rate-cards/*`, not here).
 */
import {
  createRateCardVersion,
  getCurrentRateCard,
  listRateCardLines,
  type NewRateCardLineInput,
} from "../rate-card-repository";
import type { CreateRateCardVersionResult } from "../rate-card-repository";
import { parseClientRateCardCsv } from "./csv-parse";
import { CLIENT_ENTERPRISE_RATE_CARD_CODE } from "./constants";
import { loadRateCardReferenceSnapshot } from "./reference-lookup";
import { computeRateCardDiff } from "./rate-card-diff";
import { validateRateCardRowsAgainstReference } from "./semantic-validation";
import type { ClientRateCardCsvRow, RateCardDiff, RowError } from "./types";

export interface RateCardImportPreview {
  tenantKey: string;
  cardCode: string;
  taxonomyVersion: number;
  /** Null if the tenant has no current rate card yet (first-ever upload). */
  currentVersion: number | null;
  parseErrors: RowError[];
  validationErrors: RowError[];
  /** Rows that passed both schema and semantic validation, in upload order. */
  validRowCount: number;
  diff: RateCardDiff;
  /** Carried through so `commitClientRateCardImport` doesn't have to re-parse. */
  linesToCommit: NewRateCardLineInput[];
}

function toNewRateCardLineInput(row: ClientRateCardCsvRow): NewRateCardLineInput {
  return {
    roleOrBandRef: row.roleOrBandRef,
    level: row.level,
    providerRef: row.providerRef,
    locationRef: row.locationRef,
    rateBasis: row.rateBasis,
    unit: row.unit,
    rateValue: row.rateValue,
    currency: row.currency,
    validFrom: row.validFrom,
    validTo: row.validTo,
  };
}

export interface PreviewClientRateCardImportInput {
  tenantKey: string;
  cardCode?: string;
  csvText: string;
}

export async function previewClientRateCardImport(
  input: PreviewClientRateCardImportInput,
): Promise<RateCardImportPreview> {
  const cardCode = input.cardCode ?? CLIENT_ENTERPRISE_RATE_CARD_CODE;

  const parsed = parseClientRateCardCsv(input.csvText);
  const refs = await loadRateCardReferenceSnapshot();
  const validated = validateRateCardRowsAgainstReference(parsed.rows, refs);

  const currentCard = await getCurrentRateCard("client", input.tenantKey, cardCode);
  const currentLines = currentCard ? await listRateCardLines(currentCard.id) : [];

  const linesToCommit = validated.validRows.map(toNewRateCardLineInput);
  const diff = computeRateCardDiff(currentLines, linesToCommit);

  return {
    tenantKey: input.tenantKey,
    cardCode,
    taxonomyVersion: refs.taxonomyVersion,
    currentVersion: currentCard?.version ?? null,
    parseErrors: parsed.errors,
    validationErrors: validated.errors,
    validRowCount: validated.validRows.length,
    diff,
    linesToCommit,
  };
}

export interface CommitClientRateCardImportInput {
  tenantKey: string;
  cardCode?: string;
  lines: readonly NewRateCardLineInput[];
  approvedBy: string;
  approvalRationale?: string;
}

export async function commitClientRateCardImport(
  input: CommitClientRateCardImportInput,
  /** Injectable store seam, forwarded to `createRateCardVersion` — lets
   * tests exercise this pipeline's commit path against an in-memory fake
   * (see `__tests__/rate-card-import.e2e.test.ts`) without touching a live
   * database, exactly like PR2's own `rate-card-repository.test.ts`. */
  store?: Parameters<typeof createRateCardVersion>[1],
): Promise<CreateRateCardVersionResult> {
  return createRateCardVersion(
    {
      scopeType: "client",
      tenantKey: input.tenantKey,
      cardCode: input.cardCode ?? CLIENT_ENTERPRISE_RATE_CARD_CODE,
      status: "approved",
      approvedBy: input.approvedBy,
      approvalRationale: input.approvalRationale ?? null,
      lines: input.lines,
    },
    store,
  );
}
