// Tower · Claude Code ingest CLI dry-run smoke.
//
// Invokes the CLI in --dry-run mode against the sample-filled workbook.
// Verifies validation passes and no DB write is attempted (no DB env needed).

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const CLI = join(process.cwd(), 'src', 'scripts', 'tower', 'ingest-claude-code.ts');
const SAMPLE = join(process.cwd(), 'public', 'templates', 'tower', 'claude-code', 'sample-filled.xlsx');

describe('ingest-claude-code CLI dry-run', () => {
  it('exits 0 on a valid sample file with --dry-run', () => {
    if (!existsSync(SAMPLE)) {
      throw new Error('sample-filled.xlsx missing — run build-claude-code-templates first');
    }
    // Strip DB env to prove dry-run does not require it.
    const env = { ...process.env };
    delete env.DATABASE_URL;
    delete env.ABARVA_AZURE_DATABASE_URL;
    delete env.AZURE_DATABASE_URL;
    const result = spawnSync(
      'npx',
      ['tsx', CLI, '--file', SAMPLE, '--tenant', 'northwindretail', '--dry-run'],
      { encoding: 'utf-8', env, timeout: 60_000 },
    );
    if (result.status !== 0) {
      // Surface stdout/stderr so a CI failure is debuggable.
      console.error('stdout:', result.stdout);
      console.error('stderr:', result.stderr);
    }
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/parsed rows=\d+/);
    expect(result.stdout).toMatch(/dry-run · would upsert/);
  }, 90_000);
});
