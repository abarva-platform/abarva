# 2026-09-25-deliverable-model-pin-and-deck-contract — Pin the generation model, contract deck length, draw exhibits from structure

## Release ID

`2026-09-25-deliverable-model-pin-and-deck-contract`

## Status

`candidate`

## Plain-English Summary

Three numbers that decide how a client-facing document turns out had no owner, and a fourth defect was quietly making every generated diagram worse.

The **model** used to generate deliverables lived as six copy-pasted strings plus one environment variable. When the fleet moved to a newer model, five of the six were updated and one was missed — and it stayed missed through two later changes, because nothing in the system could tell the difference. It is now a single named setting, with a check that stops any other file from naming a model at all.

**Deck length** was advice written in prose that nothing read. Two of nine deck types mentioned slides; the rest said "pages". It is now a stated range per deck, enforced at both ends. The upper limit matters more than the lower one: a short board deck is the product, and a thirty-slide one is a document with page breaks.

**Every phase now offers a CXO deck.** Five deliverables previously produced a slide version that the quality gate then treated as a format mismatch, because the deliverable never declared it could be one.

**Diagrams are now drawn from their own data.** The structured content behind an exhibit was being flattened into a sentence on arrival and re-split into fragments. For process diagrams this was not merely lossy — the arrows between boxes were themselves being drawn as boxes, numbered as if they were steps. For two-axis charts, items were positioned by their order in a list rather than by their values, so position carried no meaning. Labels were also cut at a fixed character count, so a phrase like "Approval records the decision" appeared on a client slide as "Approval records the decisio".

## Layer Impact

**Release lane: `global-control-lane`.** Shared control-plane behaviour for all clients, not feature-gated.

- **Layer 4 · Products (Moves, Source):** deliverable generation and rendering only. Every client-facing document and deck produced by the orchestrator is affected.
- **Layer 3 · Canonical model:** untouched. No schema, migration, or stored data changes.

## Client Applicability

- All clients: yes — applies to every generated deliverable.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. `ABARVA_DELIVERABLE_MODEL` exists as a controlled rollback override, not a feature gate.

## Changes Included

- PR: https://github.com/abarva-platform/abarva/pull/8469
- `src/lib/deliverables/model-policy.ts` — new. One model setting, one override, token budgets.
- `src/lib/deliverables/slide-contract.ts` — new. Slide band per deck, enforced in the quality validator.
- `src/lib/deliverables/v2-generator.ts`, `moves-generate-deps.ts`, `planning/deliverable-plan-generation.ts` — model literals replaced by the policy. `NEXUS_COMPOSER_MODEL` retired.
- `src/lib/deliverables/profiles/registry.ts` — pptx declared on every phase deliverable.
- `src/lib/deliverables/orchestrator/renderers.tsx` — flow and matrix exhibits read their structured data; word-safe label fitting.
- `src/lib/deliverables/orchestrator/quality-validator.ts` — slide band enforced.
- `src/lib/deliverables/orchestrator/prompt-builder.ts` — brevity instruction replaced.

No migrations, routes, or scripts changed.

## QA / Validation

- `npx jest src/lib/deliverables src/lib/visual-system` — 94 suites, 1078 tests, all passing.
- `npx eslint src/lib/deliverables --max-warnings=0` — clean.
- `node scripts/audit/lib-orphan-report.mjs` — clean, no change against baseline.
- Mutation-verified, each reverted after confirming the failure:
  - reintroducing a hardcoded model literal fails the model pin;
  - "fixing" a profile's declared format fails the exemption by demanding its own removal;
  - stripping pptx from a phase profile fails the per-phase deck guarantee;
  - drawing flow edges as boxes, positioning matrix cells by index, and restoring mid-word truncation each fail the renderer tests.
- `npx tsc --noEmit` exits 134 (out of memory) on this machine and did not complete. CI typecheck is authoritative.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys on push. No migration, no flag, no manual step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none in this change.
- Approved image digest: produced by the deploy workflow; not pinned by this PR.
- ACA runtime invariant: to be confirmed post-deploy — template image, 100%-traffic revision, and worker jobs on the same digest.
- Worker image invariant: applies; the deliverable worker runs this code.
- Feature/env flag update path: none required.
- Live signed-in proof required: yes — generate one deliverable per phase and open the deck.

## Rollback Plan

Revert the merge commit and redeploy. No migration to unwind and no persisted state changes, so revert is sufficient. For a model-only rollback without reverting code, set `ABARVA_DELIVERABLE_MODEL` to the previous model on the web app and worker jobs.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/8469
- CI checks on the PR head.
- Commits: `87102b422`, `6b85dc4a0`, `611b9e23c`, `b5b74f3c7`.

## Known Gaps

- **Deck quality is improved, not solved.** Flow and matrix now read their structure; timeline, roadmap, layered-architecture and value-tree exhibits still receive their data flattened into a sentence and re-split. They are lossy rather than wrong, and the same fix applies.
- **Three P3 profiles declare pptx while their renderer produces HTML.** The declaration is the intent — a contract test asserts architecture artifacts are slide finals — so the renderer is the gap. Recorded as a named exemption that fails once the renderer lands.
- **No live proof yet.** This record covers code merged, not a deck generated and read. Generate one artifact per phase after deploy before treating the per-phase guarantee as demonstrated.
