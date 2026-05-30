// Tower ingest registry.
//
// APPEND-ONLY across the fleet. Each Tower source-system slice adds
// ONE entry here so the surface that wires uploads, downloads, and
// runbooks has a single source of truth. Conflicts during merges are
// always union-merges — keep both entries.
//
// Per-slice contract:
//   - `key` is a stable kebab-case slug (e.g. `github-dora`).
//   - `parse` returns rows + structural errors from an .xlsx buffer.
//   - `validate` turns raw rows into typed rows + per-cell errors.
//   - `ingest` is the verb the CLI / API uses to apply rows to the DB.
//   - `templatePath` / `sampleFilledPath` / `readmePath` are paths
//     relative to the repo root so the surface can build download URLs.

import type {
  GithubDoraParseResult,
  GithubDoraRow,
  GithubDoraValidationResult,
} from './github-dora';
import {
  applyIngestPlan,
  buildIngestPlan,
  parseGithubDoraWorkbook,
  resolveClientIdByTenantKey,
  validateGithubDoraRows,
} from './github-dora';
import type { Client } from 'pg';

export interface TowerIngestRegistryEntry {
  readonly key: string;
  readonly label: string;
  readonly description: string;
  readonly parse: (
    buffer: ArrayBuffer | Buffer | Uint8Array,
  ) => Promise<unknown>;
  readonly validate: (rows: readonly unknown[]) => unknown;
  readonly ingest: (args: {
    client: Client;
    clientId: string;
    rows: readonly unknown[];
    actor: string;
    sourceFileId?: string;
  }) => Promise<unknown>;
  readonly templatePath: string;
  readonly sampleFilledPath: string;
  readonly readmePath: string;
}

export const TOWER_INGEST_REGISTRY: readonly TowerIngestRegistryEntry[] = [
  {
    key: 'github-dora',
    label: 'GitHub → DORA metrics',
    description:
      'Weekly ingest of the four canonical DORA metrics per GitHub repo. ' +
      'Source: GitHub Actions deployments + PR merges + `incident:*` issues.',
    parse: async (buffer): Promise<GithubDoraParseResult> =>
      parseGithubDoraWorkbook(buffer),
    validate: (rows): GithubDoraValidationResult =>
      validateGithubDoraRows(
        rows as Parameters<typeof validateGithubDoraRows>[0],
      ),
    ingest: async (args) => {
      const typedRows = args.rows as readonly GithubDoraRow[];
      const plan = await buildIngestPlan({
        client: args.client,
        clientId: args.clientId,
        rows: typedRows,
      });
      return applyIngestPlan({
        client: args.client,
        plan,
        actor: args.actor,
        sourceFileId: args.sourceFileId,
      });
    },
    templatePath: 'public/templates/tower/github-dora/template.xlsx',
    sampleFilledPath: 'public/templates/tower/github-dora/sample-filled.xlsx',
    readmePath: 'docs/templates/tower/github-dora/README.md',
  },
  // APPEND NEW SLICES BELOW. Do not reorder or remove entries.
];

export { resolveClientIdByTenantKey };
