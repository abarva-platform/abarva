# 2026-08-19-p4-business-case-contract-reconciliation — P4 business-case word band re-set to prose-only 3,000-5,000

## Release ID

`2026-08-19-p4-business-case-contract-reconciliation`

## Status

`candidate`

## Plain-English Summary

The P4 Business Case word band was 5,000-9,500 words. That number was set when
the document had to carry its own financial reasoning in prose. It no longer
does — the deterministic pricing and value model owns every authoritative
figure, and the document's job is to make the investment _argument_ and point at
those numbers. A 9,500-word board paper is a symptom of the model not existing,
not a quality bar. The band is now 3,000-5,000, advisory to 5,800, blocking
above that.

Tightening the band alone would have been unfair to well-exhibited documents,
because both quality pipelines counted table text as prose: the orchestrated
validator concatenates section markdown (so in-body markdown tables counted) and
the golden bar strips HTML tags but keeps table cell text. A word band is a
discipline on argument length; counting exhibits pushes authors toward fewer
tables and more paragraphs, which is the opposite of what every artifact
contract asks for.

So the two changes ship together: the band tightens, and length is now measured
as prose only — tables, exhibits, fenced blocks and appendix sections excluded.

Prose-only counting is **opt-in per artifact type**. Only `business_case` uses
it. Every other band was calibrated against whole-body counts and keeps its
current behavior exactly.

## Layer Impact

Release lane: `global-control-lane` (shared deliverable contract and quality
gate; no tenant data, no schema change).

- **Layer 4 (Products) — Moves.** Changes the P4 business-case depth contract and
  how body length is measured when a contract opts in. No UI, no route change.
- **Layer 3 (Canonical Model) — untouched.** No migration, no table, no field.

## Client Applicability

- All clients: no observable change today. The reconciled band reaches the
  orchestrated runtime only once `resolveQualityBar` is actually called on the
  Moves path — that wiring is a separate, later increment. The band is currently
  read by the golden-bar pipeline, which is not applied to Moves business cases.
- Specific clients: none enrolled in a behavior change by this release.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is to contract values and an opt-in counting
  rule, not to a runtime path.

## Changes Included

- New: `src/lib/deliverables/shared/body-word-count.ts` — `countBodyWords`,
  `countBodyWordsFromHtml`, `stripNonProseMarkdown`, `isAppendixHeading`.
- New: `src/lib/deliverables/shared/__tests__/body-word-count.test.ts`.
- Modified: `src/lib/deliverables/shared/artifact-contracts.ts` — new
  `WordBandContract.excludeNonProseFromBody`; `business_case` band re-set to
  3,000 / 5,000 / 5,800 with prose-only counting on.
- Modified: `src/lib/deliverables/orchestrator/types.ts` — `QualityBar`
  gains `excludeNonProseFromBody`.
- Modified: `src/lib/deliverables/orchestrator/quality-bar-registry.ts` —
  `wordBandFrom()` carries the counting rule through, so a band and the rule it
  was calibrated against can never drift apart.
- Modified: `src/lib/deliverables/orchestrator/quality-validator.ts` — body word
  count honours the flag. The full body string is deliberately left intact for
  leak scanning and claim scanning, which must still see table content.
- Modified: `src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts`
  — the existing business-case assertion encoded the old band; updated to the
  reconciled numbers, plus two new assertions covering the counting rule.

## QA / Validation

- `npx tsc --noEmit --pretty false` — 0 errors, full project.
- `npx eslint` on all 7 touched files — 0 errors, 0 warnings.
- 19 new tests. They assert behavior: legacy whole-body counting is reproduced
  exactly when the flag is off (guarding against silent tightening elsewhere);
  markdown tables, fenced blocks (including unterminated ones), inline HTML
  tables and SVG are excluded when it is on; ordinary inline tags keep their
  text; a table-only section counts zero; and every non-`business_case` band is
  asserted to still be on whole-body counting.
- A real defect was caught by these tests during development: the appendix
  heading matcher used a trailing `\b`, which matches at a hyphen, so
  "Appendix-free summary" was classified as an appendix and dropped from the
  body count. Fixed with a `(?![\w-])` lookahead and covered by a test.
- Regression sweep: `src/lib/deliverables` + `src/lib/programs/deliverables` —
  681 tests, 8 failing. Baseline with these changes stashed was 662 tests, the
  **same 8** failing. Net: 19 tests added, all passing, zero new failures. The
  8 pre-existing failures (First Capital golden-regression byte-stability
  snapshots, three P3 solution-prompt-factory brief assertions, two orchestrated
  business-case flow tests, one HTML-preview assertion) are unrelated and were
  verified failing identically before this branch's changes.
- No live signed-in proof: nothing in this release is observable in the product
  yet (see Client Applicability).

## Rollout Plan

Merge to `main`. `.github/workflows/aca-main-deploy.yml` builds and deploys as
usual. No tenant behavior changes on deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
  (existing, unmodified).
- Shared runtime mutators: none.
- Approved image digest: n/a — standard deploy workflow builds and pins.
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Live signed-in proof required: no.

## Rollback Plan

Revert the commit and merge to `main`. Nothing to un-migrate. Reverting restores
the 5,000-9,500 band and whole-body counting; because `excludeNonProseFromBody`
is opt-in and only `business_case` sets it, no other artifact's behavior moves
in either direction.

## Audit Evidence

- Local typecheck/lint/test output, including the stashed-baseline comparison,
  captured in this session's transcript.
- Motivating audit: `docs/design/strategic-moves/SOLUTION_PRICING_ENGINE_AUDIT.md`
  §5, which recorded the dead quality bar and the enforced 5-section/600-word
  floor.

## Known Gaps

- **The reconciled band is not yet enforced on the Moves runtime path.** The
  orchestrated builder still hardcodes a generic quality bar and never calls
  `resolveQualityBar`. That wiring is the next increment; this release
  deliberately fixes the contract first so the wiring activates correct values
  rather than stale ones.
- **The golden-bar pipeline still counts whole-body HTML.**
  `countBodyWordsFromHtml` exists and is tested, but `golden-bar.ts` has not
  been switched to it. Doing so is safe only per-artifact, for the same
  calibration reason as the markdown side.
- **The new band is a reasoned re-set, not a measured one.** No live generation
  sample exists at 3,000-5,000 prose words yet. The advisory band from 5,001 to
  5,800 exists precisely so the first real generations can overshoot slightly
  without being blocked while the section budgets are tuned.
- **Per-section token budgets are unchanged.** The document still generates at a
  flat 12,000 tokens per section regardless of section importance, and the
  32,000-token business-case ceiling is still read by only one of the two
  pipelines.
