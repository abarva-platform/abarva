# AZLAB49 - L7 Live Runner Auth Preflight

Status: implemented in repo  
Date: 2026-05-15  
Layer: L7 - Agent quality

## Why This Matters

The L7 live agent-quality runner can execute the golden corpus through `/api/chat/agent`, but live mode depends on a real authenticated app session. A failed manual Azure probe on 2026-05-15 proved the workflow was technically wired but the repository secret `AGENT_QUALITY_SESSION_COOKIE` was empty.

Without a first-class preflight, operators would see a late npm error instead of the real setup gap. This slice makes the blocker explicit before the live run starts.

## What Changed

| Artifact | Change |
|---|---|
| `.github/workflows/agent-quality-live-runner.yml` | Adds workflow-level `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` so GitHub JavaScript actions run under Node 24 ahead of the 2026 runner default. |
| `.github/workflows/agent-quality-live-runner.yml` | Adds a `Verify live auth secret` step for `workflow_dispatch` live mode. |
| GitHub step summary | When the cookie secret is absent, the workflow now writes a clear operator note explaining how to unblock the run. |

## Live Probe Evidence

Manual dispatch target:

```text
https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io
```

Probe scope:

```text
mode=live, agent=sentinel, tenant=apex-retail, limit=1
```

Observed result before this patch:

```text
AGENT_QUALITY_SESSION_COOKIE:
live mode requires --cookie or AGENT_QUALITY_SESSION_COOKIE
```

That is not an application failure. It means the live drift harness still needs a short-lived authenticated session cookie for the selected host.

## Operator Runbook

1. Sign in to the target host as the intended demo persona.
2. Capture a short-lived authenticated session cookie for that host.
3. Store it as repository secret `AGENT_QUALITY_SESSION_COOKIE`.
4. Re-run the workflow in live mode with a small first slice:

```text
mode=live
base_url=https://ca-abarva-web-lab-eastus.agreeableocean-2c1472e6.eastus.azurecontainerapps.io
agent=sentinel
tenant=apex-retail
limit=1
```

5. If that passes, run the full Sentinel slice, then expand to all five agents.

## Design Choice

This stays intentionally cookie-based for the lab. It exercises the same authenticated path the app uses today and avoids adding a test-only API bypass. For pilot hardening, replace the manually rotated cookie with an Entra/Clerk machine-auth test identity once the auth adapter strategy is finalized.

## Completion Criteria

- Dry-run workflow stays green without any secret.
- Live workflow fails before npm execution when `AGENT_QUALITY_SESSION_COOKIE` is absent.
- Live workflow executes `/api/chat/agent` once the secret is present.
- Captured JSONL answer artifacts become the first L7 live drift baseline.
