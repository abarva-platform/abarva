# 2026-07-22-source-vendor-coverage-client-key-alias-fix — Let governed Source vendor-coverage answers read legacy client-key facts

## Release ID

`2026-07-22-source-vendor-coverage-client-key-alias-fix`

## Status

`live-proven` — merged (PR #5362), deployed, ACA runtime invariant verified, and a real signed-in
Meridian user's vendor-coverage question now renders a real governed table. This closes out the
`SOURCE-ANALYTICS-CHAT-001` live-verify loop that spanned PRs #5341, #5346, #5350, #5358, #5361,
and this fix.

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
- `pass` — post-deploy live signed-in probe (see Audit Evidence): the "Ask aVa" widget on the real
  Meridian event returned a governed `Vendor response coverage` decision table (2 vendor rows,
  real Addressed/Partial/Dodged/Not Yet Answered/$ At Stake Exposed figures, `answered` /
  `high confidence` / `direct fact · 100` badges) for the question "How are vendors doing on
  response coverage across the priced levers?" — the first time this table has rendered end to end
  across this entire debugging chain.

## Rollout Plan

Merged to `main` via PR #5362, deployed through the repo-owned ACA main deploy workflow (run
29949493013). Rerun of the signed-in Meridian Source event probe post-deploy confirmed the NDJSON
response now includes a real `agent-answer` table. Complete — no further rollout action.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:2ab589478207c4fb11c7a30bf389c0de5a6159d1bc225e109e4ad7905a84fb63` (`main-c490a9c8`).
- ACA runtime invariant: verified post-deploy — template image, 100%-traffic revision
  (`ca-abarva-web-lab-eastus--mc490a9c8`), and running state all match the approved digest;
  revision `healthState: Healthy`, `runningState: Running`.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — captured, see Audit Evidence.

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
- PR: [#5362](https://github.com/abarva-platform/abarva/pull/5362), merged
  `c490a9c86a2701b9882cb39041005be867fd529e`.
- Deploy run: [29949493013](https://github.com/abarva-platform/abarva/actions/runs/29949493013),
  conclusion `success`.
- Post-fix live proof:
  `reports/live-source-proof/source-analytics-chat-001-meridian-vendor-table-live-c490a9c8/proof.json`
  — real governed `Vendor response coverage` table rendered in the live `AskAnythingBar` widget for
  a signed-in Meridian (Healthcare Demo) user.

## Known Gaps

- This fixes the vendor-coverage structured answer slice only. Value waterfall, artifact-quality,
  and guidebook/session-note analytics answers remain follow-on backlog items.
- Source event/fact tables still carry legacy app keys. This release intentionally does not migrate
  stored client keys; it bridges the read/governance boundary safely.
- The governance gate (`buildValidatedAgentContextBundle`) runs with `requireAgentReady: false`
  because `source_event_facts` is never indexed anywhere — every candidate is honestly
  `retrievability: "not_indexed"`. This is a deliberate, documented limitation of the current
  two-state retrievability model, not an oversight, and remains open as real follow-on work.
