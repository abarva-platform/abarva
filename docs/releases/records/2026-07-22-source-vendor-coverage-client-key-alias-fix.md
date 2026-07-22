# 2026-07-22-source-vendor-coverage-client-key-alias-fix — Let governed Source vendor-coverage answers read legacy client-key facts

## Release ID

`2026-07-22-source-vendor-coverage-client-key-alias-fix`

## Status

`deployed / live-proven` — merged via PR #5362, deployed to `app.abarva.ai` through the repo-owned
ACA main deploy workflow, and signed-in verified against the Meridian Source event.

## Plain-English Summary

Live proof of `SOURCE-ANALYTICS-CHAT-001` showed the real Source event chat reached the right
NDJSON route but emitted only a prose `summary` line, not the structured `agent-answer` table.
Read-only VNet proof showed the seeded event really does have 12 active vendor-response facts,
all under Source's legacy app client key `meridian`.

The bug was the first guard in `buildVendorCoverageGovernedAnswer()`: it required the incoming
Source `clientKey` to already be a governance-canonical key. Source event/fact tables still use
legacy app keys such as `meridian` and `apexretail`; the governance bundle requires canonical keys
such as `meridian-health` and `apex-retail`. So the builder returned `null` before reading facts.

This fix keeps Source fact reads on the raw Source data-plane key, but normalizes the key used for
governed candidates and the emitted `AvaAnswerPacket`.

## Layer Impact

- `global-control-lane`: changes the governed Source aVa vendor-coverage answer builder and its
  tests. No schema, route contract, permission, or live data mutation changes.
- `client-data-lane`: read behavior is intentionally unchanged. Source event facts are still read
  with the active Source `client_key`; only the governance/answer packet key is canonicalized.

## Client Applicability

- All clients: yes, for Source vendor-coverage chat answers.
- Specific clients: materially fixes tenants whose Source tables use legacy keys, including
  Meridian (`meridian`) and Apex (`apexretail`).
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/ava/vendor-coverage-governed-answer.ts`
  - Adds `governedClientKeyForSourceClientKey()`.
  - Reads Source facts with `input.clientKey`.
  - Builds `GovernedCandidate.client_key` and `AvaAnswerPacket.tenantKey` with the canonical
    governance key.
- `src/lib/source/ava/__tests__/vendor-coverage-governed-answer.test.ts`
  - Adds alias normalization tests.
  - Adds a full mocked builder regression proving `clientKey: "meridian"` still reads Source facts
    with `meridian` but emits a canonical `tenantKey: "meridian-health"` structured table answer.

## QA / Validation

- `pass` — signed-in pre-fix live probe on `app.abarva.ai` / revision `main-053cd191`: route
  returned `application/x-ndjson` but only one `summary` line, no `agent-answer`.
- `pass` — read-only VNet data proof from ACA web container: event
  `cea10d0a-6d5d-49d2-8522-173c2d6fd520` has 12 active `response_addressed` facts under
  `client_key = meridian`.
- `pass` — `npx jest --runTestsByPath src/lib/source/ava/__tests__/vendor-coverage-governed-answer.test.ts 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts' --runInBand`
  — 2 suites / 14 tests passed. Jest printed the repo's pre-existing duplicate manual mock
  warnings only.
- `pass` — `npx eslint src/lib/source/ava/vendor-coverage-governed-answer.ts src/lib/source/ava/__tests__/vendor-coverage-governed-answer.test.ts 'src/app/api/v1/source/[eventId]/nexus/ask/route.ts' 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/vendor-coverage-intent.test.ts'`
  — clean.
- `blocked by pre-existing dependency drift` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
  fails on missing `@xyflow/react` / `@dagrejs/dagre`, unrelated to this change.
- `pass` — GitHub PR checks on rebased commit `de91b61a8`: AI surface control catalog,
  accessibility, architecture rules/boundaries, browser matrix smoke, bundle budget, canonical
  tenant drift, behavior coverage, dependency audit, hygiene, integrity, Lighthouse, lint,
  migration drift, production readiness, reasoning-layer typecheck/tests, release control, secret
  scanning, and Wave 0 harnesses all passed before merge.
- `pass` — ACA deploy run
  [29949493013](https://github.com/abarva-platform/abarva/actions/runs/29949493013) deployed merge
  commit `c490a9c86a2701b9882cb39041005be867fd529e`.
- `pass` — independent ACA invariant after deploy:
  revision `ca-abarva-web-lab-eastus--mc490a9c8`, image
  `acrabarvalab001.azurecr.io/abarva/web@sha256:2ab589478207c4fb11c7a30bf389c0de5a6159d1bc225e109e4ad7905a84fb63`,
  tag `main-c490a9c8`, 100% traffic, health OK.
- `pass` — signed-in Meridian live proof on `app.abarva.ai` event
  `cea10d0a-6d5d-49d2-8522-173c2d6fd520`: page 200, ask route 200,
  `application/x-ndjson`, line types `summary` + `agent-answer`, answer status `answered`,
  tenant key `meridian-health`, artifact kind `table`, table id `vendor-response-coverage`, 2
  vendor rows, 8 citations, direct answer:
  "5 of 6 value dimensions answered across 2 vendors; 1 still dodged ($400K–$900K) — press each
  in evaluation."

## Rollout Plan

Merge to `main` through PR, then deploy through the repo-owned ACA main deploy workflow. After
deployment, rerun the signed-in Meridian Source event probe and confirm the NDJSON response includes
an `agent-answer` table.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest:
  `sha256:2ab589478207c4fb11c7a30bf389c0de5a6159d1bc225e109e4ad7905a84fb63`.
- ACA runtime invariant: passed after deploy; template image and 100% traffic revision image
  matched the digest above.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the merge commit. Rollback restores the pre-fix behavior where Source vendor-coverage
answers return `null` for legacy app client keys. No data migration either direction.

## Audit Evidence

- Pre-fix ACA invariant: `reports/aca-runtime-proof/2026-07-22-source-analytics-chat-after-053cd191/`
  — `main-053cd191`, 100% traffic, healthy.
- Pre-fix signed-in probe:
  `reports/live-source-proof/source-analytics-chat-001-meridian-probe-after-053cd191/proof.json`
  — 200, `application/x-ndjson`, one `summary` line, no `agent-answer`.
- VNet data proof: read-only ACA query confirmed 12 active `response_addressed` rows for the event,
  under `client_key = meridian`.
- PR: [abarva-platform/abarva#5362](https://github.com/abarva-platform/abarva/pull/5362), squash
  merged as `c490a9c86a2701b9882cb39041005be867fd529e`.
- Deploy run:
  [29949493013](https://github.com/abarva-platform/abarva/actions/runs/29949493013), success.
- Post-fix ACA invariant:
  `reports/aca-runtime-proof/2026-07-22-source-analytics-chat-after-c490a9c86/`.
- Post-fix signed-in proof:
  `reports/live-source-proof/source-analytics-chat-001-meridian-postfix-c490a9c86/proof.json`.

## Known Gaps

- This fixes the vendor-coverage structured answer slice only. Value waterfall, artifact-quality,
  and guidebook/session-note analytics answers remain follow-on backlog items.
- Source event/fact tables still carry legacy app keys. This release intentionally does not migrate
  stored client keys; it bridges the read/governance boundary safely.
