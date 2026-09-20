#!/usr/bin/env bash
# QA20 — Mandatory Hygiene Gate Runner
# Usage: bash scripts/integration/hygiene_gate.sh [--skip-build] [--help]
# Non-destructive. Never deletes files, never pops stashes, never pushes.

SKIP_BUILD=0
PASS=0
FAIL=0
WARN=0
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

# Where a finding goes once this gate has made it. Sourced rather than inlined
# so the reporting can be exercised by running it, instead of by reading this
# file's source text.
#
# Missing is fatal. There is no `set -e` here, so a failed `.` would print an
# error and carry on -- and the gate would then run every check, find things,
# and report none of them, while still exiting 0. A gate that cannot report
# is worse than a gate that did not run, because its exit status still reads
# as assurance.
HYGIENE_REPORT="$REPO_ROOT/scripts/integration/hygiene_gate_report.sh"
if [ ! -f "$HYGIENE_REPORT" ]; then
  echo "[FAIL] hygiene_gate_report.sh not found at $HYGIENE_REPORT"
  echo "HYGIENE GATE: FAIL"
  exit 1
fi
# shellcheck source=scripts/integration/hygiene_gate_report.sh
. "$HYGIENE_REPORT"

pass() { echo "[PASS] $1"; PASS=$((PASS+1)); }
fail() { echo "[FAIL] $1"; FAIL=$((FAIL+1)); }
# A finding that is real but must not block the gate still has to be reported as
# a finding. Before T-071 the only alternative to fail() was pass(), so a check
# that found something printed the same line as a check that found nothing.
#
# Printing it was not enough: the workflow read only the exit status, so the
# verdict reached the raw log and nowhere a person looks. hygiene_warn also
# annotates the pull request under Actions, and the summary lists every
# finding. Warnings are still not failures -- the exit status is unchanged.
warn() { hygiene_warn "$1"; WARN=$((WARN+1)); }
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

# Carve-out: conflict markers inside fenced code blocks in *.md files are
# acceptable per the BUILD_WAVE_PROGRESS_PROTOCOL (documentation examples).
# Filter out any lines reported from .md files.
CONFLICT_COUNT=$(git grep -n "^<<<<<<<\|^=======\|^>>>>>>>" -- . 2>/dev/null | grep -v "^Binary\|#.*<<<<\|#.*>>>>>>>\|#.*=======\|\.md:" | wc -l | tr -d ' ')
if [ "$CONFLICT_COUNT" -gt 0 ]; then
  fail "Conflict markers found ($CONFLICT_COUNT lines)"
  git grep -n "^<<<<<<<\|^=======\|^>>>>>>>" -- . 2>/dev/null | grep -v "Binary\|\.md:" | head -10
else
  pass "No conflict markers"
fi

# Section 2: JSON manifest hygiene
#
# T-072: these three are judged by node's exit status. The previous form printed
# `ok` on success and piped it into `grep -q ok` with stderr discarded, which was
# correct by direction rather than by construction - the only thing that could
# reach the pipe was the literal the success path printed. Nothing was wrong with
# them; the idiom is gone because the same construction below WAS wrong, and one
# reading rule for the file is worth more than four checks each needing an
# argument for why its own version is safe.
section "2. JSON manifest hygiene"
if node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8'))" 2>/dev/null; then
  pass "build-slices.json valid JSON"
else
  fail "build-slices.json invalid JSON"
fi

if node -e "JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8'))" 2>/dev/null; then
  pass "production-readiness.json valid JSON"
else
  fail "production-readiness.json invalid JSON"
fi

# A declared subject that is absent is an unanswered question, not a satisfied
# one. The previous "not present (skipped)" branch printed pass(), so deleting
# the manifest made this check green - the vacuity class recorded in item 47.
if [ -f docs/build/build-waves.json ]; then
  if node -e "JSON.parse(require('fs').readFileSync('docs/build/build-waves.json','utf8'))" 2>/dev/null; then
    pass "build-waves.json valid JSON"
  else
    fail "build-waves.json invalid JSON"
  fi
else
  fail "build-waves.json not present (declared subject is missing)"
fi

# Duplicate slice check
#
# T-072: this one could not fail for a whole class of subject. It captured stderr
# with 2>&1, threw away the process.exit(1) its own program uses to report
# duplicates, and searched the combined output for the substring `ok` - so a
# duplicated slice id containing those two letters was printed in the failure
# message and read straight back as the success token. Measured: two slices both
# named `booking-flow` printed "[PASS] No duplicate slice IDs".
#
# Every id in the manifest today is `S<n>`, so nothing was being missed yet. A
# check that is correct only because no subject has been named with the wrong
# letters is not a check, which is the same finding as T-071.
#
# The verdict is now the exit status, which no slice id can spell. The program
# reports on stderr so its diagnosis is still captured for the failure line.
if DUP_SLICES=$(node -e "
const s=JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8'));
const ids=s.slices.map(x=>x.id);
const seen=new Set();const dups=[];
for(const id of ids){if(seen.has(id))dups.push(id);seen.add(id);}
if(dups.length>0){console.error('DUPLICATES:'+dups.join(','));process.exit(1);}
" 2>&1); then
  pass "No duplicate slice IDs"
else
  fail "Duplicate slice IDs: $DUP_SLICES"
fi

# Section 3: Secret hygiene
section "3. Secret hygiene"
# Judged by jest's exit status. The previous grep for "Tests:.*passed" is
# satisfied by "Tests: 8 failed, 53 passed, 61 total", so a partially failing
# secret-hygiene run reported [PASS]. A disclosure check is the last one that
# should be able to pass while red.
#
# The suite path stays a literal on the invocation line. Holding it in a shell
# variable reads identically to a human and is opaque to the repository's
# coverage resolver, which reports an invocation it cannot resolve as an upper
# bound on uncovered tests - so tidying this into a variable silently degrades
# the answer to "which directory gets wired next". Measured: it moved
# `unresolved Jest invocations` from 0 to 2.
if [ -f src/__tests__/integration/qa/secret-hygiene-patterns.test.ts ]; then
  SECRET_LOG="$(mktemp)"
  if npx jest src/__tests__/integration/qa/secret-hygiene-patterns.test.ts --no-coverage --silent >"$SECRET_LOG" 2>&1; then
    pass "Secret hygiene tests passed"
  else
    SECRET_EXIT=$?
    fail "Secret hygiene tests did not succeed (exit $SECRET_EXIT)"
    tail -40 "$SECRET_LOG"
  fi
  rm -f "$SECRET_LOG"
else
  fail "Secret hygiene test not present (declared subject is missing)"
fi

# Section 4: TypeScript
section "4. TypeScript"
# Judged by exit status, at the documented heap. Greping the output for
# "error TS" reported [PASS] on a crash: `npx tsc --noEmit` exits 134 with a V8
# out-of-memory trace and emits no diagnostic at all, so the grep found nothing
# and the gate called it clean. The heap option is what stops the crash; the
# exit-code check is what stops a crash from reading as success if it returns.
TSC_LOG="$(mktemp)"
TSC_NODE_OPTIONS="${NODE_OPTIONS:-}"
case " $TSC_NODE_OPTIONS " in
  *" --max-old-space-size="* | *" --max_old_space_size="*) ;;
  *) TSC_NODE_OPTIONS="${TSC_NODE_OPTIONS:+$TSC_NODE_OPTIONS }--max-old-space-size=6144" ;;
esac
if NODE_OPTIONS="$TSC_NODE_OPTIONS" npx tsc --noEmit --pretty false >"$TSC_LOG" 2>&1; then
  pass "TypeScript clean"
else
  TSC_EXIT=$?
  fail "TypeScript check did not succeed (npx tsc --noEmit exit $TSC_EXIT)"
  tail -60 "$TSC_LOG"
fi
rm -f "$TSC_LOG"

# Section 5: Build
section "5. Build"
if [ "$SKIP_BUILD" -eq 1 ]; then
  pass "Build skipped (--skip-build)"
else
  BUILD_LOG="$(mktemp)"
  BUILD_NODE_OPTIONS="${NODE_OPTIONS:-}"
  case " $BUILD_NODE_OPTIONS " in
    *" --max-old-space-size="* | *" --max_old_space_size="*) ;;
    # The Next.js build OOMs at a 4096 MB heap (observed: heap death at ~4080 MB),
    # which intermittently fails the gate and blocks every PR's merge. ubuntu-latest
    # runners have 16 GB RAM, so give the build an 8 GB heap with ample headroom.
    *) BUILD_NODE_OPTIONS="${BUILD_NODE_OPTIONS:+$BUILD_NODE_OPTIONS }--max-old-space-size=8192" ;;
  esac
  if NODE_OPTIONS="$BUILD_NODE_OPTIONS" npm run build >"$BUILD_LOG" 2>&1; then
    pass "npm run build succeeded"
  else
    fail "npm run build failed"
    echo "--- npm run build output (first 120 lines) ---"
    sed -n '1,120p' "$BUILD_LOG"
    echo "--- npm run build output (last 80 lines) ---"
    tail -80 "$BUILD_LOG"
  fi
  rm -f "$BUILD_LOG"
fi

# Section 6: Stash hygiene
section "6. Stash hygiene"
# Three outcomes, because the two this had were both passes: a risky stash and
# an unreadable report each printed pass(), so the gate claimed "No risky
# stashes" in the two cases where it had not established that.
#
# A finding warns rather than fails on purpose: the stash stack is machine-local
# and shared between worktrees, so another agent's entry must not block this
# repository's pull requests, and it is always empty on a CI runner. Being
# unable to read the report is different - that is an unanswered question and it
# fails, the same rule the manifest and secret-hygiene subjects follow above.
# Three outcomes, because the two this had were both passes: a risky stash and
# an unreadable report each printed pass(), so the gate claimed "No risky
# stashes" in the two cases where it had not established that.
#
# It also read a field name stash_safety_check.py has never emitted, so the
# emptiness test on it was always false and this check printed "No risky
# stashes" unconditionally - measured on a tree where the script reported 92
# stashes from other branches and isSafeToIntegrate: false. The contract below
# names the fields the script actually produces, and an absent field fails
# rather than reading as clean. A behavioural case runs the real script and
# holds every field this section reads to the report's actual keys.
#
# A finding warns rather than fails on purpose: the stash stack is machine-local
# and shared between worktrees, so another agent's entry must not block this
# repository's pull requests, and it is empty on a CI runner. Being unable to
# read the report is different - that is an unanswered question and it fails,
# the same rule the manifest and secret-hygiene subjects follow above.
if [ -f scripts/integration/stash_safety_check.py ]; then
  STASH_OUT=$(python3 scripts/integration/stash_safety_check.py --json 2>/dev/null || echo 'STASH_SCRIPT_FAILED')
  STASH_VERDICT=$(echo "$STASH_OUT" | node -e "
let raw = '';
try { raw = require('fs').readFileSync('/dev/stdin', 'utf8'); } catch { console.log('unreadable'); process.exit(0); }
let d;
try { d = JSON.parse(raw); } catch { console.log('unreadable'); process.exit(0); }
if (!d || typeof d !== 'object' || typeof d.isSafeToIntegrate !== 'boolean') {
  console.log('unreadable');
  process.exit(0);
}
if (d.isSafeToIntegrate) { console.log('clean'); process.exit(0); }
const n = typeof d.stashesFromOtherBranches === 'number' ? d.stashesFromOtherBranches : '?';
console.log('risky:' + n);
" 2>/dev/null || echo 'unreadable')
  case "$STASH_VERDICT" in
    clean) pass "No risky stashes" ;;
    risky:*) warn "Stash stack is not safe to integrate (${STASH_VERDICT#risky:} from other branches) - do not run git stash pop" ;;
    *) fail "Stash safety report unreadable (could not establish stash state)" ;;
  esac
else
  fail "stash_safety_check.py not present (declared subject is missing)"
fi

# Summary
section "Summary"
echo "PASS: $PASS  WARN: $WARN  FAIL: $FAIL"
hygiene_write_step_summary "$PASS" "$WARN" "$FAIL"
hygiene_verdict_line "$FAIL" "$WARN"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
