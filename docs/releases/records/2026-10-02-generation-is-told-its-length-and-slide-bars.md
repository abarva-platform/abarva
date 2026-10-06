# 2026-10-02 — Generation Is Told the Length and Slide Bars It Is Judged Against

## Release ID

`2026-10-02-generation-is-told-its-length-and-slide-bars`

## Status

`candidate`

## Plain-English Summary

Every generated deliverable is checked before export. Two of the checks are a minimum length for the document and a slide-count range for its deck. Neither bar is changed by this release.

What was wrong is that the generator was not set up to meet them.

- **Slide range.** The step that writes the deck was asked to produce slides with no count. The range was applied only afterwards, as a check. For the discovery deck a fixed outline hid this; for later-phase decks nothing did. A design-phase deck came out at four slides against a required ten to sixteen, and the deliverable was blocked. The step that writes the deck is now told the range and what the deck is for.
- **Minimum length.** A document is written one section at a time. Only the charter had a step that, when the whole came in short, went back and extended the short sections. Every other deliverable was simply blocked. A design-phase document came in about an eighth under its minimum and was blocked with no attempt to close the gap. That repair step now applies to any deliverable that is under its minimum: each short section is extended towards an even share of the minimum, using the same counting rule the check uses.

A repair that comes back no longer than the section it was meant to extend is discarded, so a failed repair cannot shorten a document. A document still under its minimum after repair is still blocked.

## Layer Impact

**Release lane: `global-control-lane`.** Shared deliverable generation for every client; not behind a feature flag.

- **Product layer — deliverable generation:** One added instruction to the deck-writing step; the existing section repair step now runs for any under-length deliverable.
- **Quality gate:** Unchanged. Same minimum lengths, same slide ranges, same blocking behavior.
- **AI egress:** Same governed call path. Additional calls only when a document is under its minimum — a case that previously ended in a blocked build.
- **Canonical model:** No schema or data changes.

## Client Applicability

- All clients receive the behavior after deployment, on deliverables built after it.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/prompt-builder.ts`: `deckLengthInstruction` — the slide range and deck purpose, added to the pass that authors the deck.
- `src/lib/deliverables/orchestrator/orchestrator.ts`: under-length repair for every deliverable, counted by the gate's own rule; repairs that do not grow the section are discarded.
- `src/lib/deliverables/shared/body-word-count.ts`: `sectionShareOfFloor`.
- Tests for each.

## QA / Validation

- Targeted Jest: pass — the deliverables library suites, 8 new tests.
- Mutation checks, each failing the suite: charter-only repair restored (2); a shorter repair accepted (1); slide range removed from the deck-writing pass (1).
- Existing charter repair tests pass unchanged.
- Targeted ESLint: pass.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Deployed-runtime observation that motivated the change: on a synthetic workflow, a design-phase architecture deliverable was blocked at export for a four-slide deck and a document about an eighth under its minimum length.
- Signed-in runtime verification of this change: pending deployment.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. After the exact merge SHA is live, rebuild the design-phase deliverables of the synthetic workflow and read the result: the deck's slide count, the document's length, and whether the added text is substance or filler.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the deploy workflow.
- Approved image digest: Pending exact-SHA deployment.
- ACA runtime invariant: Pending exact-SHA verification.
- Worker image invariant: Pending exact-SHA verification.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on a synthetic workflow.

## Rollback Plan

Use the repo-owned ACA main deploy workflow to redeploy the prior approved digest, or revert this change. No database migration or data mutation is included.

## Audit Evidence

- PR and exact-SHA CI checks: pending.
- Targeted test output and mutation results: recorded in the PR.
- Exact-SHA ACA deployment, digest invariants, and signed-in proof: pending.

## Known Gaps

- The minimum length for the architecture deliverable is the same for every Move. A Move that discovery has confirmed as a limited change is told elsewhere to keep its design right-sized, and is then held to the same minimum as a full redesign. This release makes generation meet the minimum; it does not decide whether the minimum should vary with the confirmed depth. That is an open product decision.
- The architecture minimum was set as a starting point without a live sample. One live sample now exists and it fell short.
- Extending sections to reach a length can produce filler. The repair instruction forbids it; whether it holds is a matter for reading the output, not for a test.
- Decks other than the discovery deck have a stated range but no fixed outline.
