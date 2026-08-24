# 2026-08-24-ecl-demo-findings-browser-gate — ECL Demo Findings Browser Gate

## Release ID

`2026-08-24-ecl-demo-findings-browser-gate`

## Status

`candidate`

## Plain-English Summary

Extends the non-default ECL product browser smoke so it must prove the ten declared demo findings
are visible on rendered ECL-provider product routes before any default-provider cutover is attempted.
The proof remains scoped to `provider=ecl_projection_db`; it does not repoint Home, Source, Tower, or
Intelligence defaults.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Product Projections: no projection data is changed.
- Layer 5 Serving: no serving views are changed.
- Layer 6 Product Pages: ECL preview routes render a compact finding visibility rail for the
  relevant product surface.
- QA / Proof: the product browser smoke now publishes `findings demonstrable on a real surface: N of
  10` and fails unless all ten findings pass their declared rendered-route checks.

## Client Applicability

- All clients: no default-provider behavior changes.
- Specific clients: none.
- Internal only: preview proof and cutover readiness gating.
- Public/demo only: dense reference-tenant ECL preview proof.
- Feature flag/provider: existing `provider=ecl_projection_db` preview routes only.

## Changes Included

- Adds `src/components/ecl/EclDemoFindingsPanel.tsx`.
- Wires the finding visibility rail into the non-default ECL preview path for Home, Source, Tower,
  and Intelligence.
- Extends `scripts/ecl/run_product_ecl_browser_smoke.mjs` to validate the finding specification
  contract and assert F1-F10 on rendered ECL-provider routes.
- Extends `scripts/ecl/run_product_ecl_predeploy_gate.mjs` so the finding contract is checked before
  a deploy loop is needed.
- Adds this release record.

## QA / Validation

- `node --check scripts/ecl/run_product_ecl_browser_smoke.mjs` — pass.
- `node scripts/ecl/run_product_ecl_browser_smoke.mjs --validate-demo-findings-contract` — pass,
  validates F1-F10 against `docs/architecture/meridian-demo-findings-20260824.json`.
- `npm run ecl:product-browser:predeploy-gate` — pass, including serving-route fence, Source
  provider-alias unit test, and the demo-findings browser contract check.
- `git diff --check` — pass.
- `npx eslint scripts/ecl/run_product_ecl_browser_smoke.mjs scripts/ecl/run_product_ecl_predeploy_gate.mjs src/components/ecl/EclDemoFindingsPanel.tsx src/app/(maestro)/home/preview/page.tsx src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx src/app/(maestro)/tower/page.tsx src/app/(maestro)/intelligence/page.tsx` — pass.
- `npm run release:check` — pass.
- ACA signed-in browser proof — pending after PR merge and repo-owned ACA deploy.

## Rollout Plan

Merge by PR. The repo-owned ACA main deploy workflow publishes the updated browser-smoke runner and
preview-page code into a digest-pinned image. After deployment, run the governed private operator
browser smoke against `provider=ecl_projection_db` and verify the new finding denominator is 10 of
10. No default provider is repointed by this release.

## Deployment Authority

- Repo-owned deploy workflow: required to publish the changed preview pages and smoke runner.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: resolved by the repo-owned ACA main deploy workflow after merge.
- ACA runtime invariant: required before live proof is claimed.
- Worker image invariant: not changed by this release.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before claiming F1-F10 are demonstrable on deployed rendered
  ECL-provider routes.

## Rollback Plan

Revert the PR and redeploy the previous approved digest. No schema, data, serving, provider default,
traffic, or tenant cleanup is required.

## Audit Evidence

- PR URL: to be attached after PR creation.
- Local predeploy gate: `npm run ecl:product-browser:predeploy-gate`.
- Local finding contract: `node scripts/ecl/run_product_ecl_browser_smoke.mjs --validate-demo-findings-contract`.
- Future ACA proof output: private operator browser smoke summary showing
  `findings demonstrable on a real surface: 10 of 10`.

## Known Gaps

- This is a rendered-route visibility gate, not the default-provider cutover.
- This does not run the Intelligence answer engine or aVa consultant reasoning harness. The answer
  path still needs a separate ECL context-provider slice through the governed context broker before
  any answer-quality eval can be called ECL-backed.
- This is not a full tab-by-tab UX redesign of every product surface.
