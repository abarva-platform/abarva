#!/usr/bin/env bash
# Update the deliverable-generation worker JOBS to a given image.
#
# Why this exists: aca-main-deploy.yml updates only the WEB container app image.
# The background worker runs as separate Azure Container Apps Jobs (a cron
# fallback + a KEDA event-triggered job) that are NOT touched by the web deploy,
# so worker-side code changes silently never reach production ("works in web,
# stale in worker"). This script brings BOTH worker jobs to the same image every
# release. It is called by the deploy workflow and is also safe to run by hand:
#
#   IMAGE=acrabarvalab001.azurecr.io/abarva/web@sha256:... \
#   RESOURCE_GROUP=rg-abarva-controlplane-lab-eastus \
#   scripts/deploy/update-worker-jobs.sh
#
# Tolerant by design: if a job does not exist in the target environment it is
# skipped with a warning rather than failing the deploy (e.g. the event job may
# not be provisioned in every environment yet).

set -euo pipefail

IMAGE="${1:-${IMAGE:-}}"
RESOURCE_GROUP="${RESOURCE_GROUP:-rg-abarva-controlplane-lab-eastus}"
# Space-separated. Cron fallback + KEDA event-triggered worker.
WORKER_JOB_NAMES="${WORKER_JOB_NAMES:-job-abarva-deliv-worker job-abarva-deliv-worker-event}"

if [[ -z "$IMAGE" ]]; then
  echo "ERROR: IMAGE is required (arg 1 or \$IMAGE)." >&2
  exit 1
fi

if [[ "$IMAGE" != *@sha256:* && "${ALLOW_MUTABLE_ACA_IMAGE:-}" != "true" ]]; then
  echo "ERROR: worker job image must be pinned by digest (@sha256:...)." >&2
  echo "Received: $IMAGE" >&2
  echo "Set ALLOW_MUTABLE_ACA_IMAGE=true only for a documented non-production exception." >&2
  exit 1
fi

echo "Updating worker jobs to image: $IMAGE"
echo "Resource group: $RESOURCE_GROUP"

failed=0
for job in $WORKER_JOB_NAMES; do
  if ! az containerapp job show --name "$job" --resource-group "$RESOURCE_GROUP" --output none 2>/dev/null; then
    echo "::warning::worker job '$job' not found in '$RESOURCE_GROUP' — skipping."
    continue
  fi
  echo "→ updating $job"
  if az containerapp job update \
      --name "$job" \
      --resource-group "$RESOURCE_GROUP" \
      --image "$IMAGE" \
      --output none; then
    echo "  ✓ $job updated"
  else
    echo "::error::failed to update worker job '$job'" >&2
    failed=1
  fi
done

if [[ "$failed" -ne 0 ]]; then
  echo "One or more worker job updates failed." >&2
  exit 1
fi
echo "All present worker jobs updated to $IMAGE."
