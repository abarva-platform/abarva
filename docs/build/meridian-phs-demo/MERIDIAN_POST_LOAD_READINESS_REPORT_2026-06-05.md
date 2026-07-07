# Meridian/PHS Post-Load Readiness Report — 2026-06-05

## Current Truth State

| Category | Status | Evidence |
|---|---:|---|
| design/docs | PASS | Prior Meridian/PHS proof packet and handoff docs are present; this post-load report is the current live evidence record. |
| loader/data contract | PASS | Live validate-only accepted 26 Meridian/PHS files with explicit `templateId` mappings and pilot upload attestation. |
| live reset/reload | HOLD | `stage_and_process` failed in production because Azure Blob write authorization is not granted to the runtime credential. |
| corpus/grounding | HOLD | New Meridian/PHS chunks were not persisted because Blob staging failed before governed processing. |
| app/runtime | PASS | Production deployment `dpl_GfVZVSZzuDnb8P19qJ3UgQSkzc9W` is READY and aliased to `https://app.abarva.ai`; `/api/health` returned `ok: true`. |
| QA/crawl/screenshots | PARTIAL | Main post-deploy crawl for PR #3146 passed; PR #3147 code gates passed before forced deploy. Live screenshots captured for sign-in, Admin uploads, validate-only, and failed stage/process. |
| PR/CI/deploy | PASS for code, HOLD for data load | PR #3146 and PR #3147 merged; #3147 was force-deployed to production. Data load remains blocked by Azure RBAC/secret scope. |

## What Was Loaded

Nothing was persisted during the live reset/reload attempt.

The governed loader successfully validated the Meridian/PHS live load package:

| Load Package | Files | Templates | Sensitive Gate | Blob Stage | Context Persistence |
|---|---:|---:|---|---|---|
| `meridian-phs-live-reload-2026-06-05` | 26 | 26 explicit mappings | PASS | FAIL | NOT RUN |

Validated dimensions included enterprise profile, app portfolio, Epic modules, HL7/FHIR topology, prior auth, RCM denials, ambient documentation, clinical AI inventory, HIPAA AI controls, vendor BAA/contracts, service-line P&L, workforce scheduling, access/contact center, imaging AI, CMS interoperability, DORA baseline, incidents/changes, value-based care, population health risk panels, data platform lineage, digital front door, supply chain/pharmacy, governance decisions, security downtime readiness, nursing workload, and AI tool footprint.

## What Changed

Two Azure private data-plane fixes shipped:

| PR | Commit | Change | Result |
|---|---|---|---|
| #3146 | `4374f2c8` | Blob adapter tolerates container-create authorization denial for pre-provisioned landing containers. | Removed unnecessary create-container permission dependency. |
| #3147 | `fdb757fb` | Blob adapter uses conditional upload instead of read-before-write existence checks. | Removed unnecessary Blob read permission dependency and surfaced safe Azure error details. |

After #3147, the live failure became explicit:

```text
object_upload_failed:code=AuthorizationFailure;status=403;name=RestError
```

That means the production runtime credential cannot write to the configured Azure Blob landing container.

## Evidence

Screenshot and API evidence folder:

`docs/build/meridian-demo-walkthrough/post-load-2026-06-05T19-50/`

Files:

| File | Purpose | Result |
|---|---|---|
| `00-signin-ready.png` | Meridian demo-code sign-in form rendered. | PASS |
| `01-admin-uploads-before.png` | Admin uploads route rendered after Meridian CDAO sign-in. | PASS |
| `02-validate-only-result.json` | Validate-only API result. | PASS |
| `03-stage-and-process-result.json` | Stage/process API result. | FAIL |
| `04-admin-uploads-after.png` | Admin uploads route after load attempt. | PASS |
| `manifest.json` | Screenshot/evidence manifest. | PASS |

## Hard Q&A Scorecard

Not run.

Reason: the live reset/reload did not persist the new Meridian/PHS context chunks. Running 50 CDAO/CIO/CFO/CMO/plan COO/audit questions before persistence would test stale context and produce misleading evidence.

## GO / HOLD Recommendation

**HOLD.**

The product runtime and Admin loader are working. The data-plane blocker is Azure Blob write authorization for the production runtime credential.

Do not claim Meridian/PHS post-load readiness until:

1. Azure Blob write authorization is corrected.
2. `stage_and_process` returns `ok: true`.
3. Admin source counts and evidence map reflect the 26-file load.
4. Intelligence/Moves/Tower behavior changes against Meridian/PHS.
5. 50-question hard Q&A passes with citation quality.

## Exact Next Fixes

1. Correct Azure Blob authorization for production runtime.
   - If using account key or connection string, update the Vercel production env var with a credential that can write blobs to the configured landing container.
   - If using managed identity / Entra ID, grant the runtime identity `Storage Blob Data Contributor` or equivalent scoped permission on the configured storage account/container.
   - Ensure the configured container exists and matches `context-uploads` or the shared container env mapping.

2. Re-run live stage/process.
   - Use the same 26-file Meridian/PHS load package.
   - Keep explicit template IDs.
   - Keep all five attestation fields.
   - Do not delete production data unless confirmed in-session.

3. Validate persistence.
   - Check source file counts.
   - Check data trust/evidence map.
   - Check agent readiness/grounding.
   - Check Intelligence tabs: Brief, Map, Art of Possible, Enterprise Context, Vendors.
   - Check Moves and Tower for Meridian-specific grounding.

4. Run hard Q&A after persistence only.
   - 50 questions across Epic analytics, population health, payer-provider economics, MLR, Stars, Databricks, integrations, reporting/table estimation, silver/gold models, AMS vendors, AI governance, evidence, cost, roadmap, and risk.

## Final Status

Meridian/PHS code path is production-deployed and materially improved, but the live reset/reload is blocked by Azure Blob write authorization. Recommendation remains **HOLD** until the Azure credential/RBAC issue is fixed and the post-load validation suite passes.
