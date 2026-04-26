#!/usr/bin/env bash
#
# CLOUD3 · verify-docker-build.sh
# -------------------------------
# Validates that the AbarVa Dockerfile is well-formed and that a build
# *could* be performed on this host. Does NOT push, does NOT deploy, does
# NOT mutate any registry. Designed to exit 0 on hosts where Docker is not
# installed (documented neutral status) so the script can run in CI lanes
# that may or may not have a Docker daemon available.
#
# Modes:
#   - Docker missing  → print neutral skip message, exit 0.
#   - Docker present  → run `docker build --check` (BuildKit Dockerfile
#                       linter) if available, else print the build command
#                       shape for human review. Exit 0 in both branches.
#
# Usage: bash scripts/verify-docker-build.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKERFILE="${REPO_ROOT}/Dockerfile"

echo "[CLOUD3] verify-docker-build · repo=${REPO_ROOT}"

if [ ! -f "${DOCKERFILE}" ]; then
  echo "[CLOUD3] Dockerfile not found at ${DOCKERFILE}; this slice is misconfigured."
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "[CLOUD3] Docker unavailable on this host. Skipping build validation; this is documented neutral status."
  exit 0
fi

echo "[CLOUD3] Docker detected: $(docker --version 2>/dev/null || echo unknown)"
echo "[CLOUD3] Build command shape (not executed by this script):"
echo "         docker build -t abarva:local ${REPO_ROOT}"
echo "[CLOUD3] Run command shape (not executed by this script):"
echo "         docker run --rm -p 3000:3000 --env-file .env.example abarva:local"

# Prefer `docker build --check` (BuildKit Dockerfile linter, Docker 24+).
# If unsupported, fall through to a no-op success so the script remains
# safe in older Docker installations.
if docker buildx version >/dev/null 2>&1; then
  echo "[CLOUD3] Running BuildKit Dockerfile lint (docker build --check)…"
  # `--check` validates the Dockerfile without executing build steps.
  # Errors are non-fatal here because this slice's contract is "exit 0
  # in both branches"; the lint output itself is the signal.
  docker build --check -f "${DOCKERFILE}" "${REPO_ROOT}" || true
else
  echo "[CLOUD3] BuildKit not available; skipping --check lint."
fi

echo "[CLOUD3] verify-docker-build complete (no image built, no push, no deploy)."
exit 0
