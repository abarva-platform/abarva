#!/usr/bin/env bash
# wave_progress.sh — show progress across all AbarVa waves
# Usage: bash scripts/integration/wave_progress.sh [--wave <waveId>] [--json]
# Reads docs/build/build-waves.json and prints a status table.

set -e
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WAVES_FILE="$REPO_ROOT/docs/build/build-waves.json"
SLICES_FILE="$REPO_ROOT/docs/build/build-slices.json"

if [ ! -f "$WAVES_FILE" ]; then
  echo "ERROR: $WAVES_FILE not found"
  exit 1
fi

FILTER_WAVE=""
JSON_MODE=0
for arg in "$@"; do
  case $arg in
    --wave) shift; FILTER_WAVE="$1"; shift ;;
    --json) JSON_MODE=1 ;;
    --help)
      echo "Usage: bash scripts/integration/wave_progress.sh [--wave <waveId>] [--json]"
      echo "  --wave <id>  Show only the specified wave"
      echo "  --json       Output JSON instead of table"
      exit 0
      ;;
  esac
done

if [ "$JSON_MODE" -eq 1 ]; then
  cat "$WAVES_FILE"
  exit 0
fi

node -e "
const data = JSON.parse(require('fs').readFileSync('$WAVES_FILE', 'utf8'));
const slicesData = (() => {
  try { return JSON.parse(require('fs').readFileSync('$SLICES_FILE', 'utf8')); }
  catch { return { slices: [] }; }
})();
const allSlices = slicesData.slices || slicesData;
const slicesById = new Map();
for (const s of allSlices) slicesById.set(s.id, s);

const waves = (data.waves || data).filter((w) => {
  if (!'$FILTER_WAVE') return true;
  return w.waveId === '$FILTER_WAVE';
});

if (waves.length === 0) {
  console.log('No waves found' + ('$FILTER_WAVE' ? \` matching '$FILTER_WAVE'\` : ''));
  process.exit(0);
}

console.log('');
console.log('AbarVa Wave Progress');
console.log('====================');
console.log('');
console.log('  PROGRESS  STATUS         SLICES        WAVE                      THEME');
console.log('  --------  -------------  ------------  ------------------------  --------------------------------');

for (const w of waves) {
  const pct = (w.percentComplete ?? 0);
  const pctStr = pct.toFixed(0).padStart(3) + '%';
  const status = (w.status || 'unknown').padEnd(13);
  const completed = (w.completedSlices || []).length;
  const planned = (w.plannedSlices || []).length;
  const total = completed + planned;
  const slicesStr = (\`\${completed}/\${total}\`).padEnd(12);
  const waveId = (w.waveId || '').padEnd(24);
  const title = (w.title || '').slice(0, 32);
  const bar = (() => {
    const filled = Math.floor(pct / 10);
    return '█'.repeat(filled) + '░'.repeat(10 - filled);
  })();
  console.log(\`  \${pctStr} \${bar}  \${status}  \${slicesStr}  \${waveId}  \${title}\`);
}

if ('$FILTER_WAVE') {
  // Detailed view for single wave
  const w = waves[0];
  console.log('');
  console.log(\`Slices in \${w.waveId}:\`);
  for (const sliceId of (w.completedSlices || [])) {
    const s = slicesById.get(sliceId);
    const name = s ? (s.name || s.title || '') : '';
    console.log(\`  ✅ \${sliceId.padEnd(10)}  \${name}\`);
  }
  for (const sliceId of (w.plannedSlices || [])) {
    const s = slicesById.get(sliceId);
    const name = s ? (s.name || s.title || '') : '';
    console.log(\`  📋 \${sliceId.padEnd(10)}  \${name}\`);
  }
}

console.log('');
const totals = waves.reduce(
  (acc, w) => ({
    completed: acc.completed + (w.completedSlices || []).length,
    planned: acc.planned + (w.plannedSlices || []).length,
    waves: acc.waves + 1,
  }),
  { completed: 0, planned: 0, waves: 0 }
);
console.log(\`Totals: \${totals.waves} waves · \${totals.completed} slices complete · \${totals.planned} planned\`);
console.log('');
"
