#!/usr/bin/env bash
# Hygiene gate reporting — where a finding goes once the gate has made it.
#
# The gate gained a third verdict so that a real finding which must not block
# could still be reported as a finding. It then printed that verdict to
# stdout and nowhere else, and the workflow consulted only the exit status.
# A warning therefore existed in the raw job log and in no place a person
# looks: not on the pull request, not in the run summary, and not in the
# gate's own top line, which said "HYGIENE GATE: PASS" whether or not
# anything had been found.
#
# This file is sourced by the gate so the same reporting can be exercised
# directly, rather than asserted by reading the gate's source text.
#
# Where a warning surfaces is not invented here. The repository already
# answers it: eleven workflows write to $GITHUB_STEP_SUMMARY, and several
# emit ::warning:: annotations. This follows that convention instead of
# adding a fourth one.
#
# Warnings are NOT promoted to failures. The reason each one warns is
# written beside it in the gate, and the exit status is unchanged.

# Findings that did not block, in the order they were made.
HYGIENE_WARNINGS=()

# Record a non-blocking finding.
#
# Prints the line the gate has always printed, keeps the count the summary
# reads, and — only under GitHub Actions — emits an annotation so the finding
# reaches the pull request rather than page 400 of a log.
hygiene_warn() {
  local message="$1"
  echo "[WARN] ${message}"
  HYGIENE_WARNINGS+=("${message}")
  if [ -n "${GITHUB_ACTIONS:-}" ]; then
    # Annotations are one line: a literal newline would start a second,
    # unrelated command, so they are escaped as Actions specifies.
    local escaped="${message//$'\n'/%0A}"
    echo "::warning title=Hygiene gate::${escaped}"
  fi
}

# The gate's verdict line.
#
# "PASS" now means nothing was found. A run with findings says so, because a
# top line that reads the same either way is the reason the third verdict was
# invisible in the first place.
hygiene_verdict_line() {
  local fail_count="$1" warn_count="$2"
  if [ "${fail_count}" -gt 0 ]; then
    echo "HYGIENE GATE: FAIL"
  elif [ "${warn_count}" -gt 0 ]; then
    echo "HYGIENE GATE: PASS WITH WARNINGS (${warn_count})"
  else
    echo "HYGIENE GATE: PASS"
  fi
}

# Write the run summary where a person will see it.
#
# A no-op outside GitHub Actions, so running the gate locally is unchanged.
hygiene_write_step_summary() {
  local pass_count="$1" warn_count="$2" fail_count="$3"
  local target="${GITHUB_STEP_SUMMARY:-}"
  [ -n "${target}" ] || return 0

  {
    echo "## Hygiene gate"
    echo ""
    echo "| verdict | count |"
    echo "|---|---|"
    echo "| pass | ${pass_count} |"
    echo "| warn | ${warn_count} |"
    echo "| fail | ${fail_count} |"
    if [ "${warn_count}" -gt 0 ]; then
      echo ""
      echo "### Findings that did not block"
      echo ""
      local finding
      for finding in "${HYGIENE_WARNINGS[@]}"; do
        echo "- ${finding}"
      done
      echo ""
      echo "These do not fail the gate. The reason each one warns is recorded"
      echo "beside it in \`scripts/integration/hygiene_gate.sh\`."
    fi
  } >> "${target}"
}
