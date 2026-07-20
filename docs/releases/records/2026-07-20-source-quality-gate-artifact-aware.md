# 2026-07-20-source-quality-gate-artifact-aware — Make the Source consulting-grade quality gate artifact-aware

## Release ID

`2026-07-20-source-quality-gate-artifact-aware`

## Status

`candidate`

## Plain-English Summary

Source has a live, working "consulting-grade" quality gate: an LLM reviewer scores a
generated artifact against a 10-dimension partner-grade rubric, and if any dimension
scores below 8/10 it triggers one automatic rewrite before failing generation. This gate
was previously wired to exactly one artifact — the RFP Package (d09) — and its shared
review-context builder unconditionally injected D09-specific "RFP evidence coverage map"
language regardless of which artifact it was reviewing. That was harmless while d09 was
the only caller, but it was a real latent bug: the moment a second artifact type used this
gate, its reviewer context would be polluted with irrelevant RFP-section instructions. The
code carried an explicit comment flagging this as a known gap ("Making the gate
artifact-aware... is the follow-up").

This release closes that gap. The D09-specific coverage-map block is now scoped to d09
only. The review context now also carries artifact-specific requirements pulled from the
existing `source-artifact-profiles.ts` registry (decision purpose, audience, risk depth,
required exhibits) — the same registry [[2026-07-20-source-artifact-governance-labels]]
already reads for governance-banner gating — so the reviewer judges each artifact against
its own stated bar instead of an implicit RFP-shaped one. Coverage is extended, behind a
new `SOURCE_QUALITY_GATE_EXPANDED` env flag (default off), to four other high-stakes
narrative/decision artifacts whose profile (`riskDepth` high/board-grade, `readerMode`
executive-narrative/decision-brief/vendor-pack) matches what this rubric was written to
grade: the Sourcing Strategy Memo (d01), Scope Boundary Memo (d05), Executive Award
Recommendation (d24), and Selection Memo (d27).

Two artifact-code vocabularies collide in this codebase: `source-artifact-profiles.ts`
keys by short code ("d01"), the generation pipeline keys by long code
("d01_strategy_memo"). Every long code is `<shortCode>_<slug>`, so the fix splits on the
first underscore rather than adding a second mapping table — documented inline as a
boundary note, matching the pattern used for the short/long duality already called out in
`artifact-governance.ts`.

## Layer Impact

- `global-control-lane`: Source artifact generation (`generate/route.ts`,
  `agent-generation/quality-review.ts`) for all tenants. The D09 leakage fix and
  profile-context injection are unconditional and low-risk. The gate-expansion to
  d01/d05/d24/d27 is real production behavior change (added review + possible rewrite
  latency, new failure mode if a previously single-pass artifact doesn't clear the bar) —
  it stays behind `SOURCE_QUALITY_GATE_EXPANDED`, default off, until each newly-gated code
  has a live-proof pass.
- No database, migration, ingestion, or tenant-data change.

## Client Applicability

- All clients: yes, for the D09-scoping fix and profile-context injection (always on).
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `SOURCE_QUALITY_GATE_EXPANDED` (default off) gates d01/d05/d24/d27 joining
  the quality gate. d09 remains gated unconditionally, as before.

## Changes Included

- `src/lib/source/agent-generation/quality-review.ts` — scope the D09 evidence-coverage
  context block to `d09_rfp_pack` only; inject `source-artifact-profiles.ts`-derived
  per-artifact requirements into the review context; replace the single-entry gate set
  with an always-on set (d09) plus a flagged expanded set (d01/d05/d24/d27).
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts` — pass
  `artifactCode` into `buildSourceQualitySourceContext`.
- `src/lib/source/agent-generation/__tests__/quality-review.test.ts` — updated call sites
  for the new required `artifactCode` param; new tests for the D09-leakage fix, the
  profile-context injection, the flag-gated expansion, and the unregistered-code fallback.
- This release record.

## QA / Validation

- `pass` — Focused Jest:
  `npx jest --runTestsByPath src/lib/source/agent-generation/__tests__/quality-review.test.ts src/lib/deliverables/quality/__tests__/consulting-grade-rubric.test.ts`
  — 20/20 passed.
- `pass` — Broader Source regression check:
  `npx jest --testPathPatterns="src/lib/source|src/app/api/v1/source"` — 2197/2229 passed,
  10 suites / 32 tests failing. Confirmed via `git stash` + re-run that the identical 10
  suites / 32 tests fail on the unmodified branch — these are pre-existing failures
  unrelated to this change (capitalization drift in `ava-intake-response-parts.test.ts`,
  format-list drift in `artifact-binding-matrix.test.ts`, etc.). This change added 3 net
  new passing tests (2194 → 2197) and zero new failures.
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
  — clean, no errors.
- `pending` — `npm run release:check` — to run before PR.
- `not run` — Live signed-in proof of the gate actually firing in production. The
  D09-scoping fix and profile-context injection are exercised only through unit tests;
  they change what text is assembled into a prompt sent to Claude, which is not something
  a browser click can directly observe. The flagged expansion (d01/d05/d24/d27) defaults
  off, so there is nothing to live-verify in production until it's explicitly enabled —
  by design, to avoid a live behavior change without a dedicated verification pass per
  newly-gated code.

## Rollout Plan

Merge to main via the repo-owned ACA main-deploy workflow (same path used for
[[2026-07-20-source-artifact-governance-labels]]). The D09-scoping fix and profile-context
injection take effect immediately on deploy (they only change what the d09 gate already
does, for the one code it already gates). The gate expansion is inert until
`SOURCE_QUALITY_GATE_EXPANDED=1` is set on the ACA web/worker environment — a separate,
explicit follow-up action, not part of this deploy's rollout.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none beyond the standard main-deploy workflow.
- Approved image digest: recorded post-merge once the deploy run completes.
- ACA runtime invariant: to be verified post-deploy (template image = 100%-traffic
  revision image = worker images, matching approved digest).
- Worker image invariant: covered by the same main-deploy workflow step.
- Feature/env flag update path: `SOURCE_QUALITY_GATE_EXPANDED` is not set by this
  release — enabling it is a deliberate, separate follow-up requiring its own
  live-proof pass per newly-gated artifact code.
- Live signed-in proof required: no new UI surface to prove for this release (the flag
  stays off); the underlying D09-scoping fix is proven via the unit-test suite above.

## Rollback Plan

Revert the merge commit. No migration, no data mutation, no flag was flipped in
production by this release — a revert fully restores prior behavior with no cleanup
required.

## Audit Evidence

- PR URL: recorded post-open.
- Focused + broader Jest logs: `/tmp/qgate-jest.log`, `/tmp/qgate-jest2.log`,
  `/tmp/qgate-jest-baseline.log` (baseline comparison proving no regressions).
- Typecheck log: `/tmp/qgate-tsc.log`.

## Known Gaps

- The gate-expansion codes (d01/d05/d24/d27) were selected by manually cross-referencing
  `source-artifact-profiles.ts`'s `riskDepth`/`readerMode` fields against
  `exports/spec-builder.ts`'s `ARTIFACT_CODE_ALIASES` to confirm each long-code form —
  they are not derived programmatically at runtime from the profile registry. If a
  profile's `riskDepth` or `readerMode` changes later, this expanded set will not update
  itself; whoever changes a profile in a way that should affect gate coverage needs to
  update `SOURCE_QUALITY_GATE_EXPANDED_CODES` by hand.
- Other artifacts with a confirmed long-code alias but a workbook/log/cockpit
  `readerMode` (e.g. d04 app inventory, d16 scorecard, d19 pricing workbook) were
  deliberately left out of the expanded set — this rubric's dimensions
  ("polish_and_readability... table-led structure", "artifact_completeness") were written
  for long-form narrative documents, not structured workbooks, and applying it to those
  formats without redesigning the rubric would likely produce false failures. Building a
  workbook-appropriate rubric variant is a separate, undone piece of work.
- The three-vocabulary reconciliation flagged in
  [[2026-07-20-source-artifact-governance-labels]] (file-cabinet `ArtifactStatus`,
  registry `SourceArtifactApprovalState`, archetype `qualityBar`) remains untouched by
  this release; this adds a fourth touchpoint (the quality-review gate) that reads
  `source-artifact-profiles.ts` but does not attempt that reconciliation.
- `SOURCE_QUALITY_GATE_EXPANDED` has never been set to `1` outside tests — enabling it in
  any environment (including staging) needs its own deliberate pass with live generation
  proof for each of d01/d05/d24/d27, not just this release's unit-test coverage.
