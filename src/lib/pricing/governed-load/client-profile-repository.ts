/**
 * Nexus Pricing Engine — PR3 client pricing profile persistence.
 *
 * PR2 created the `pricing_client_profiles` / `pricing_client_profile_values`
 * tables and hand-written types (`types.ts`) but built no repository for
 * them (no consumer existed yet). This module is the PR3 write/read path,
 * built on the exact same idempotency contract as
 * `../rate-card-repository.ts` and `../versioning.ts` — a whole-profile
 * content hash decides no-op vs. new version, mirroring
 * `reference-pack-loader.ts`'s "one version covers the whole set" pattern
 * (appropriate here because a client profile is a small, cohesive bag of
 * assumptions versioned together, not independently-scoped lines like a
 * rate card).
 */
import { randomUUID } from "node:crypto";
import { azureRead } from "@/lib/data-plane/azureRead";
import { createTxSession, type TxSessionRunner } from "@/lib/data-plane/read-adapters/azureSession";
import { computeContentHash, decideVersionAction } from "../versioning";
import type { PricingClientProfileRow, PricingClientProfileValueRow, PricingVersionStatus } from "../types";

export async function getCurrentClientProfile(
  tenantKey: string,
): Promise<PricingClientProfileRow | null> {
  return azureRead.maybeSingle<PricingClientProfileRow>({
    table: "pricing_client_profiles",
    where: { tenant_key: tenantKey, is_current: true },
    missingTable: "empty",
  });
}

export async function listClientProfileValues(
  profileId: string,
): Promise<PricingClientProfileValueRow[]> {
  return azureRead.select<PricingClientProfileValueRow>({
    table: "pricing_client_profile_values",
    where: { profile_id: profileId },
    missingTable: "empty",
  });
}

export interface NewClientProfileValueInput {
  assumptionKey: string;
  assumptionValue: unknown;
}

export interface CreateClientProfileVersionInput {
  tenantKey: string;
  status?: PricingVersionStatus;
  approvedBy?: string | null;
  approvalRationale?: string | null;
  values: readonly NewClientProfileValueInput[];
}

export type CreateClientProfileVersionResult =
  | { action: "noop"; version: number; profileId: string }
  | { action: "new_version"; version: number; previousVersion: number | null; profileId: string };

export interface ClientProfileStorePort {
  getCurrent(
    tenantKey: string,
  ): Promise<{ id: string; version: number; contentHash: string } | null>;
  insertNewVersion(input: {
    id: string;
    tenantKey: string;
    version: number;
    contentHash: string;
    status: PricingVersionStatus;
    approvedBy: string | null;
    approvedAt: string | null;
    approvalRationale: string | null;
    previousProfileId: string | null;
    values: readonly (NewClientProfileValueInput & { contentHash: string })[];
  }): Promise<void>;
}

function defaultClientProfileStore(
  session: TxSessionRunner = createTxSession("abarva-pricing-write"),
): ClientProfileStorePort {
  return {
    async getCurrent(tenantKey) {
      const row = await getCurrentClientProfile(tenantKey);
      return row ? { id: row.id, version: row.profile_version, contentHash: row.content_hash } : null;
    },
    async insertNewVersion(input) {
      await session(async (run) => {
        if (input.previousProfileId) {
          await run(`UPDATE pricing_client_profiles SET is_current = false WHERE id = $1`, [
            input.previousProfileId,
          ]);
        }
        await run(
          `INSERT INTO pricing_client_profiles
             (id, tenant_key, profile_version, is_current, content_hash, status, approved_by, approved_at, approval_rationale)
           VALUES ($1, $2, $3, true, $4, $5, $6, $7, $8)`,
          [
            input.id,
            input.tenantKey,
            input.version,
            input.contentHash,
            input.status,
            input.approvedBy,
            input.approvedAt,
            input.approvalRationale,
          ],
        );
        for (const value of input.values) {
          await run(
            `INSERT INTO pricing_client_profile_values
               (id, profile_id, tenant_key, profile_version, assumption_key, assumption_value, content_hash)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              randomUUID(),
              input.id,
              input.tenantKey,
              input.version,
              value.assumptionKey,
              JSON.stringify(value.assumptionValue),
              value.contentHash,
            ],
          );
        }
      });
    },
  };
}

function valueIdentityKey(value: NewClientProfileValueInput): string {
  return value.assumptionKey;
}

/**
 * Idempotently create a new client-profile version: no-op if the content
 * hash of the full assumption set matches the current version; otherwise
 * inserts a new version and flips the previous current row — same
 * hash/compare/bump contract as `createRateCardVersion`
 * (`../rate-card-repository.ts`) and `loadReferencePack`
 * (`../reference-pack-loader.ts`).
 */
export async function createClientProfileVersion(
  input: CreateClientProfileVersionInput,
  store: ClientProfileStorePort = defaultClientProfileStore(),
): Promise<CreateClientProfileVersionResult> {
  const sortedValues = [...input.values].sort((a, b) =>
    valueIdentityKey(a) < valueIdentityKey(b) ? -1 : valueIdentityKey(a) > valueIdentityKey(b) ? 1 : 0,
  );
  const contentHash = computeContentHash({
    tenantKey: input.tenantKey,
    values: sortedValues,
  });

  const current = await store.getCurrent(input.tenantKey);
  const decision = decideVersionAction(contentHash, current);

  if (decision.action === "noop") {
    return { action: "noop", version: decision.version, profileId: current!.id };
  }

  const newId = randomUUID();
  await store.insertNewVersion({
    id: newId,
    tenantKey: input.tenantKey,
    version: decision.version,
    contentHash,
    status: input.status ?? "draft",
    approvedBy: input.approvedBy ?? null,
    approvedAt: input.approvedBy ? new Date().toISOString() : null,
    approvalRationale: input.approvalRationale ?? null,
    previousProfileId: current?.id ?? null,
    values: sortedValues.map((value) => ({ ...value, contentHash: computeContentHash(value) })),
  });

  return {
    action: "new_version",
    version: decision.version,
    previousVersion: decision.previousVersion,
    profileId: newId,
  };
}
