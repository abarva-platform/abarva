# 2026-08-18-orientation-pack-validator-precision — Fix the validation gate's own comparison bugs

## Release ID

`2026-08-18-orientation-pack-validator-precision`

## Status

`candidate`

## Plain-English Summary

The first live run of the orientation pack generator, against real canonical data through an ACA
Job with a real Anthropic key, produced a 42–45% narrative acceptance rate on both tenants —
`validation_status: fail`. The gate correctly refused to ship that content. This fixes the two
root causes, found by reading every rejection reason from that run.

**Comma-normalization asymmetry.** The validator strips thousands-separator commas from the
number it is checking, but never stripped them from the aggregate it is checking against. A model
that wrote "68,000" — copied verbatim from the aggregate's own `People: 68,000` fact — was
rejected, because the search term became `68000` while the aggregate still read `68,000`. Every
comma-formatted fact value failed this way: population counts, evidence-coverage counts. The
number was right; the comparison was wrong.

**Unformatted fractions.** Dimension aggregates carry raw, unrounded shares — `0.6283185840707965`
— because that is the form other consumers of the stored profile need. A model asked to narrate
that number does what a person does: writes "62.8%". The unrounded float can never appear verbatim
in prose, so any dimension with a concentration, coverage, or distribution figure failed
regardless of whether the model's arithmetic was correct.

Neither cause is fabrication. Both are the gate being unable to recognise the aggregate's own
values once a human — or a competent model — expressed them the way a human would.

## The fix

- `stripThousandsCommas()` normalizes both sides of every numeric comparison identically.
- Dimension aggregates sent to the model now carry pre-rounded, pre-formatted `*Percent`
  companion fields (`topSharePercent`, `sharePercent`, `topTenSharePercent`,
  `populatedSharePercent`) alongside the raw fractions. The system prompt instructs the model to
  quote these fields exactly rather than compute its own rounding — removing the mismatch instead
  of loosening what counts as a match.
- Two smaller, lower-volume rejection causes fixed the same way: a possessive ("Meridian's") is
  now resolved to its base form before the entity check, and the system prompt instructs the model
  to always write digits rather than spell out numbers ("26" not "twenty-six").

The gate's strictness is unchanged: every number and every named entity in generated prose must
still trace to the aggregate, exactly. What changed is that the aggregate and the comparison now
speak the same representation the model is asked to write in.

## Layer Impact

Lane: `global-control-lane`. Generator logic only — no schema, no canonical data, no stored
`DimensionProfile` shape change (only the copy sent to the model gains formatted companion
fields; nothing written to `home_knowledge_packs` or read by the UI changes shape).

## Client Applicability

All clients: yes, both active tenants were affected identically.

## Changes Included

- `scripts/data-build/build-home-orientation-pack.ts` — `stripThousandsCommas()`, possessive
  handling, pre-formatted percentage companions in the dimension aggregate, two new system-prompt
  rules.
- `tests/behaviors/home-orientation-pack-validation.test.ts` — 4 new regression tests.

## QA / Validation

- `npx tsc --noEmit -p tsconfig.json` — PASS, 0 errors.
- `npx eslint` — PASS, 0 errors.
- `npx jest tests/behaviors/home-orientation-pack-validation.test.ts` — PASS, 14/14 (10 existing +
  4 new, covering the comma fix in both directions, the percent-companion fix, and the possessive
  fix).
- Not yet re-run against live data. That is the next step this PR unblocks: redeploy, rerun the
  plan pass against the same two tenants, confirm the acceptance rate clears the pass threshold
  before any write.

## Rollout Plan

Merge to `main`. ACA main-deploy builds a new digest-pinned image. Rerun the orientation pack
plan pass against that image before any apply pass.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR. No write occurs until a subsequent ACA Job apply pass,
  tracked separately.
- Live signed-in proof required: not for this PR.

## Rollback Plan

Revert the commit. No data was written under the buggy validator — it correctly refused to write,
which is why this fix exists rather than a data cleanup.

## Audit Evidence

- Plan-pass job execution `job-abarva-private-operator-eus-mwhkpwe`, run against image digest
  `sha256:4f298a0e...`, captured at `./reports/home-orientation-pack/plan-20260818/`. Console
  output shows the specific rejection reasons this PR fixes: `number not in aggregate: 68,000`,
  `number not in aggregate: 92,000`, `number not in aggregate: 0.628`, `number not in aggregate:
  8.9%`, `entity not in aggregate: Meridian's`, among others.

## Known Gaps

- Not yet re-verified against live data post-fix. Tracked as the immediate next step.
- Two lower-value rejection causes remain unaddressed: pluralized role summaries ("Presidents")
  and a small number of dimension-specific edge cases visible only past the log's 8-item preview
  per tenant. These are lower volume and the gate correctly withholds narration rather than
  guessing; not blocking.
