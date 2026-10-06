# 2026-09-20-tower-upload-approval-claim — Tower Upload Approval Claim Correction

## Release ID

`2026-09-20-tower-upload-approval-claim`

## Status

`candidate`

## Plain-English Summary

The Tower portfolio upload row no longer claims completed human-approval coverage when the real route only proves access, tenant matching, quarantine, storage, metadata, and parser controls. The machine catalog now omits the false consequential approval claim until an actual decision-owner, rationale, and evidence-packet gate exists.

## Layer Impact

`global-control-lane`: Layer 4 product control documentation and CI coverage only. The Tower upload route behavior is unchanged; this release corrects the audit register and adds a route-level regression that executes the current handler.

## Client Applicability

- All clients: The public control catalog and CI claim gate are corrected for the shared Tower upload route.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/legal/AI_CONSEQUENTIAL_ACTION_CATALOG.md` changes Tower portfolio upload/ingest from covered to partial and names the missing completed-decision gate.
- `docs/security/ai-surface-control-catalog.json` removes the unbound Tower portfolio upload approval claim.
- `scripts/audit/ai-surface-control-catalog.mjs` parses Markdown table headers by normalized cells so formatting changes do not erase legal-catalog claims.
- `src/app/api/tower/upload/__tests__/route.test.ts` executes the real route with mocked storage/write/classifier dependencies and proves no human approval packet is currently required for a parsed portfolio upload.
- `.github/workflows/ai-surface-control-catalog.yml` runs the new Tower upload boundary test.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/app/api/tower/upload/__tests__/route.test.ts --runInBand`.
- Pass: `npm run audit:ai-surface-controls`.
- Pass: `npm run test:behaviors`.
- Pass: `npx eslint scripts/audit/ai-surface-control-catalog.mjs src/app/api/tower/upload/__tests__/route.test.ts`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`.
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`.
- Pass: deletion count check reported `0`.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps workflow will build and deploy the resulting application image. No migration, data load, tenant data mutation, feature flag, or manual runtime command is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Yes, normal main-branch workflow only.
- Shared runtime mutators: None.
- Approved image digest: To be produced by the repo-owned workflow after merge.
- ACA runtime invariant: Required before saying deployed.
- Worker image invariant: Required before saying deployed.
- Feature/env flag update path: None.
- Live signed-in proof required: No product behavior changed; signed-in acceptance is not claimed by this release.

## Rollback Plan

Revert the PR and redeploy through the repo-owned workflow. No database rollback or tenant-data action is required.

## Audit Evidence

Inspect the PR, the route-level Jest output, the AI surface control catalog audit, release-check output, and the repo-owned deploy run after merge.

## Known Gaps

Tower portfolio upload still lacks the actual completed human decision owner, rationale, and evidence packet before parsed data can feed decision-grade Tower surfaces. This release records that gap instead of closing it.
