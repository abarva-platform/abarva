#!/usr/bin/env bash
# SEC-P0 cross-tenant probe suite · A1 deliverable
# ──────────────────────────────────────────────────────────────────────
# Asserts every cross-tenant API route returns 403 forbidden_cross_tenant
# when a signed-in caller from tenant A passes a clientId / tenantKey
# belonging to tenant B.
#
# Locks the 8 SEC-P0 routes hardened in the 2026-05-13 audit arc
# (PRs #1923–#1933). See tests/security/SEC-P0-cross-tenant-probes.md
# for the full reading guide.
#
# Required env:
#   ABARVA_PROBE_BASE_URL          e.g. https://staging.abarva.ai
#   ABARVA_PROBE_OTHER_TENANT_ID   client UUID for tenant B (the one we expect 403 from)
#
# And one of:
#   ABARVA_PROBE_SESSION           __session cookie value for tenant A (e.g. Apex CIO)
#   ABARVA_PROBE_COOKIE_HEADER     full browser Cookie header for tenant A
#                                  (needed for Azure/Clerk host-scoped cookies)
#
# Optional env:
#   ABARVA_PROBE_OTHER_TENANT_KEY  string key for tenant B (default: meridian)
#   ABARVA_PROBE_KNOWN_OTHER_TURN  a turn UUID known to belong to tenant B (for SEC-P0-7)
#   ABARVA_PROBE_VERBOSE           1 to dump full request/response payloads
#
# Exit code:
#   0  all probes passed
#   1  one or more probes failed → P0 incident
#   2  configuration / env error

set -uo pipefail

BASE_URL="${ABARVA_PROBE_BASE_URL:-}"
SESSION="${ABARVA_PROBE_SESSION:-}"
COOKIE_HEADER="${ABARVA_PROBE_COOKIE_HEADER:-}"
OTHER_TENANT_ID="${ABARVA_PROBE_OTHER_TENANT_ID:-}"
OTHER_TENANT_KEY="${ABARVA_PROBE_OTHER_TENANT_KEY:-meridian}"
KNOWN_OTHER_TURN="${ABARVA_PROBE_KNOWN_OTHER_TURN:-00000000-0000-0000-0000-000000000000}"
VERBOSE="${ABARVA_PROBE_VERBOSE:-0}"

if [[ -z "$BASE_URL" || -z "$OTHER_TENANT_ID" || ( -z "$SESSION" && -z "$COOKIE_HEADER" ) ]]; then
  echo "❌ Missing required env: ABARVA_PROBE_BASE_URL, ABARVA_PROBE_OTHER_TENANT_ID, and one of ABARVA_PROBE_SESSION or ABARVA_PROBE_COOKIE_HEADER" >&2
  exit 2
fi

PASS=0
FAIL=0
RESULTS=()

run_probe() {
  local id="$1"
  local label="$2"
  local expected_status="$3"  # e.g. "403" or "403|404" or "400|403"
  local expected_body_match="$4"  # regex or empty string for "no body check"
  shift 4
  # remaining args are curl options

  local tmp_body
  tmp_body=$(mktemp)
  local actual_status
  local cookie_args=()
  if [[ -n "$COOKIE_HEADER" ]]; then
    cookie_args=(-H "Cookie: $COOKIE_HEADER")
  else
    cookie_args=(-b "__session=$SESSION")
  fi

  actual_status=$(curl -sS -o "$tmp_body" -w "%{http_code}" \
    "${cookie_args[@]}" \
    "$@") || actual_status="000"

  local body
  body=$(cat "$tmp_body")
  rm -f "$tmp_body"

  if [[ "$VERBOSE" == "1" ]]; then
    echo "  ── $id ──"
    echo "  HTTP $actual_status"
    echo "  body: $body"
  fi

  local status_ok="no"
  if [[ "$actual_status" =~ ^($expected_status)$ ]]; then
    status_ok="yes"
  fi

  local body_ok="yes"
  if [[ -n "$expected_body_match" ]]; then
    if ! echo "$body" | grep -qE "$expected_body_match"; then
      body_ok="no"
    fi
  fi

  if [[ "$status_ok" == "yes" && "$body_ok" == "yes" ]]; then
    RESULTS+=("✅ $id  $label  → $actual_status")
    PASS=$((PASS+1))
  else
    RESULTS+=("❌ $id  $label  → HTTP $actual_status (expected $expected_status${expected_body_match:+, body match $expected_body_match})")
    FAIL=$((FAIL+1))
  fi
}

echo "SEC-P0 cross-tenant probe suite"
echo "Target:  $BASE_URL"
echo "Tenant B: $OTHER_TENANT_KEY ($OTHER_TENANT_ID)"
echo "─────────────────────────────────────────"

# ───────────────────────────────────────────────────────────────────────
# SEC-P0-1: POST /api/tower/seed-demo with another tenant's clientId
# ───────────────────────────────────────────────────────────────────────
run_probe "SEC-P0-1" \
  "POST   /api/tower/seed-demo            " \
  "403" "forbidden_cross_tenant" \
  -X POST "$BASE_URL/api/tower/seed-demo" \
  -H "Content-Type: application/json" \
  --data "{\"clientId\":\"$OTHER_TENANT_ID\",\"industry\":\"HEALTHCARE_IDN\",\"orgSize\":\"mid\",\"aiMaturity\":\"scaling\"}"

# ───────────────────────────────────────────────────────────────────────
# SEC-P0-2: DELETE /api/tower/seed-demo for another tenant
# ───────────────────────────────────────────────────────────────────────
run_probe "SEC-P0-2" \
  "DELETE /api/tower/seed-demo            " \
  "403" "forbidden_cross_tenant" \
  -X DELETE "$BASE_URL/api/tower/seed-demo?clientId=$OTHER_TENANT_ID"

# ───────────────────────────────────────────────────────────────────────
# SEC-P0-3: POST /api/data/upload with another tenant's clientId
# ───────────────────────────────────────────────────────────────────────
run_probe "SEC-P0-3" \
  "POST   /api/data/upload                " \
  "403" "forbidden_cross_tenant" \
  -X POST "$BASE_URL/api/data/upload" \
  -F "clientId=$OTHER_TENANT_ID" \
  -F "file=@/dev/null;filename=probe.txt"

# ───────────────────────────────────────────────────────────────────────
# SEC-P0-4: POST /api/setup/initiatives with another tenant's tenantKey
# ───────────────────────────────────────────────────────────────────────
run_probe "SEC-P0-4" \
  "POST   /api/setup/initiatives          " \
  "403" "forbidden_cross_tenant" \
  -X POST "$BASE_URL/api/setup/initiatives?tenantKey=$OTHER_TENANT_KEY" \
  -H "Content-Type: application/json" \
  --data "{\"tenantKey\":\"$OTHER_TENANT_KEY\",\"initiatives\":[{\"initiativeId\":\"probe\",\"name\":\"x\",\"status\":\"backlog\",\"archetype\":\"productivity\"}]}"

# ───────────────────────────────────────────────────────────────────────
# SEC-P0-5: GET /api/setup/initiatives reading another tenant
# ───────────────────────────────────────────────────────────────────────
run_probe "SEC-P0-5" \
  "GET    /api/setup/initiatives          " \
  "403" "forbidden_cross_tenant" \
  -X GET "$BASE_URL/api/setup/initiatives?tenantKey=$OTHER_TENANT_KEY&financialVisibility=1"

# ───────────────────────────────────────────────────────────────────────
# SEC-P0-6: POST /api/admin/upload-dataset with another tenant's clientId
# ───────────────────────────────────────────────────────────────────────
run_probe "SEC-P0-6" \
  "POST   /api/admin/upload-dataset       " \
  "403" "forbidden_cross_tenant" \
  -X POST "$BASE_URL/api/admin/upload-dataset" \
  -F "clientId=$OTHER_TENANT_ID" \
  -F "documentName=probe" \
  -F "file=@/dev/null;filename=probe.csv"

# ───────────────────────────────────────────────────────────────────────
# SEC-P0-7: GET /api/turn/<other-tenant's-turn>/trace
# Expected: 404 (the engagements.client_id join refuses the row)
# ───────────────────────────────────────────────────────────────────────
run_probe "SEC-P0-7" \
  "GET    /api/turn/<other>/trace         " \
  "404" "" \
  -X GET "$BASE_URL/api/turn/$KNOWN_OTHER_TURN/trace"

# ───────────────────────────────────────────────────────────────────────
# SEC-P0-8: POST /api/intelligence/query — generated Cypher must reference
# $callerClientId. A generic question that doesn't naturally scope by tenant
# should be refused with 400 "missing tenant scope".
# ───────────────────────────────────────────────────────────────────────
run_probe "SEC-P0-8" \
  "POST   /api/intelligence/query         " \
  "400|403" "missing tenant scope|forbidden_cross_tenant" \
  -X POST "$BASE_URL/api/intelligence/query" \
  -H "Content-Type: application/json" \
  --data '{"query":"list every GenomePattern"}'

# ───────────────────────────────────────────────────────────────────────
# Report
# ───────────────────────────────────────────────────────────────────────
echo ""
for line in "${RESULTS[@]}"; do
  echo "$line"
done
echo ""
echo "─────────────────────────────────────────"
echo "Result: $PASS passed, $FAIL failed"

if [[ "$FAIL" -gt 0 ]]; then
  echo ""
  echo "❌ One or more probes failed. This is a P0 incident."
  echo "   Page the founder. Stop any pilot deployment in progress."
  echo "   See tests/security/SEC-P0-cross-tenant-probes.md for the reading guide."
  exit 1
fi

echo "✅ All probes passed. Cross-tenant isolation holding."
exit 0
