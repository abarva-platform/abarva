# 2026-09-05-moves-phase-name-sync — Align answer-contract Moves phase names with the product

## Release ID

`2026-09-05-moves-phase-name-sync`

## Status

`candidate`

## Plain-English Summary

Moves phase names existed in two places. The product runs the phase packs, which name the phases one way. The Intelligence answer contract carried its own hand-typed copy of those names for use in generated answers. The two lists had drifted, and four of the six phase names no longer matched.

This was not cosmetic. A deterministic fallback injects the contract's phase rows into an answer whenever the model omits the phase table, so the assistant was actively presenting phase names to users that do not appear anywhere in the product they were looking at. The names in the two lists are now identical, taken from the phase packs.

The contract keeps one extra trailing step for the handoff to outcome tracking. That is a narrative step in an answer, not a phase pack, so it is allowed after the product phases and is asserted to appear only there.

A test now pins the two lists together. It was verified to fail against the previous state and pass against the corrected one, so the drift that existed cannot silently return.

## Layer Impact

Release lane: `global-control-lane` — shared answer-contract behaviour for all clients, not feature-gated and not client-scoped.

- Layer 4 (Products — Intelligence): the phase names used in generated answers and in the deterministic fallback rows.
- Layer 3 (Canonical model): unchanged. Phase packs are the existing source and were not modified.
- Layers 1-2 (Client intake, source adapters): unchanged.

## Client Applicability

- All clients: yes — generated answers now name phases as the product does.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

Phase names appeared in more places than the answer contract. Every production occurrence now uses the phase-pack wording; the sweep was widened after an audit found the generated product manual contained both vocabularies in a single document.

- `src/lib/intelligence/ask/answer-mode-registry.ts` — phase label list, fallback branch labels, and fallback plan rows renamed to the product phase names.
- `src/lib/agent/product-truth/capability-registry.ts` — the Moves capability guidance named the phases the old way. This entry is an input to the generated product manual, so the manual rendered phase-pack names in one section and these names in another.
- `src/lib/agent/product-truth/runtime-guard.ts`, `src/lib/intelligence/answer/structured-exhibits.ts`, `src/lib/programs/phase-success-package/core.ts`, `src/lib/programs/phase-templates/feed-forward.ts`, `src/lib/programs/uploaded-move-evidence-classification.ts` — display labels renamed. All six were confirmed to be human-facing labels rather than identifiers before renaming.
- Three further suites had fixtures pinning the old wording and were updated: product-truth runtime guard, structured exhibits, and phase success package.
- `src/lib/intelligence/ask/response-policy.ts` — the same names in the answer-mode contract prose.
- `src/lib/intelligence/ask/__tests__/moves-phase-name-sync.test.ts` — new. Pins the contract list to the phase packs, pins the handoff step to the final position, asserts the deterministic fallback renders the product names, and asserts that other product-truth sources naming a phase individually use the same wording.
- `src/lib/intelligence/ask/__tests__/strategy-to-moves-contract.test.ts`, `src/lib/intelligence/ask/response-policy.test.ts` — fixtures and assertions updated to the product names. Both suites test duplicate-append and contract-completion behaviour rather than the wording itself.

## QA / Validation

- `npx jest src/lib/intelligence/ask/__tests__/moves-phase-name-sync.test.ts` — 3 passed.
- Guard verified against the previous state: reverting only the renames and keeping the new test fails 2 of its 3 assertions, naming the mismatched phases. The guard therefore detects the drift that actually existed rather than only asserting the corrected state.
- `npx jest src/lib/intelligence` — 564 passed, 29 failed. All 29 failures are pre-existing on the base commit, verified by stashing the change and re-running (561 passed, identical failing suites). No suite regressed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — 0 errors repo-wide.
- `npx eslint` on all changed files — clean.

## Rollout Plan

Merge to main via PR (squash). The repo-owned ACA main deploy workflow builds and deploys the image. No migration, no data build, no flag, no env change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only path that may shift shared web traffic.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow on merge.
- ACA runtime invariant: to be proven after deploy — template image, 100% traffic revision image, and worker job images must match the approved digest.
- Worker image invariant: unaffected; no worker job changes.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes — an answer that renders the phase plan should name the same phases the product shows.

## Rollback Plan

Revert the PR and redeploy through the same main deploy workflow. Text and test changes only, with no schema, data, or stored-state effect, so revert is complete and immediate.

## Known Gaps

- Not live-proven. The change alters wording in generated answers, which only a signed-in read can confirm.
- The two lists are pinned by a test rather than derived from one source. Deriving at runtime would pull the full phase-pack modules into the answer path, which is a bundle-weight decision that has not been assessed. The test makes divergence a build failure, which addresses the recurrence risk without that cost.
- Only the Moves phase vocabulary is covered. Source stage, gate, and artifact labels are hand-typed in components outside the canonical constants and have not been audited for the same class of drift. That sweep is still owed and should precede any further work that generates guidance from these sources.
- A freshness gate proves a generated document matches its inputs. It cannot prove the inputs agree with each other, which is how the manual came to contain two phase vocabularies while being reported as current. The new cross-source assertion covers the Moves case only; the general problem is unaddressed.
- Five test files still contain the old wording in fixtures and continue to pass, because they exercise stored or simulated phase values rather than rendered labels. They are inventoried rather than changed, since altering them would change what those suites simulate.
- The phase descriptions accompanying each name were reviewed for accuracy against the renamed phases but were not rewritten; they are inherited from the previous wording.

## Audit Evidence

- PR URL: to be attached on open.
- CI run for the PR.
- Local validation output recorded in the QA section above.
- Post-deploy: ACA revision digest check and a signed-in phase-plan answer read.
