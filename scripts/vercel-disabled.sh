#!/usr/bin/env bash
set -euo pipefail

cat >&2 <<'MSG'
[abarva-deploy-guard] Vercel deployment is disabled for app.abarva.ai.

Canonical deploy path:
  az acr build
  az containerapp update
  az containerapp ingress traffic set
  live QA against https://app.abarva.ai

See docs/runbooks/azure-container-apps-deploy.md.
MSG

exit 78
