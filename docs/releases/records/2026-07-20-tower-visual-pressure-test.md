# 2026-07-20-tower-visual-pressure-test — Tower Visual Pressure Test Harness

## Release ID

`2026-07-20-tower-visual-pressure-test`

## Status

`candidate`

## Plain-English Summary

Adds a live Tower visual pressure-test harness that asks 45 production Tower aVa questions across visual paraphrases, imperfect evidence, sparse or large portfolio cases, scope handoffs, and answer/table/visual consistency. The harness does not change product behavior. It creates a repeatable evidence corpus for whether Tower chooses the right governed visual contract without leaking raw chart JSON or overstating evidence.

## Layer Impact

- Global control lane: adds a QA script under `scripts/qa` for all Tower visual-intelligence releases.
- Product runtime: no runtime behavior change.
- Data plane: no schema, migration, ingestion, retrieval, or client-data mutation.

## Client Applicability

- All clients: no direct runtime change; the harness can test any signed-in Tower tenant context.
- Specific clients: none.
- Internal only: yes, QA/operator tooling.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/qa/tower-visual-pressure-test.mjs` — Playwright-backed production/live API harness for `/api/tower/cio-chat`.
- `reports/tower/tower-visual-pressure-2026-07-20.md` — baseline 45-prompt production report against `https://app.abarva.ai`.

## QA / Validation

- `node --check scripts/qa/tower-visual-pressure-test.mjs` — passed.
- `npx eslint scripts/qa/tower-visual-pressure-test.mjs` — passed.
- Smoke run: `node scripts/qa/tower-visual-pressure-test.mjs --limit 2 --out-dir out/tower-visual-pressure-smoke-2026-07-20` — completed and proved the harness can find live visual-intent misses.
- Full run: `node scripts/qa/tower-visual-pressure-test.mjs --out-dir out/tower-visual-pressure-2026-07-20-full-v2` — completed against deployed `https://app.abarva.ai`.
- Full-run baseline: 45 prompts, 22 pass, 18 watch, 5 fail, average score 93/100, visual intent accuracy 78%, renderer success 100%, data integrity 100%.
- `npm run release:check` — pending after this release record is added.

## Rollout Plan

Merge to `main`. No Azure Container Apps deployment is needed for runtime behavior, although the normal main deploy workflow may still publish the repository state. Operators can run the harness manually with a signed-in Clerk storage state.

## Deployment Authority

- Repo-owned deploy workflow: not required for runtime behavior.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: no worker change.
- Feature/env flag update path: none.
- Live signed-in proof required: the harness itself uses signed-in live proof.

## Rollback Plan

Revert the PR to remove the QA harness and report. No runtime or data rollback is required.

## Audit Evidence

- Baseline report: `reports/tower/tower-visual-pressure-2026-07-20.md`
- Local full-run artifacts: `out/tower-visual-pressure-2026-07-20-full-v2/`

## Known Gaps

The baseline intentionally records product gaps rather than fixing them. The next product hardening pass should improve visual-intent precedence for prioritization paraphrases, value-leakage wording, validate-not-chart posture, and large-portfolio top-N behavior.
