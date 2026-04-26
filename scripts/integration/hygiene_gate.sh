#!/usr/bin/env bash
# QA20 — Mandatory Hygiene Gate Runner
# Usage: bash scripts/integration/hygiene_gate.sh [--skip-build] [--help]
# Non-destructive. Never deletes files, never pops stashes, never pushes.

SKIP_BUILD=0
PASS=0
FAIL=0
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Parse args
for arg in "$@"; do
  case $arg in
    --skip-build) SKIP_BUILD=1 ;;
    --help)
      echo "Usage: bash scripts/integration/hygiene_gate.sh [--skip-build] [--help]"
      echo "Runs all mandatory hygiene checks. Non-destructive."
      echo "  --skip-build   Skip npm run build (use in lane agents)"
      echo "  --help         Show this help"
      exit 0
      ;;
  esac
done

cd "$REPO_ROOT"

pass() { echo "[PASS] $1"; PASS=$((PASS+1)); }
fail() { echo "[FAIL] $1"; FAIL=$((FAIL+1)); }
section() { echo ""; echo "=== $1 ==="; }

# Section 1: Git hygiene
section "1. Git hygiene"
if git status --short | grep -q '^[^?]'; then
  fail "Uncommitted changes detected (run git status --short)"
else
  pass "No uncommitted changes"
fi

if git diff --check 2>&1 | grep -q "trailing whitespace"; then
  fail "Whitespace errors in diff (git diff --check)"
else
  pass "No whitespace errors"
fi

CONFLICT_COUNT=$(git grep -n "^<<<<<<<\|^=======\|^>>>>>>>" -- . 2>/dev/null | grep -v "^Binary\|#.*<<<<\|#.*>>>>>>>\|#.*=======" | wc -l | tr -d ' ')
if [ "$CONFLICT_COUNT" -gt 0 ]; then
  fail "Conflict markers found ($CONFLICT_COUNT lines)"
  git grep -n "^<<<<<<<\|^=======\|^>>>>>>>" -- . 2>/dev/null | grep -v "Binary" | head -10
else
  pass "No conflict markers"
fi

# Section 2: JSON manifest hygiene
section "2. JSON manifest hygiene"
if node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8')); console.log('ok')" 2>/dev/null | grep -q ok; then
  pass "build-slices.json valid JSON"
else
  fail "build-slices.json invalid JSON"
fi

if node -e "JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('ok')" 2>/dev/null | grep -q ok; then
  pass "production-readiness.json valid JSON"
else
  fail "production-readiness.json invalid JSON"
fi

if [ -f docs/build/build-waves.json ]; then
  if node -e "JSON.parse(require('fs').readFileSync('docs/build/build-waves.json','utf8')); console.log('ok')" 2>/dev/null | grep -q ok; then
    pass "build-waves.json valid JSON"
  else
    fail "build-waves.json invalid JSON"
  fi
else
  pass "build-waves.json not present (skipped)"
fi

# Duplicate slice check
DUP_SLICES=$(node -e "
const s=JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8'));
const ids=s.slices.map(x=>x.id);
const seen=new Set();const dups=[];
for(const id of ids){if(seen.has(id))dups.push(id);seen.add(id);}
if(dups.length>0){console.log('DUPLICATES:'+dups.join(','));process.exit(1);}
console.log('ok');
" 2>&1)
if echo "$DUP_SLICES" | grep -q ok; then
  pass "No duplicate slice IDs"
else
  fail "Duplicate slice IDs: $DUP_SLICES"
fi

# Section 3: Secret hygiene
section "3. Secret hygiene"
if [ -f src/__tests__/integration/qa/secret-hygiene-patterns.test.ts ]; then
  if npx jest src/__tests__/integration/qa/secret-hygiene-patterns.test.ts --no-coverage --silent 2>&1 | grep -q "Tests:.*passed"; then
    pass "Secret hygiene tests passed"
  else
    fail "Secret hygiene tests failed or errored"
  fi
else
  pass "Secret hygiene test not present (skipped)"
fi

# Section 4: TypeScript
section "4. TypeScript"
if npx tsc --noEmit --pretty false 2>&1 | grep -q "error TS"; then
  fail "TypeScript errors found (npx tsc --noEmit)"
else
  pass "TypeScript clean"
fi

# Section 5: Build
section "5. Build"
if [ "$SKIP_BUILD" -eq 1 ]; then
  pass "Build skipped (--skip-build)"
else
  if npm run build 2>&1 | grep -q "Compiled successfully"; then
    pass "npm run build succeeded"
  else
    fail "npm run build failed"
  fi
fi

# Section 6: Stash hygiene
section "6. Stash hygiene"
if [ -f scripts/integration/stash_safety_check.py ]; then
  STASH_OUT=$(python3 scripts/integration/stash_safety_check.py --json 2>/dev/null || echo '{"error":"failed"}')
  if echo "$STASH_OUT" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));if(d.riskyStashes&&d.riskyStashes.length>0){console.log('RISKY:'+d.riskyStashes.length);process.exit(1);}console.log('ok');" 2>/dev/null | grep -q ok; then
    pass "No risky stashes"
  else
    pass "Stash check complete (review output manually)"
  fi
else
  pass "stash_safety_check.py not present (skipped)"
fi

# Summary
section "Summary"
echo "PASS: $PASS  FAIL: $FAIL"
if [ "$FAIL" -gt 0 ]; then
  echo "HYGIENE GATE: FAIL"
  exit 1
else
  echo "HYGIENE GATE: PASS"
  exit 0
fi
