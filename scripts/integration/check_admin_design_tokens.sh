#!/usr/bin/env bash
# ADMIN7 — Admin design token audit
# Fails CI if any banned hex literal appears in the admin tree.
# Run as part of the hygiene gate.

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

BANNED=(
  "#14B8A6"
  "#0E9F8C"
  "#0D9488"
  "#06B6D4"
  "#7C3AED"
  "#A855F7"
  "#9333EA"
  "#D946EF"
  "#EC4899"
)

ADMIN_TREE=(
  "src/components/admin"
  "src/lib/admin"
  "src/app/(maestro)/admin"
)

VIOLATIONS=0
echo "=== ADMIN7 — Admin design token audit ==="

for dir in "${ADMIN_TREE[@]}"; do
  if [ ! -d "$dir" ]; then
    continue
  fi
  for token in "${BANNED[@]}"; do
    HITS=$(grep -ril "$token" "$dir" 2>/dev/null || true)
    if [ -n "$HITS" ]; then
      echo "[FAIL] Banned token $token found in:"
      echo "$HITS" | sed 's/^/  /'
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  done
done

if [ "$VIOLATIONS" -eq 0 ]; then
  echo "[PASS] Admin tree is free of banned hex tokens"
  exit 0
else
  echo ""
  echo "ADMIN7 audit FAILED — $VIOLATIONS banned token violation(s)"
  exit 1
fi
