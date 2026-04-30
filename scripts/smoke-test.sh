#!/usr/bin/env bash
# QA31 — Production Smoke Test
#
# Verifies that all known production routes return 200.
# Usage:
#   ./scripts/smoke-test.sh [BASE_URL]
#
# BASE_URL defaults to https://nexus-vert-kappa.vercel.app
# Set SMOKE_BASE_URL environment variable to override.
#
# Exit code:
#   0 — all routes passed
#   1 — one or more routes failed

set -euo pipefail

BASE_URL="${1:-${SMOKE_BASE_URL:-https://nexus-vert-kappa.vercel.app}}"

ROUTES=(
  "/"
  "/tenant/apex-retail/programs"
  "/tenant/apex-retail/programs/apex-cdp-2026"
  "/tenant/apex-retail/intelligence"
  "/tenant/apex-retail/tower"
  "/tenant/meridian/programs"
  "/tenant/meridian/intelligence"
  "/admin"
  "/admin/architecture"
  "/admin/production-readiness"
  "/admin/setup"
  "/admin/data"
  "/admin/users"
  "/admin/agents"
  "/admin/build"
)

PASSED=0
FAILED=0
FAILED_ROUTES=()

echo "=== AbarVa Production Smoke Test ==="
echo "Base URL: ${BASE_URL}"
echo "Routes to test: ${#ROUTES[@]}"
echo ""

for route in "${ROUTES[@]}"; do
  url="${BASE_URL}${route}"
  # Follow redirects (-L), silent (-s), output status code only (-o /dev/null -w "%{http_code}")
  # Timeout after 30 seconds (--max-time 30)
  status=$(curl -L -s -o /dev/null -w "%{http_code}" --max-time 30 "${url}" 2>/dev/null || echo "000")

  if [[ "${status}" == "200" ]]; then
    echo "  PASS  ${route}  (${status})"
    PASSED=$((PASSED + 1))
  else
    echo "  FAIL  ${route}  (${status})"
    FAILED=$((FAILED + 1))
    FAILED_ROUTES+=("${route}")
  fi
done

echo ""
echo "Results: ${PASSED} passed, ${FAILED} failed"

if [[ ${FAILED} -gt 0 ]]; then
  echo ""
  echo "Failed routes:"
  for route in "${FAILED_ROUTES[@]}"; do
    echo "  - ${route}"
  done
  exit 1
fi

echo "All ${PASSED} routes returned 200."
exit 0
