/**
 * Nexus Pricing Engine — PR3 governed-load client role-alias import
 * (optional per the brief — `client_role_aliases.template.csv`).
 *
 * Simpler than the rate-card/profile pipelines: `pricing_role_aliases` rows
 * are not versioned as a cohesive set (unlike a rate card or a client
 * profile) — each alias is an independent row, deduplicated against the
 * `(tenant_key, normalized_alias, provider_scope)` unique index. So "commit"
 * here is an idempotent insert-if-not-already-present per row, not a
 * version-bump. Reuses PR2's `listRoleAliasesForTenant`
 * (`../reference-repository.ts`) for the "does this already exist" read.
 */
import { randomUUID } from "node:crypto";
import { createTxSession, type TxSessionRunner } from "@/lib/data-plane/read-adapters/azureSession";
import { listRoleAliasesForTenant } from "../reference-repository";
import { computeContentHash } from "../versioning";
import { parseClientRoleAliasesCsv } from "./csv-parse";
import { loadRateCardReferenceSnapshot } from "./reference-lookup";
import { validateRoleAliasRowsAgainstReference } from "./semantic-validation";
import type { ClientRoleAliasCsvRow, RowError } from "./types";

export interface RoleAliasImportPreview {
  tenantKey: string;
  taxonomyVersion: number;
  parseErrors: RowError[];
  validationErrors: RowError[];
  /** Not yet present for this tenant — inserted on commit. */
  added: ClientRoleAliasCsvRow[];
  /** Already present for this tenant (by normalized alias label) — no-op on commit. */
  alreadyPresent: ClientRoleAliasCsvRow[];
}

export async function previewClientRoleAliasImport(input: {
  tenantKey: string;
  csvText: string;
}): Promise<RoleAliasImportPreview> {
  const parsed = parseClientRoleAliasesCsv(input.csvText);
  const refs = await loadRateCardReferenceSnapshot();
  const validated = validateRoleAliasRowsAgainstReference(parsed.rows, refs);

  const existing = await listRoleAliasesForTenant(refs.taxonomyVersion, input.tenantKey);
  const existingNormalized = new Set(
    existing.filter((a) => a.tenant_key === input.tenantKey).map((a) => a.normalized_alias),
  );

  const added: ClientRoleAliasCsvRow[] = [];
  const alreadyPresent: ClientRoleAliasCsvRow[] = [];
  for (const row of validated.validRows) {
    const normalized = row.aliasLabel.trim().toLowerCase();
    if (existingNormalized.has(normalized)) alreadyPresent.push(row);
    else added.push(row);
  }

  return {
    tenantKey: input.tenantKey,
    taxonomyVersion: refs.taxonomyVersion,
    parseErrors: parsed.errors,
    validationErrors: validated.errors,
    added,
    alreadyPresent,
  };
}

export interface RoleAliasStorePort {
  insertAlias(row: {
    id: string;
    taxonomyVersion: number;
    aliasCode: string;
    roleCode: string;
    aliasLabel: string;
    aliasType: string;
    tenantKey: string;
    contentHash: string;
  }): Promise<void>;
}

function defaultRoleAliasStore(
  session: TxSessionRunner = createTxSession("abarva-pricing-write"),
): RoleAliasStorePort {
  return {
    async insertAlias(row) {
      await session(async (run) => {
        await run(
          `INSERT INTO pricing_role_aliases
             (id, taxonomy_version, alias_code, role_code, alias_label, alias_type, tenant_key, content_hash, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')`,
          [
            row.id,
            row.taxonomyVersion,
            row.aliasCode,
            row.roleCode,
            row.aliasLabel,
            row.aliasType,
            row.tenantKey,
            row.contentHash,
          ],
        );
      });
    },
  };
}

export interface CommitClientRoleAliasImportInput {
  tenantKey: string;
  taxonomyVersion: number;
  rows: readonly ClientRoleAliasCsvRow[];
}

export async function commitClientRoleAliasImport(
  input: CommitClientRoleAliasImportInput,
  store: RoleAliasStorePort = defaultRoleAliasStore(),
): Promise<{ inserted: number }> {
  for (const row of input.rows) {
    const aliasCode = `CLI-${randomUUID().slice(0, 8).toUpperCase()}`;
    await store.insertAlias({
      id: randomUUID(),
      taxonomyVersion: input.taxonomyVersion,
      aliasCode,
      roleCode: row.roleCode,
      aliasLabel: row.aliasLabel,
      aliasType: row.aliasType,
      tenantKey: input.tenantKey,
      contentHash: computeContentHash({
        tenantKey: input.tenantKey,
        roleCode: row.roleCode,
        aliasLabel: row.aliasLabel.trim().toLowerCase(),
      }),
    });
  }
  return { inserted: input.rows.length };
}
