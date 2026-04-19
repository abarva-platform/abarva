import 'dotenv/config';
import { TIER1_SOURCES } from './sources/tier1_government';
import { runSource } from './pipeline';
import type { SourceDeclaration } from './pipeline';

const ALL_SOURCES: SourceDeclaration[] = [
  ...TIER1_SOURCES,
];

async function main() {
  const key = process.argv[2];
  if (!key) {
    console.error('usage: tsx run-source.ts <source_key | --tier1 | --all>');
    console.error('\nAvailable source keys:');
    for (const s of ALL_SOURCES) console.error(`  ${s.source_key}  (${s.publisher})`);
    process.exit(1);
  }

  let targets: SourceDeclaration[];
  if (key === '--tier1') targets = TIER1_SOURCES;
  else if (key === '--all') targets = ALL_SOURCES;
  else {
    const found = ALL_SOURCES.find((s) => s.source_key === key);
    if (!found) {
      console.error(`unknown source_key: ${key}`);
      process.exit(1);
    }
    targets = [found];
  }

  for (const decl of targets) {
    const start = Date.now();
    console.log(`▶ ${decl.source_key} · ${decl.title}`);
    try {
      const result = await runSource(decl);
      const dt = ((Date.now() - start) / 1000).toFixed(1);
      console.log(
        `  ✓ ${result.chunksWritten} chunks · ${dt}s · source_id=${result.sourceId}${
          result.skipped ? ` · SKIPPED (${result.reason})` : ''
        }`,
      );
    } catch (err) {
      console.error(`  ✗ failed: ${err instanceof Error ? err.message : err}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
