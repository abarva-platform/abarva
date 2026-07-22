// Tool → program identity crosswalk.
//
// The problem the assembled-mart output surfaced: real tool telemetry
// (`tool::github-copilot`, from tower_ai_tool_usage) and the funded program it
// is evidence for (`program::copilot-productivity`, from the V3 registry) carry
// DIFFERENT canonical keys, so the assembler treated them as two unrelated
// rows — the Copilot program showed `usage=null` while its real 210 active
// users orphaned into a separate `stop` row.
//
// The fix is an explicit, tenant-scoped alias table (cio_tower.tool_identity_-
// aliases) that declares "this canonical tool rolls up to this funded program."
// It also absorbs the messy-name problem the original Tower diagram called out
// ("GitHub Copilot" vs "Copilot Enterprise" vs "Developer Productivity AI") by
// mapping every display alias to one canonical tool key.
//
// This module is pure: it builds a resolver from alias rows. The CLI reads the
// rows from the DB; tests pass fixtures.

/** One row of cio_tower.tool_identity_aliases. */
export interface ToolIdentityAlias {
  tenant_key: string;
  canonical_tool_key: string;
  /** Raw/display-name variant seen in a source extract; the ingest side maps
   * these to canonical_tool_key. Not used by the assembler resolver (facts
   * already carry canonical keys) but kept so the table is the single source
   * of truth for name normalization too. */
  alias: string;
  vendor_name: string | null;
  system_name: string | null;
  /** The funded program this tool's telemetry is evidence for. */
  program_code: string | null;
  canonical_program_key: string | null;
  active: boolean;
}

export interface ProgramLink {
  programKey: string;
  programCode: string | null;
}

/**
 * A resolver: canonical_tool_key → the funded program it rolls up into.
 * Built once per tenant from the active alias rows.
 */
export interface ToolProgramCrosswalk {
  resolve(canonicalToolKey: string | null): ProgramLink | null;
  size: number;
}

const EMPTY_CROSSWALK: ToolProgramCrosswalk = {
  resolve: () => null,
  size: 0,
};

export function emptyCrosswalk(): ToolProgramCrosswalk {
  return EMPTY_CROSSWALK;
}

/**
 * Build a tool→program crosswalk from alias rows for one tenant. Only active
 * rows that actually declare a program link are used. If two active rows map
 * the same canonical_tool_key to different programs, the first wins and the
 * conflict is returned so the caller can surface it (a tool cannot roll up to
 * two funded programs without an explicit split — that is a curation error,
 * not something to resolve silently).
 */
export function buildToolProgramCrosswalk(
  aliases: readonly ToolIdentityAlias[],
  tenantKey: string,
): { crosswalk: ToolProgramCrosswalk; conflicts: string[] } {
  const map = new Map<string, ProgramLink>();
  const conflicts: string[] = [];
  for (const row of aliases) {
    if (row.tenant_key !== tenantKey) continue;
    if (!row.active) continue;
    if (!row.canonical_program_key) continue;
    const existing = map.get(row.canonical_tool_key);
    if (existing) {
      if (existing.programKey !== row.canonical_program_key) {
        conflicts.push(
          `${row.canonical_tool_key} maps to both ${existing.programKey} and ${row.canonical_program_key}`,
        );
      }
      continue;
    }
    map.set(row.canonical_tool_key, {
      programKey: row.canonical_program_key,
      programCode: row.program_code,
    });
  }
  return {
    crosswalk: {
      resolve: (key) => (key ? (map.get(key) ?? null) : null),
      size: map.size,
    },
    conflicts,
  };
}
