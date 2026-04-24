// Server-only sponsor commitment ledger reader · FM-03
//
// Kept separate from sponsorCommitment.ts because this file pulls in
// Node's `fs` and `path`. sponsorCommitment.ts (types + validator) is
// safe to import from client components; this file is not.

import 'server-only';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { SponsorCommitmentLedger, SponsorCommitmentRecord } from './sponsorCommitment';

const LEDGER_PATH = join(process.cwd(), '.approvals', 'sponsor-commitments.json');

/**
 * Return the most recent commitment record for a programCode, or null
 * if none exists. Safe for Server Components and API routes.
 */
export function getLatestSponsorCommitment(programCode: string): SponsorCommitmentRecord | null {
  if (!existsSync(LEDGER_PATH)) return null;
  try {
    const raw = JSON.parse(readFileSync(LEDGER_PATH, 'utf8')) as SponsorCommitmentLedger;
    const matches = raw.entries
      .filter((e) => e.programCode === programCode)
      .sort((a, b) => (a.committedAt < b.committedAt ? 1 : -1));
    return matches[0] ?? null;
  } catch {
    return null;
  }
}
