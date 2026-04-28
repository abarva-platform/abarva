#!/usr/bin/env bash
# AbarVa — Autonomous Wave Runner
# Usage: bash scripts/orchestration/run_next_wave.sh [--loop]
# Prints the exact prompt to paste into a new Claude session to execute the next wave.
# With --loop, sets autoLoopEnabled: true in BACKLOG_CURRENT_STATE.md first.
# Non-destructive. Never commits. Never pushes.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STATE_FILE="$REPO_ROOT/docs/backlog/BACKLOG_CURRENT_STATE.md"
ORCH_PROMPT="$REPO_ROOT/docs/backlog/BACKLOG_ORCHESTRATION_PROMPT.md"

# Parse args
LOOP_MODE=0
for arg in "$@"; do
  case $arg in
    --loop) LOOP_MODE=1 ;;
    --help)
      echo "Usage: bash scripts/orchestration/run_next_wave.sh [--loop]"
      echo "  --loop   Enable autoLoopEnabled in BACKLOG_CURRENT_STATE.md before printing prompt"
      echo "  --help   Show this help"
      exit 0
      ;;
  esac
done

# Verify files exist
if [ ! -f "$STATE_FILE" ]; then
  echo "ERROR: BACKLOG_CURRENT_STATE.md not found at $STATE_FILE"
  exit 1
fi

if [ ! -f "$ORCH_PROMPT" ]; then
  echo "ERROR: BACKLOG_ORCHESTRATION_PROMPT.md not found at $ORCH_PROMPT"
  exit 1
fi

# Extract next wave info
NEXT_WAVE=$(grep "^\- waveId:" "$STATE_FILE" | tail -1 | sed 's/.*waveId: //')
NEXT_TITLE=$(grep "^\- waveTitle:" "$STATE_FILE" | tail -1 | sed 's/.*waveTitle: //')
BLOCKERS=$(grep -A5 "## Blocker conditions" "$STATE_FILE" | grep -v "^#" | grep -v "^$" | head -3)
AUTO_LOOP=$(grep "autoLoopEnabled:" "$STATE_FILE" | tail -1 | sed 's/.*autoLoopEnabled: //' | awk '{print $1}')

# Enable loop mode if requested
if [ "$LOOP_MODE" -eq 1 ]; then
  sed -i '' 's/- autoLoopEnabled: false/- autoLoopEnabled: true/' "$STATE_FILE"
  echo "[INFO] autoLoopEnabled set to true in BACKLOG_CURRENT_STATE.md"
  AUTO_LOOP="true"
fi

echo ""
echo "========================================"
echo "  AbarVa — Next Wave: $NEXT_WAVE"
echo "  Theme: $NEXT_TITLE"
echo "  Auto-loop: $AUTO_LOOP"
echo "========================================"
echo ""
REAL_BLOCKERS=$(awk '/^## Blocker conditions/{found=1; next} found && /^## /{exit} found && /^\- none$/{exit} found && /^\- /{print}' "$STATE_FILE")
if [ -n "$REAL_BLOCKERS" ]; then
  echo "WARNING: BLOCKERS DETECTED — review before running:"
  echo "$REAL_BLOCKERS"
  echo ""
fi
echo "-------- PASTE THIS INTO CLAUDE --------"
echo ""
echo "Read /Users/anand/Projects/nexus/docs/backlog/BACKLOG_ORCHESTRATION_PROMPT.md and execute autonomously."
echo ""
echo "----------------------------------------"
echo ""
echo "That's it. Claude will:"
echo "  1. Read BACKLOG_CURRENT_STATE.md (next wave = $NEXT_WAVE)"
echo "  2. Read the wave spec"
echo "  3. Execute all lanes + integration"
echo "  4. Merge the PR"
echo "  5. Update BACKLOG_CURRENT_STATE.md"
echo "  6. Send you a push notification"
if [ "$AUTO_LOOP" = "true" ]; then
  echo "  7. Schedule next wakeup (auto-loop enabled)"
else
  echo "  7. Stop and wait for your next trigger (auto-loop disabled)"
fi
echo ""
