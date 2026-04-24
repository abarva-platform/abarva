// Server-only stakeholder success + tension ledger · FM-04
//
// Same pattern as sponsorCommitmentLedger.ts — separate from the types
// module because this file uses fs.

import 'server-only';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type {
  ProgramTensionRecord,
  StakeholderSuccessLedger,
  StakeholderSuccessRecord,
} from './stakeholderSuccess';

const LEDGER_PATH = join(process.cwd(), '.approvals', 'stakeholder-success.json');

function readLedger(): StakeholderSuccessLedger {
  if (!existsSync(LEDGER_PATH)) return { schemaVersion: '1.0', successEntries: [], tensionEntries: [] };
  try {
    return JSON.parse(readFileSync(LEDGER_PATH, 'utf8')) as StakeholderSuccessLedger;
  } catch {
    return { schemaVersion: '1.0', successEntries: [], tensionEntries: [] };
  }
}

export function getStakeholderSuccessRecords(programCode: string): StakeholderSuccessRecord[] {
  return readLedger().successEntries.filter((e) => e.programCode === programCode);
}

export function getProgramTensionRecords(programCode: string): ProgramTensionRecord[] {
  return readLedger().tensionEntries.filter((e) => e.programCode === programCode);
}

/**
 * Returns true when every stakeholder in `requiredStakeholderIds` has both
 * a success record AND at least one tension record. Gate check for
 * Phase 1 → Phase 2 advance per FM-04.
 */
export function stakeholderSuccessGateMet(
  programCode: string,
  requiredStakeholderIds: string[],
): { met: boolean; missingSuccessFor: string[]; missingTensionFor: string[] } {
  const successRecords = getStakeholderSuccessRecords(programCode);
  const tensionRecords = getProgramTensionRecords(programCode);
  const successIds = new Set(successRecords.map((r) => r.stakeholderId));
  const tensionIds = new Set(tensionRecords.map((r) => r.stakeholderId));

  const missingSuccessFor = requiredStakeholderIds.filter((id) => !successIds.has(id));
  const missingTensionFor = requiredStakeholderIds.filter((id) => !tensionIds.has(id));

  return {
    met: missingSuccessFor.length === 0 && missingTensionFor.length === 0,
    missingSuccessFor,
    missingTensionFor,
  };
}
