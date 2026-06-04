#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-what-if}"
LOCATION="${AZURE_DEPLOYMENT_LOCATION:-eastus}"
DEPLOYMENT_NAME="${AZURE_DEPLOYMENT_NAME:-lakeshore-private-data-plane-$(date +%Y%m%d%H%M%S)}"
PARAM_FILE="${PARAM_FILE:-infra/azure/parameters/lakeshore.pilot.bicepparam}"

if [[ "${MODE}" != "what-if" && "${MODE}" != "deploy" ]]; then
  echo "Usage: $0 [what-if|deploy]" >&2
  exit 2
fi

if [[ -z "${POSTGRES_ADMINISTRATOR_LOGIN_PASSWORD:-}" ]]; then
  echo "POSTGRES_ADMINISTRATOR_LOGIN_PASSWORD is required. Use a generated value and do not commit it." >&2
  exit 2
fi

az bicep build --file infra/azure/client-tenant-foundation.bicep >/dev/null
az bicep build-params --file "${PARAM_FILE}" >/dev/null

if [[ "${MODE}" == "what-if" ]]; then
  az deployment sub what-if \
    --name "${DEPLOYMENT_NAME}" \
    --location "${LOCATION}" \
    --template-file infra/azure/client-tenant-foundation.bicep \
    --parameters "${PARAM_FILE}"
  exit 0
fi

az deployment sub create \
  --name "${DEPLOYMENT_NAME}" \
  --location "${LOCATION}" \
  --template-file infra/azure/client-tenant-foundation.bicep \
  --parameters "${PARAM_FILE}"
