/**
 * Tower ingest source registry.
 *
 * Each entry describes ONE live integration that feeds Tower. Sibling slices
 * append their entry by importing their own descriptor and adding it to the
 * `TOWER_INGEST_SOURCES` array below. This file is the union of all such
 * descriptors — keep additions alphabetical to make merge conflicts trivial.
 *
 * Audit context: PR #2525 found ZERO live integrations. Tower has lots of
 * synthesis but nothing watching a real source. Every entry in this array is
 * a real watch: a real-world extract path, a template, a parser, a validator,
 * a CLI, and a target table.
 */

import { azureCostSource } from "./azure-cost";
import { claudeCodeSource } from "./claude-code";
import { copilotSource } from "./copilot";
import { cursorSource } from "./cursor";
import { jiraSource } from "./jira";
import { servicenowCmdbSource } from "./servicenow-cmdb";
import { githubDoraSource } from "./github-dora";
import { servicenowItsmSource } from "./servicenow-itsm";

export type TowerIngestKind =
  | "cost"
  | "inventory"
  | "productivity"
  | "risk"
  | "usage"
  | "value";

export interface TowerIngestSource {
  /** Stable key used as the source identifier on disk and in registries. */
  key: string;
  /** Human-friendly name shown in catalog / chooser UIs. */
  displayName: string;
  /** Vendor or system of record. */
  vendor: string;
  /** Tower dimension this source primarily feeds. */
  kind: TowerIngestKind;
  /** Stable target DB table name (must match the migration this slice ships). */
  targetTable: string;
  /** Public path of the blank template file (relative to /public). */
  templatePath: string;
  /** Public path of the sample-filled workbook (relative to /public). */
  samplePath: string;
  /** Project-relative path of the README for this source. */
  readmePath: string;
  /** Module path (relative to src) of the parser entrypoint. */
  parserModule: string;
  /** Module path (relative to src) of the validator entrypoint. */
  validatorModule: string;
  /** Script name (under src/scripts/tower) for the CLI ingest tool. */
  cliScript: string;
  /** Real-world extract path summary (one line for catalog cards). */
  extractPath: string;
  /** Sample-row count and tenant — for synthetic banner sizing. */
  sampleSummary: { tenant: string; rowsApprox: number };
}

export const TOWER_INGEST_SOURCES: TowerIngestSource[] = [
  azureCostSource,
  claudeCodeSource,
  copilotSource,
  cursorSource,
  jiraSource,
  servicenowCmdbSource,
  githubDoraSource,
  servicenowItsmSource,
  // Sibling slices append here, alphabetical by `key`.
];

export function findTowerIngestSource(
  key: string,
): TowerIngestSource | undefined {
  return TOWER_INGEST_SOURCES.find((s) => s.key === key);
}

export function towerIngestKindsCovered(): TowerIngestKind[] {
  return Array.from(new Set(TOWER_INGEST_SOURCES.map((s) => s.kind))).sort();
}
