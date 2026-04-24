// Server-only data-readiness ledger · FM-02

import 'server-only';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { DataReadinessLedger, DataReadinessRecord } from './dataReadiness';

const LEDGER_PATH = join(process.cwd(), '.approvals', 'data-readiness.json');

function readLedger(): DataReadinessLedger {
  if (!existsSync(LEDGER_PATH)) return { schemaVersion: '1.0', entries: [] };
  try {
    return JSON.parse(readFileSync(LEDGER_PATH, 'utf8')) as DataReadinessLedger;
  } catch {
    return { schemaVersion: '1.0', entries: [] };
  }
}

export function getLatestDataReadiness(programCode: string): DataReadinessRecord | null {
  const matches = readLedger()
    .entries.filter((e) => e.programCode === programCode)
    .sort((a, b) => (a.assessedAt < b.assessedAt ? 1 : -1));
  return matches[0] ?? null;
}

/**
 * Gate check: a readiness record exists AND no dimension is `blocked`.
 * Gaps are allowed (the tenant has acknowledged them) but blocks are hard
 * stops until resolved.
 */
export function dataReadinessGateMet(programCode: string): {
  met: boolean;
  reason: 'no_record' | 'has_blocks' | null;
  blockedDimensions: string[];
} {
  const record = getLatestDataReadiness(programCode);
  if (!record) return { met: false, reason: 'no_record', blockedDimensions: [] };
  const blockedDimensions = record.dimensions.filter((d) => d.status === 'blocked').map((d) => d.dimension);
  if (blockedDimensions.length > 0) {
    return { met: false, reason: 'has_blocks', blockedDimensions };
  }
  return { met: true, reason: null, blockedDimensions: [] };
}
