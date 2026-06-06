// CLI: run the corpus grounding battery and print a report.
// Run: npx tsx scripts/grounding/run-corpus-grounding-battery.ts
// Exit 0 iff every question is grounded.

import {
  runGroundingBattery,
  type GroundingResult,
} from '../../src/lib/programs/expert-kernel/grounding/corpus-grounding-battery';

const results: GroundingResult[] = runGroundingBattery();
const total = results.length;
const passed = results.filter((r) => r.pass).length;
const failed = results.filter((r) => !r.pass);

const rollup = (key: (r: GroundingResult) => string) => {
  const keys = [...new Set(results.map(key))];
  for (const k of keys) {
    const rs = results.filter((r) => key(r) === k);
    console.log(
      `  ${k.padEnd(22)} ${rs.filter((r) => r.pass).length}/${rs.length}`,
    );
  }
};

console.log('\n=== CORPUS GROUNDING BATTERY ===');
console.log(`Questions: ${total} · Grounded: ${passed} · Gaps: ${total - passed}`);
console.log('\nBy surface (questions the corpus can ground):');
rollup((r) => r.surface);
console.log('\nBy industry:');
rollup((r) => r.industryCode);
if (failed.length) {
  console.log('\nGAPS (would fall back to general reasoning):');
  for (const f of failed) {
    console.log(`  x ${f.id} [${f.functionKey}] needs: ${f.requires}`);
  }
}
console.log(
  `\n${passed === total ? 'PASS' : 'FAIL'} - ${passed}/${total} questions grounded.\n`,
);
process.exit(passed === total ? 0 : 1);
