# 2026-08-18-evidence-coverage-source-path-fix — Evidence coverage was checking the wrong field on six object types

## Release ID

`2026-08-18-evidence-coverage-source-path-fix`

## Status

`candidate`

## Plain-English Summary

Evidence-coverage checks across two generators looked only at the `sourceFile` attribute. Checked
against real canonical data while building the enterprise signal packet: `sourcePath` is the
universal evidence-reference field, present on all 28 canonical object types. `sourceFile` is
missing on exactly six — `semantic_crosswalk_evidence`, `service_performance_observation`,
`ai_value_realization_signal`, `ai_tool_usage_observation`, `ai_value_interview_evidence`, and
`ai_kpi_outcome_observation`.

The consequence was concrete and wrong in two places:

**In the new enterprise signal packet**, this produced six false `data_quality` signals stating
those dimensions were "0% evidenced" — including 586 rows of leadership interview evidence that
are, in fact, fully sourced. Had generation run before this was caught, the EnterpriseThesis prompt
would have received fabricated-sounding data-quality limitations about real, well-evidenced
content — the exact failure class this whole layer exists to prevent, just introduced by the
layer's own bug rather than by the model.

**In the already-merged, already-live orientation-pack generator**, the same bug means the
"evidence coverage" figure currently shown on Home's "Where we stand" tab and in "Explore the
data" panels understates real coverage for those same six dimensions system-wide. This has been
live since the orientation pack shipped earlier this session.

## The fix

Both checks now accept either field, preferring `sourcePath`:
`str(r.attributes.sourcePath) ?? str(r.attributes.sourceFile)`. Verified against real SkyHarbor
data: the six false data-quality signals are gone (0 remaining, down from 6) after the fix.

## Layer Impact

Lane: `global-control-lane`. Generator logic only in both files. No schema, no canonical write.

## Client Applicability

All clients — the orientation-pack half of this fix affects a number every tenant's Home page
displays.

## Changes Included

- `scripts/data-build/enterprise-signal-packet.ts` — `buildContextQualityManifest`'s
  `dimensionCoverage` computation.
- `scripts/data-build/build-home-orientation-pack.ts` — `evidenced` and `evidencedCount`, the two
  call sites feeding Home's displayed evidence-coverage figures.

## QA / Validation

- `NODE_OPTIONS="--max-old-space-size=6144" npx tsc --noEmit` — PASS, 0 errors, genuine clean exit
  (verified with the correct memory flag after discovering the unflagged command silently
  OOM-crashes on this machine — see the prior commit on this branch's history for that finding).
- `npx eslint` on both files — PASS, 0 errors.
- 41 tests across the three affected test files — PASS.
- Full suite (`npm run test:behaviors`) — PASS, 195/195.
- Verified directly against live SkyHarbor canonical data: 0 false data-quality signals remain,
  down from 6, after the fix.

## Rollout Plan

Merge to `main`. ACA main-deploy builds a new digest-pinned image. The orientation-pack half takes
effect on Home's live evidence-coverage figures the next time that pack is regenerated (not
automatic — requires a fresh apply run, tracked as an operational step, not part of this code
change). The signal-packet half takes effect the next time the EnterpriseThesis build runs, which
has not yet executed for the first time.

## Deployment Authority

Not applicable — no runtime image, flag, or shared configuration changed directly by this PR.

## Rollback Plan

Revert the commit. No data written by this change; a subsequent orientation-pack regeneration
after rollback would revert to understating coverage on the same six dimensions, matching the
pre-fix state exactly.

## Audit Evidence

Verified inline during this session: field presence checked across all 28 live canonical object
types on SkyHarbor, confirming `sourcePath` present on all 28 and `sourceFile` present on 22 of 28.

## Known Gaps

The orientation pack itself has not been regenerated since this fix — Home's live evidence-coverage
figures remain understated until that next runs. Tracked as the immediate operational follow-up.
