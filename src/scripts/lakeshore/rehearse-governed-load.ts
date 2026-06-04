import fs from 'node:fs/promises';
import Module from 'node:module';
import path from 'node:path';

import type { LakeshoreLoadMode } from '@/lib/lakeshore/load-rehearsal';

interface CliOptions {
  readonly mode: LakeshoreLoadMode;
  readonly clientId: string;
  readonly rootDir: string;
  readonly outputPath: string;
  readonly includeDocuments: boolean;
}

type ModuleWithLoad = typeof Module & {
  _load: (request: string, parent: NodeModule | null | undefined, isMain: boolean) => unknown;
};

function readFlag(name: string): string | null {
  const prefix = `--${name}=`;
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

function hasFlag(name: string): boolean {
  return process.argv.slice(2).includes(`--${name}`);
}

function options(): CliOptions {
  const repoRoot = process.cwd();
  const rootDir = path.resolve(readFlag('root') ?? path.join(repoRoot, 'docs/build/lakeshore/loaded'));
  const modeRaw = readFlag('mode') ?? (hasFlag('commit') ? 'commit' : 'dry-run');
  if (modeRaw !== 'dry-run' && modeRaw !== 'commit') {
    throw new Error(`invalid mode: ${modeRaw}`);
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultOutput = path.join(rootDir, 'load-runs', `lakeshore-governed-load-${modeRaw}-${stamp}.json`);
  return {
    mode: modeRaw,
    clientId: readFlag('client-id') ?? process.env.LAKESHORE_CLIENT_ID ?? 'lakeshore-client-id-required-for-commit',
    rootDir,
    outputPath: path.resolve(readFlag('out') ?? defaultOutput),
    includeDocuments: !hasFlag('skip-documents'),
  };
}

async function main(): Promise<void> {
  const cli = options();
  if (cli.mode === 'commit' && cli.clientId === 'lakeshore-client-id-required-for-commit') {
    throw new Error('commit mode requires --client-id=<clients.id> or LAKESHORE_CLIENT_ID');
  }

  const moduleWithLoad = Module as ModuleWithLoad;
  const originalLoad = moduleWithLoad._load;
  moduleWithLoad._load = function patchedLoad(request, parent, isMain) {
    if (request === 'server-only') return {};
    return originalLoad.call(this, request, parent, isMain);
  };

  const { rehearseLakeshoreLoad } = await import('@/lib/lakeshore/load-rehearsal');

  const result = await rehearseLakeshoreLoad({
    rootDir: cli.rootDir,
    mode: cli.mode,
    clientId: cli.clientId,
    includeDocuments: cli.includeDocuments,
  });

  await fs.mkdir(path.dirname(cli.outputPath), { recursive: true });
  await fs.writeFile(cli.outputPath, `${JSON.stringify(result, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        event: 'lakeshore_governed_load_rehearsal_complete',
        mode: result.mode,
        tenantKey: result.tenantKey,
        brokerKey: result.brokerKey,
        csvFiles: result.totals.csvFiles,
        csvRowsParsed: result.totals.csvRowsParsed,
        csvChunksQueued: result.totals.csvChunksQueued,
        documents: result.totals.documents,
        documentTextChars: result.totals.documentTextChars,
        quarantineDecision: result.quarantineProbe.decision,
        outputPath: cli.outputPath,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        event: 'lakeshore_governed_load_rehearsal_failed',
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
