// Agent generation · app-inventory prompt block
//
// Pure formatting of the tenant's enterprise application inventory into the
// user-message block the d04 template folds in. Kept separate from the binder
// so the record→table mapping is unit-testable without a DB or Claude call.

import type { SourceAppInventoryEntry } from './types';

/** Escape a cell value so a stray pipe or newline can't break the table. */
function cell(value: string | null): string {
  if (!value) return '';
  return value.replace(/\|/g, '/').replace(/\s*\n\s*/g, ' ').trim();
}

/**
 * Build the enterprise-app-inventory block for the d04 user message.
 *
 * - Empty inventory → an explicit "not loaded" note so the model authors the
 *   framework and flags the gap instead of inventing applications.
 * - Non-empty → a headline count plus a markdown table the model pre-fills the
 *   §2 application list from, verbatim.
 */
export function buildAppInventoryPromptBlock(
  entries: SourceAppInventoryEntry[] | undefined,
): string {
  if (!entries || entries.length === 0) {
    return [
      'Enterprise application inventory: (none loaded for this tenant).',
      'Do not invent applications. Produce the §2 table framework and flag in §1 and §4 that the inventory is not yet ingested and must be authored or uploaded.',
    ].join('\n');
  }

  const header = `Enterprise application inventory — ${entries.length} system${entries.length === 1 ? '' : 's'} already on record for this tenant. Pre-fill the §2 application table directly from these rows, verbatim IDs and names, one row per system. Do not add applications beyond this list; where a Tier or Owner cell is blank, carry it forward as a coverage gap in §4 rather than guessing.`;

  const table = [
    '| App ID | Name | Tier | Owner | Vendor | Criticality | Notes |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...entries.map(
      (e) =>
        `| ${cell(e.appId)} | ${cell(e.name)} | ${cell(e.tier)} | ${cell(e.owner)} | ${cell(e.vendor)} | ${cell(e.criticality)} | ${cell(e.notes)} |`,
    ),
  ].join('\n');

  return `${header}\n\n${table}`;
}
