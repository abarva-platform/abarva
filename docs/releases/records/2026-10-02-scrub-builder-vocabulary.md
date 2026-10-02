# 2026-10-02-scrub-builder-vocabulary — Keep builder vocabulary off client surfaces

## Release ID

`2026-10-02-scrub-builder-vocabulary`

## Status

`candidate`

## Plain-English Summary

How a deliverable gets generated is never the client's concern, but a real
exported deck slide leaked exactly that — it read, in effect, "produced by the
[internal engine] from the bound [internal reference model]; the agent does not
improvise the structure." That is implementation talk on a page a sponsor reads.

This change teaches the existing client-surface cleanup to rewrite that builder
vocabulary into neutral, client-appropriate language, and adds the same terms to
the list the quality gate scans for, so any that slip past the rewrite are caught
rather than shipped. The honest claim (the structure is not improvised) is kept;
only the internal self-reference is removed.

## Layer Impact

Release lane: `global-control-lane` — shared Moves artifact-sanitisation behavior
for all clients, not feature-gated.

- `PRODUCTS` (Moves): the client-surface sanitizer and the machinery lexicon the
  de-machinery gate scans. No change to evidence, figures, structure, or layout.

No change to the canonical model, source adapters, or client intake.

## Client Applicability

- All clients: yes — every generated client-facing artifact (documents and
  decks) that passes through the sanitizer.
- Specific clients: none. Internal only: no. Public/demo only: no. Feature flag:
  none.

## Changes Included

- `src/lib/deliverables/client-facing-artifact-sanitize.ts`: rewrite rules for
  the builder nouns and the generation self-reference (internal engine name,
  internal reference-model name, "function pack", "the agent does not improvise")
  into neutral language. The sanitizer already recursively covers deck slide text
  via `sanitizeClientFacingRenderableDeliverable`.
- `src/lib/deliverables/profiles/machinery-lexicon.ts`: the same terms added to
  the banned set the de-machinery gate scans, for defense-in-depth on any path
  that scans but does not sanitize.
- Tests: the exact leaked-slide shape is scrubbed and the gate then reports
  nothing; the existing lexicon-coverage test now also verifies the new terms are
  cleared before the scan.

## QA / Validation

- `npx jest src/lib/deliverables` — 106 suites / 1,279 tests pass.
- New test reproduces the real leaked-slide sentence and asserts the internal
  nouns, the generation self-reference, and `substrate` are all gone and the gate
  finds nothing.
- Scoped `tsc` over the changed files: no type errors. `eslint`: clean.
- `npm run release:check --base origin/main --head HEAD`: all gates pass.

## Rollout Plan

Merge to main via squash. No runtime rollout step of its own: it takes effect in
the web image the repo-owned ACA main deploy workflow builds from the merge SHA.
No migration, no flag, no env change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (on merge
  to main).
- Shared runtime mutators: none introduced.
- Approved image digest: the digest the main deploy workflow produces for the
  merge SHA.
- ACA runtime invariant: unchanged; no env/flag/scale/secret change.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: generate one deck on an affected Move after
  deploy and confirm no builder vocabulary appears on any slide.

## Rollback Plan

Revert the PR and redeploy from the reverted SHA through the main deploy
workflow. No migration or data change to unwind; the change is sanitiser rules
plus banned-term entries.

## Audit Evidence

- PR URL: (added on open).
- CI run on the PR.
- Local test + lint + scoped typecheck output above; the new test reproduces the
  exact leaked-slide sentence.

## Known Gaps

- The leaked sample came from a separate board-grade export path; this change
  hardens the shared sanitizer and lexicon so the terms are neutralised wherever
  that code runs. If the board-grade export path does not call the sanitizer at
  all, wiring it there is a follow-up.
- Remaining deck-quality items (color-coded / owner-terminated table cells,
  `value_tree` exhibit, argument-titles-everywhere and plain-English-mirror prompt
  rules) are later steps in the deck-quality remediation sequence.
