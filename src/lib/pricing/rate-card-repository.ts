/**
 * Nexus Pricing Engine — PR2 rate-card persistence + inheritance walk.
 *
 * Rate cards are modeled as a single `pricing_rate_cards` table with a
 * `scope_type` (`global` | `client` | `move_exception`) and a
 * self-referencing `parent_rate_card_id`, per the PR2 execution prompt
 * (brief §5.1) — NOT a rigid 4-table hierarchy. This module provides:
 *
 *   - typed read access (`getCurrentRateCard`, `listRateCardVersions`,
 *     `listRateCardLines`), following the direct-`azureRead`-import
 *     convention (see `reference-repository.ts`'s header for the precedent);
 *   - a write path (`createRateCardVersion`) built on the same
 *     hash/compare/bump idempotency contract as
 *     `src/lib/pricing/versioning.ts`, behind an injectable
 *     `RateCardStorePort` so the full idempotency contract (no-op on
 *     unchanged content, new version + supersede on changed content, no
 *     duplicate "current" row on a double-import) is unit-testable without
 *     a live database — see `__tests__/rate-card-repository.test.ts`;
 *   - `resolveRateCardInheritance`, a PURE function proving the 3-tier scope
 *     walk (global -> client -> move_exception, closest scope wins per
 *     line). The FULL 6-tier fallback resolver (role/level/provider/
 *     location matching precedence) is explicitly PR4/PR5 scope per the
 *     brief — this is deliberately just the 3-tier scope inheritance proof.
 */
import { azureRead } from "@/lib/data-plane/azureRead";
import { createTxSession, type TxSessionRunner } from "@/lib/data-plane/read-adapters/azureSession";
import { randomUUID } from "node:crypto";
import {
  coalesceKeyPart,
  computeContentHash,
  decideVersionAction,
} from "./versioning";
import type {
  PricingRateCardLineRow,
  PricingRateCardRow,
  PricingRateCardScopeType,
  PricingVersionStatus,
} from "./types";

// ---------------------------------------------------------------------------
// Typed reads
// ---------------------------------------------------------------------------

/**
 * The current (`is_current = true`) rate card row for a given scope.
 *
 * TENANCY: callers MUST pass the canonical hyphenated `tenantKey`
 * (`canonicalTenantKey()` from `@/lib/tenant/aliases`) for `client` /
 * `move_exception` scope, and `null` for `global` scope — this function does
 * not canonicalize, matching PRICING_ENGINE_CURRENT_STATE.md §10's
 * "canonicalize at the boundary, never assume" rule. Passing the wrong
 * tenant's key returns that tenant's own row only (or `null`) — never
 * another tenant's, since `tenant_key` is always an explicit equality
 * predicate in the underlying query.
 */
export async function getCurrentRateCard(
  scopeType: PricingRateCardScopeType,
  tenantKey: string | null,
  cardCode: string,
): Promise<PricingRateCardRow | null> {
  return azureRead.maybeSingle<PricingRateCardRow>({
    table: "pricing_rate_cards",
    where: {
      scope_type: scopeType,
      tenant_key: tenantKey === null ? { op: "is", value: null } : tenantKey,
      card_code: cardCode,
      is_current: true,
    },
    missingTable: "empty",
  });
}

export async function listRateCardVersions(
  scopeType: PricingRateCardScopeType,
  tenantKey: string | null,
  cardCode: string,
): Promise<PricingRateCardRow[]> {
  return azureRead.select<PricingRateCardRow>({
    table: "pricing_rate_cards",
    where: {
      scope_type: scopeType,
      tenant_key: tenantKey === null ? { op: "is", value: null } : tenantKey,
      card_code: cardCode,
    },
    orderBy: { column: "version", direction: "desc" },
    missingTable: "empty",
  });
}

export async function listRateCardLines(
  cardVersionId: string,
): Promise<PricingRateCardLineRow[]> {
  return azureRead.select<PricingRateCardLineRow>({
    table: "pricing_rate_card_lines",
    where: { card_version_id: cardVersionId },
    missingTable: "empty",
  });
}

// ---------------------------------------------------------------------------
// Write path — idempotent create-new-version
// ---------------------------------------------------------------------------

export interface NewRateCardLineInput {
  roleOrBandRef: string;
  level?: string | null;
  providerRef?: string | null;
  locationRef?: string | null;
  rateBasis: string;
  unit: string;
  rateValue: number;
  currency?: string;
  validFrom: string;
  validTo?: string | null;
}

export interface CreateRateCardVersionInput {
  scopeType: PricingRateCardScopeType;
  tenantKey: string | null;
  moveId?: string | null;
  cardCode: string;
  parentRateCardId?: string | null;
  status?: PricingVersionStatus;
  /**
   * Approval metadata (PR3 addition — the `approved_by`/`approved_at`/
   * `approval_rationale` columns already exist on `pricing_rate_cards` from
   * the PR2 migration but PR2's write path never populated them, since
   * nothing called `createRateCardVersion` with `status: "approved"` yet.
   * Purely additive: omitting these fields behaves exactly as PR2 did.
   */
  approvedBy?: string | null;
  approvalRationale?: string | null;
  lines: readonly NewRateCardLineInput[];
}

export type CreateRateCardVersionResult =
  | { action: "noop"; version: number; cardId: string }
  | { action: "new_version"; version: number; previousVersion: number | null; cardId: string };

/**
 * Storage seam for `createRateCardVersion` — deliberately narrow (get
 * current + insert new version) so a fully in-memory fake can exercise the
 * complete idempotency contract in tests without a live database. The
 * default implementation (`defaultRateCardStore`) is the real
 * `azureRead` + transactional-session-backed path.
 */
export interface RateCardStorePort {
  getCurrent(
    scopeType: PricingRateCardScopeType,
    tenantKey: string | null,
    cardCode: string,
  ): Promise<{ id: string; version: number; contentHash: string } | null>;
  insertNewVersion(input: {
    id: string;
    scopeType: PricingRateCardScopeType;
    tenantKey: string | null;
    moveId: string | null;
    cardCode: string;
    parentRateCardId: string | null;
    version: number;
    contentHash: string;
    status: PricingVersionStatus;
    approvedBy: string | null;
    approvedAt: string | null;
    approvalRationale: string | null;
    previousCardId: string | null;
    lines: readonly (NewRateCardLineInput & { contentHash: string })[];
  }): Promise<void>;
}

function defaultRateCardStore(
  session: TxSessionRunner = createTxSession("abarva-pricing-write"),
): RateCardStorePort {
  return {
    async getCurrent(scopeType, tenantKey, cardCode) {
      const row = await getCurrentRateCard(scopeType, tenantKey, cardCode);
      return row ? { id: row.id, version: row.version, contentHash: row.content_hash } : null;
    },
    async insertNewVersion(input) {
      await session(async (run) => {
        if (input.previousCardId) {
          await run(
            `UPDATE pricing_rate_cards SET is_current = false WHERE id = $1`,
            [input.previousCardId],
          );
        }
        await run(
          `INSERT INTO pricing_rate_cards
             (id, scope_type, tenant_key, move_id, card_code, parent_rate_card_id,
              version, is_current, content_hash, status, approved_by, approved_at, approval_rationale)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9, $10, $11, $12)`,
          [
            input.id,
            input.scopeType,
            input.tenantKey,
            input.moveId,
            input.cardCode,
            input.parentRateCardId,
            input.version,
            input.contentHash,
            input.status,
            input.approvedBy,
            input.approvedAt,
            input.approvalRationale,
          ],
        );
        for (const line of input.lines) {
          await run(
            `INSERT INTO pricing_rate_card_lines
               (id, card_version_id, role_or_band_ref, level, provider_ref, location_ref,
                rate_basis, unit, rate_value, currency, valid_from, valid_to, tenant_key, content_hash)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            [
              randomUUID(),
              input.id,
              line.roleOrBandRef,
              line.level ?? null,
              line.providerRef ?? null,
              line.locationRef ?? null,
              line.rateBasis,
              line.unit,
              line.rateValue,
              line.currency ?? "USD",
              line.validFrom,
              line.validTo ?? null,
              input.tenantKey,
              line.contentHash,
            ],
          );
        }
      });
    },
  };
}

/** Deterministic sort key for a rate-card line, matching the migration's unique-index column order. */
function lineIdentityKey(line: NewRateCardLineInput): string {
  return [
    line.roleOrBandRef,
    coalesceKeyPart(line.level ?? null, "__any_level__"),
    coalesceKeyPart(line.providerRef ?? null, "__any_provider__"),
    coalesceKeyPart(line.locationRef ?? null, "__any_location__"),
    line.rateBasis,
    line.unit,
    line.validFrom,
  ].join("::");
}

/**
 * Idempotently create a new rate-card version: no-op if the content hash of
 * `input` (scope identity + full line set) matches the current version;
 * otherwise inserts a new version and flips the previous current row.
 *
 * Two back-to-back calls with the same `input` never produce two "current"
 * rows: the second call always re-reads the (by-then-updated) current row
 * via `store.getCurrent` and finds the matching content hash, so it resolves
 * to `noop` — the database's own partial unique index on `is_current` is
 * the backstop, not the only guard.
 */
export async function createRateCardVersion(
  input: CreateRateCardVersionInput,
  store: RateCardStorePort = defaultRateCardStore(),
): Promise<CreateRateCardVersionResult> {
  const sortedLines = [...input.lines].sort((a, b) =>
    lineIdentityKey(a) < lineIdentityKey(b) ? -1 : lineIdentityKey(a) > lineIdentityKey(b) ? 1 : 0,
  );
  const contentHash = computeContentHash({
    scopeType: input.scopeType,
    tenantKey: input.tenantKey,
    cardCode: input.cardCode,
    lines: sortedLines,
  });

  const current = await store.getCurrent(input.scopeType, input.tenantKey, input.cardCode);
  const decision = decideVersionAction(contentHash, current);

  if (decision.action === "noop") {
    return { action: "noop", version: decision.version, cardId: current!.id };
  }

  const newId = randomUUID();
  await store.insertNewVersion({
    id: newId,
    scopeType: input.scopeType,
    tenantKey: input.tenantKey,
    moveId: input.moveId ?? null,
    cardCode: input.cardCode,
    parentRateCardId: input.parentRateCardId ?? null,
    version: decision.version,
    contentHash,
    status: input.status ?? "draft",
    approvedBy: input.approvedBy ?? null,
    approvedAt: input.approvedBy ? new Date().toISOString() : null,
    approvalRationale: input.approvalRationale ?? null,
    previousCardId: current?.id ?? null,
    lines: sortedLines.map((line) => ({ ...line, contentHash: computeContentHash(line) })),
  });

  return {
    action: "new_version",
    version: decision.version,
    previousVersion: decision.previousVersion,
    cardId: newId,
  };
}

// ---------------------------------------------------------------------------
// 3-tier scope inheritance walk (PURE — no I/O)
// ---------------------------------------------------------------------------

export interface ResolvedRateCardLine extends PricingRateCardLineRow {
  /** Which scope tier this line's value was actually resolved from. */
  resolvedFromScope: PricingRateCardScopeType;
}

/**
 * Merge global -> client -> move_exception rate-card lines into one
 * resolved set, keyed by the same identity the migration's unique index
 * uses (role_or_band_ref, level, provider_ref, location_ref, rate_basis,
 * unit). A more specific scope's line for a given key REPLACES the less
 * specific scope's line for that same key; keys present only in a broader
 * scope fall back to that broader scope's value untouched.
 *
 * This is the "3-tier scope inheritance walk" the PR2 brief asks to prove —
 * the FULL 6-tier fallback resolver (role/level/provider/location matching
 * precedence for a query that doesn't name an exact line) is PR4/PR5 scope,
 * not implemented here.
 */
export function resolveRateCardInheritance(input: {
  global: readonly PricingRateCardLineRow[];
  client?: readonly PricingRateCardLineRow[];
  moveException?: readonly PricingRateCardLineRow[];
}): ResolvedRateCardLine[] {
  const keyOf = (line: PricingRateCardLineRow): string =>
    [
      line.role_or_band_ref,
      coalesceKeyPart(line.level, "__any_level__"),
      coalesceKeyPart(line.provider_ref, "__any_provider__"),
      coalesceKeyPart(line.location_ref, "__any_location__"),
      line.rate_basis,
      line.unit,
    ].join("::");

  const merged = new Map<string, ResolvedRateCardLine>();
  for (const line of input.global) {
    merged.set(keyOf(line), { ...line, resolvedFromScope: "global" });
  }
  for (const line of input.client ?? []) {
    merged.set(keyOf(line), { ...line, resolvedFromScope: "client" });
  }
  for (const line of input.moveException ?? []) {
    merged.set(keyOf(line), { ...line, resolvedFromScope: "move_exception" });
  }
  return Array.from(merged.values()).sort((a, b) =>
    keyOf(a) < keyOf(b) ? -1 : keyOf(a) > keyOf(b) ? 1 : 0,
  );
}
