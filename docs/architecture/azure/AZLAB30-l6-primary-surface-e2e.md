# AZLAB30 - L6 Primary-Surface E2E

Date: 2026-05-15  
Scope: L6 functional E2E for Azure lab and other deployed targets  
Posture: workflow wiring; live Azure run waits on Clerk allowing the Azure host

## Executive Read

AZLAB30 adds the first L6 workflow-level browser gate. It runs the existing Playwright tenant matrix against a selected deployment target and signs in through the real `DemoCodeSignIn` flow. The test covers Apex, Meridian, and First Capital across the five primary CXO surfaces:

- Home
- Intelligence
- Strategic Moves
- Source
- Tower

This is intentionally a primary-surface gate, not yet a full "create a Move / create a Source event" transaction. It proves that the authenticated app shell, locked tenant identity, and core pages work before we add workflow mutation tests.

## Artifact

Workflow:

```text
.github/workflows/azure-l6-primary-surfaces.yml
```

Spec:

```text
tests/e2e/primary-surfaces-tenant-matrix.spec.ts
```

Manual run:

```bash
gh workflow run azure-l6-primary-surfaces.yml -f environment=azure-lab
```

Run one tenant only:

```bash
gh workflow run azure-l6-primary-surfaces.yml -f environment=azure-lab -f only_tenant=meridian
```

## Required Secrets

| Target | Secret |
|---|---|
| `azure-lab` | `AZURE_LAB_BASE_URL` |
| `staging` | `STAGING_BASE_URL` |
| `production` | `PRODUCTION_BASE_URL` |
| all targets, optional | `E2E_DEMO_PASSWORD`, defaults to `Demo2026!` |
| all targets, optional | `E2E_DEMO_ACCESS_CODE`, defaults to `424242` |

For Azure lab, Clerk must accept the Container Apps FQDN as an allowed host/redirect origin. If Clerk rejects the host, this workflow fails at sign-in; that is an auth-host configuration issue, not a page-render issue.

## What It Proves

| Surface | Assertion |
|---|---|
| Home | Tenant identity renders correctly. |
| Intelligence | Brief heading contains the correct tenant name. |
| Strategic Moves | Portfolio header renders. |
| Source | Sourcing portfolio header renders. |
| Tower | Atlas rail mounts. |

## Remaining L6 Work

| Item | Why |
|---|---|
| Move origination transaction | Proves Nexus can originate and persist a P0/P1 Move. |
| Source event transaction | Proves chat-driven Source intake and event creation work end-to-end. |
| Tower decision-pack workflow | Proves executive output generation works, not only page render. |
| Screenshot baselines | Catches executive-grade design regressions before demo. |

