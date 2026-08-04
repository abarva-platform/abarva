# 2026-08-04-ava-source-offtopic-hard-refuse — Tighten Source aVa's off-topic refusal to a hard decline

## Release ID

`2026-08-04-ava-source-offtopic-hard-refuse`

## Status

`candidate`

## Plain-English Summary

Follow-up to `2026-08-04-ava-source-scope-boundary-and-selection-awareness` (merged and deployed
earlier the same day). Live re-testing of the new off-topic scope boundary found it only partially
worked: asked "What is the capital of France?", aVa answered `"Paris. Though that's outside what I
help with here — ..."` — it still gave the trivia answer before declining, rather than refusing
outright. The original prompt wording ("Decline ... Say briefly that it is outside what you help with
here") left room for the model to answer first and hedge second. This release tightens that single
line to explicitly forbid answering the off-topic question at all, even briefly or as a courtesy,
before declining.

## Layer Impact

- `global-control-lane`: single-line change inside `buildSourceOperatingDoctrineBlock` in
  `src/app/api/chat/agent/route.ts`, gated on `isSourceSurface(surface)` exactly as before. No other
  surface's prompt changes.

## Client Applicability

- All clients using Source's aVa chat.

## Changes Included

- `src/app/api/chat/agent/route.ts`: tightens the scope-boundary line from "Decline ... Say briefly
  that it is outside what you help with here" to "Refuse ... Do not answer the question itself, not
  even briefly or as a courtesy before declining — no trivia fact, no explanation, no partial answer."

## QA / Validation

- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p .`
- PASS: `npx eslint src/app/api/chat/agent/route.ts`
- Live signed-in proof: pending post-deploy — re-run the capital-of-France probe against the deployed
  endpoint and confirm no substantive answer is given before the decline.

## Rollout Plan

Merge through PR to `main`; `aca-main-deploy` builds and deploys automatically. No migration, no
feature flag — single prompt-line wording change.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: required before this release is marked `released`.

## Rollback Plan

Code rollback by reverting the PR. Reverting restores the prior (partial-refusal) wording.

## Audit Evidence

- Live pre-fix transcript (captured this session) showing `"Paris. Though that's outside what I help
  with here — ..."`.
- This PR's diff and CI run.
- Post-deploy: live signed-in re-run of the same probe.

## Known Gaps

None known — this is a single-line prompt-wording tightening with no functional change to
grounding, retrieval, or any other behavior. The only residual risk is model non-compliance with the
strengthened instruction on some future adversarial phrasing not covered by this session's testing;
that would surface as a normal live-testing finding, not a known gap in this change itself.
