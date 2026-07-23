#!/usr/bin/env bash
# Workstation-side collector for the Claude Code half of AI spend.
#
# Runs on the Mac (not CI): ~/.claude/projects only exists where Claude Code
# actually runs. Writes a dated JSON snapshot and, if Resend env vars are
# present, emails the combined digest.
#
# Manual:   ./scripts/ai-cost/collect-local.sh
# Scheduled: see scripts/ai-cost/README.md for the launchd plist.

set -euo pipefail

cd "$(dirname "$0")/../.."

DAYS="${AI_COST_LOOKBACK_DAYS:-30}"
TODAY="$(date -u +%F)"
YESTERDAY="$(date -u -v-1d +%F 2>/dev/null || date -u -d 'yesterday' +%F)"
OUT_DIR="reports/ai-cost/daily"

mkdir -p "$OUT_DIR"

node scripts/ai-cost/claude-code-usage.mjs --days "$DAYS" --json \
  > "$OUT_DIR/${TODAY}-claude-code.json"

echo "wrote $OUT_DIR/${TODAY}-claude-code.json"

# The Anthropic half is optional here — CI collects it daily. If an admin key
# is present locally, pull it too so a manual run gives the complete picture.
ANTHROPIC_ARG=()
if [ -n "${ANTHROPIC_ADMIN_KEY:-}" ]; then
  node scripts/ai-cost/anthropic-cost-report.mjs --days "$DAYS" \
    --out "$OUT_DIR" > /dev/null
  ANTHROPIC_ARG=(--anthropic "$OUT_DIR/${TODAY}-anthropic.json")
fi

SEND_ARG=()
if [ -n "${RESEND_API_KEY:-}" ] && [ -n "${AI_COST_DIGEST_TO:-}" ]; then
  SEND_ARG=(--send)
fi

if [ "${#ANTHROPIC_ARG[@]}" -gt 0 ] && [ "${#SEND_ARG[@]}" -gt 0 ]; then
  node scripts/ai-cost/render-digest.mjs \
    --claude-code "$OUT_DIR/${TODAY}-claude-code.json" \
    "${ANTHROPIC_ARG[@]}" \
    --day "$YESTERDAY" \
    --out "$OUT_DIR/${TODAY}-digest.html" \
    "${SEND_ARG[@]}"
elif [ "${#ANTHROPIC_ARG[@]}" -gt 0 ]; then
  node scripts/ai-cost/render-digest.mjs \
    --claude-code "$OUT_DIR/${TODAY}-claude-code.json" \
    "${ANTHROPIC_ARG[@]}" \
    --day "$YESTERDAY" \
    --out "$OUT_DIR/${TODAY}-digest.html"
elif [ "${#SEND_ARG[@]}" -gt 0 ]; then
  node scripts/ai-cost/render-digest.mjs \
    --claude-code "$OUT_DIR/${TODAY}-claude-code.json" \
    --day "$YESTERDAY" \
    --out "$OUT_DIR/${TODAY}-digest.html" \
    "${SEND_ARG[@]}"
else
  node scripts/ai-cost/render-digest.mjs \
    --claude-code "$OUT_DIR/${TODAY}-claude-code.json" \
    --day "$YESTERDAY" \
    --out "$OUT_DIR/${TODAY}-digest.html"
fi
