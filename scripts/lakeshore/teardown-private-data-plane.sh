#!/usr/bin/env bash
set -euo pipefail

CONFIRMATION="${CONFIRM:-}"
if [[ "${CONFIRMATION}" != "delete-lakeshore-pilot" ]]; then
  cat >&2 <<'EOF'
Refusing to delete Lakeshore pilot resource groups.

Set CONFIRM=delete-lakeshore-pilot to proceed after exporting any required audit evidence.
EOF
  exit 2
fi

RESOURCE_GROUPS=(
  "rg-abarva-lakeshore-pilot-control-eastus"
  "rg-abarva-lakeshore-pilot-data-eastus"
  "rg-abarva-lakeshore-pilot-obs-eastus"
  "rg-abarva-lakeshore-pilot-security-eastus"
  "rg-abarva-lakeshore-pilot-db-eastus2"
)

for rg in "${RESOURCE_GROUPS[@]}"; do
  if az group exists --name "${rg}" | grep -q true; then
    echo "Deleting ${rg}"
    az group delete --name "${rg}" --yes --no-wait
  else
    echo "Skipping ${rg}; not found"
  fi
done
