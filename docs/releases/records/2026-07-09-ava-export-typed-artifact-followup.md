# 2026-07-09-ava-export-typed-artifact-followup — aVa Export Typed Artifact Follow-Up

## Release ID

`2026-07-09-ava-export-typed-artifact-followup`

## Status

`candidate`

## Plain-English Summary

The live production acceptance run after PR #4636 proved the core signed-in chat path, follow-up clicks, and product-truth packet behavior were working when the harness waited for the full streamed response body. It also exposed one remaining client-demo hardening gap: answers could render Markdown tables in the live chat, but the governed export packet could still lose those tables/charts when the router classified the answer as prose or when the answer went through the tabbed response branch.

This release makes the governed packet own those artifacts. If aVa emits a Markdown table, the runtime converts it into a typed table for rendering and export. If the user asks for a value/complexity or 2x2 matrix, the runtime can derive the typed chart artifact from the extracted table even when the router was conservative. Tabbed Intelligence answers now also include extracted structured artifacts instead of returning `artifacts: []`.

## Layer Impact

- `global-control-lane`: Updates the Intelligence answer assembly path used by aVa chat/export across clients.
- `public-demo`: Improves investor/client-demo readiness by keeping tables/charts in HTML/PDF exports.

## Client Applicability

- All clients: Yes, for Intelligence aVa answer/export behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- `src/lib/intelligence/answer/structured-exhibits.ts`
  - Preserves model-emitted Markdown/inline tables as typed table artifacts even when routing is `prose`.
  - Allows explicit chart/graph/table wording in the user query to drive artifact generation even when the router output shape is conservative.
  - Converts value/complexity or 2x2 table output into a quadrant chart artifact for export.
- `src/app/api/intelligence/ask/route.ts`
  - Adds structured-exhibit extraction to the tabbed Intelligence response branch so governed packets do not return `artifacts: []` when usable tables/charts are present.
- `src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts`
  - Adds regression coverage for prose-routed Markdown tables and prose-routed value/complexity matrix charts.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts --runInBand` — Pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — Pass.
- `npx eslint src/app/api/intelligence/ask/route.ts src/lib/intelligence/answer/structured-exhibits.ts src/lib/intelligence/answer/__tests__/structured-exhibits.test.ts` — Pass.
- `npm run release:check` — Pending after this release record is added.

Live proof before this change:

- Deployed SHA `0c11a7e3ff3561a924d38c7030aa379311762370`.
- ACA revision `ca-abarva-web-lab-eastus--m0c11a7e3`.
- Runtime invariant passed; health OK.
- Signed-in Lakeshore path passed seed answer, three generated follow-up clicks, and final-packet bad-transcript regression when the proof runner waited for the full response body.
- Remaining gap: export/table/chart artifact preservation still needed this follow-up.

## Rollout Plan

Open PR, squash merge to `main`, and let the repo-owned ACA main deploy workflow build and deploy the digest-pinned image. After deployment, rerun the live signed-in production acceptance proof on `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the approved workflow.
- Approved image digest: Pending post-merge ACA deploy.
- ACA runtime invariant: Required post-deploy.
- Worker image invariant: No worker change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the ACA main lane. The change is runtime code only; no schema or data migration rollback is required.

## Audit Evidence

- Pre-fix proof bundle: `/Users/anand/Projects/nexus/proof/ava-client-demo-hardening-v1-live-post4636-packet-wait-2026-07-09T14-53-56-086Z`
- Targeted export probe: `/Users/anand/Projects/nexus/proof/ava-export-targeted-live-2026-07-09T15-02-41-685Z`
- Post-fix PR, CI, deploy, and live proof: Pending.

## Known Gaps

Production acceptance is pending merge, ACA deploy, runtime invariant, health check, signed-in browser proof, HTML export proof, and PDF export proof for this follow-up.
