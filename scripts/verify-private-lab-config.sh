#!/usr/bin/env bash
# =====================================================================
# CLOUD4 - verify-private-lab-config.sh
# =====================================================================
# Deterministic shape check for the local private deployment lab
# config. Does NOT call docker. Does NOT call any cloud API. Does NOT
# read any secret.
#
# Exit 0 on success and print `[CLOUD4] private lab config OK`.
# Exit 1 only if the config is genuinely broken.
# =====================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${REPO_ROOT}/docker-compose.private-lab.yml"
ENV_EXAMPLE="${REPO_ROOT}/.env.private-lab.example"

fail() {
  echo "[CLOUD4] FAIL: $1" >&2
  exit 1
}

# ---------------------------------------------------------------------
# 1. Files must exist.
# ---------------------------------------------------------------------
[ -f "${COMPOSE_FILE}" ] || fail "missing docker-compose.private-lab.yml at ${COMPOSE_FILE}"
[ -f "${ENV_EXAMPLE}" ] || fail "missing .env.private-lab.example at ${ENV_EXAMPLE}"

# ---------------------------------------------------------------------
# 2. Compose file must declare the four expected services as keys
#    under the top-level `services:` block. We anchor on two-space
#    indentation followed by the service name and a colon to avoid
#    matching service references inside comments or env values.
# ---------------------------------------------------------------------
for svc in app postgres minio model-gateway-stub; do
  if ! grep -Eq "^  ${svc}:" "${COMPOSE_FILE}"; then
    fail "compose file missing service: ${svc}"
  fi
done

# Also require the canonical lab marker so accidental edits stand out.
grep -q "abarva-private-lab" "${COMPOSE_FILE}" \
  || fail "compose file missing abarva-private-lab network marker"

# Reject promotion / production language in the compose file.
if grep -Eqi "production_ready|production-ready|\"production\"" "${COMPOSE_FILE}"; then
  fail "compose file references production-ready posture (lab only)"
fi

# ---------------------------------------------------------------------
# 3. Env example must declare the expected keys.
# ---------------------------------------------------------------------
required_keys=(
  POSTGRES_USER
  POSTGRES_PASSWORD
  POSTGRES_DB
  MINIO_ROOT_USER
  MINIO_ROOT_PASSWORD
  DATABASE_URL
  S3_ENDPOINT
  MODEL_GATEWAY_URL
)
for key in "${required_keys[@]}"; do
  if ! grep -Eq "^${key}=" "${ENV_EXAMPLE}"; then
    fail "env example missing key: ${key}"
  fi
done

# ---------------------------------------------------------------------
# 4. No real-secret patterns may appear in either file.
#    - sk- prefix (OpenAI / Anthropic style).
#    - ghp_ prefix (GitHub PAT style).
#    - very long opaque tokens (>=40 contiguous A-Za-z0-9 _-).
#    The placeholder values in .env.private-lab.example are short,
#    underscored, and human-readable and do NOT trip these checks.
# ---------------------------------------------------------------------
for f in "${COMPOSE_FILE}" "${ENV_EXAMPLE}"; do
  if grep -Eq "(^|[^A-Za-z0-9])sk-[A-Za-z0-9]{20,}" "${f}"; then
    fail "real-looking sk- secret pattern detected in ${f}"
  fi
  if grep -Eq "ghp_[A-Za-z0-9]{20,}" "${f}"; then
    fail "real-looking ghp_ secret pattern detected in ${f}"
  fi
  # Long opaque token: any contiguous run of >=40 [A-Za-z0-9] chars
  # that contains BOTH a letter and a digit. Rules out underscored
  # or dashed comment dividers, all-letter words, and pure numbers.
  # Real provider keys (sk-*, OAuth tokens, etc.) mix letters+digits.
  if awk '
    {
      while (match($0, /[A-Za-z0-9]{40,}/)) {
        tok = substr($0, RSTART, RLENGTH);
        if (tok ~ /[A-Za-z]/ && tok ~ /[0-9]/) { found = 1; exit }
        $0 = substr($0, RSTART + RLENGTH);
      }
    }
    END { exit found ? 0 : 1 }
  ' "${f}"; then
    fail "long opaque token pattern detected in ${f} (>=40 alnum chars, mixed letter+digit)"
  fi
done

# ---------------------------------------------------------------------
# 5. Reject real model provider hostnames in the env example.
# ---------------------------------------------------------------------
if grep -Eqi "openai\\.com|anthropic\\.com|azure\\.com|googleapis\\.com|cohere\\.com" "${ENV_EXAMPLE}"; then
  fail "env example references a real model provider hostname"
fi

echo "[CLOUD4] private lab config OK"
exit 0
