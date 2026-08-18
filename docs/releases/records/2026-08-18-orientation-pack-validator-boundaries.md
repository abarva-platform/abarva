# 2026-08-18-orientation-pack-validator-boundaries — Fix two sentence-boundary bugs in the gate

## Release ID

`2026-08-18-orientation-pack-validator-boundaries`

## Status

`candidate`

## Plain-English Summary

The second live run (after the comma/percentage fix in the prior PR) still landed at
`validation fail` on both tenants -- but the rejection reasons had completely changed, which
confirmed the earlier fix worked and revealed two new, narrower bugs.

**A sentence-ending number lost its match.** The number-matching regex allowed an optional decimal
point followed by zero-or-more digits, so a figure at the end of a sentence -- "...totalling
$482,030,000." -- had the period swallowed into the token with nothing after it. No amount of
comma- or dollar-sign-stripping removes a bare trailing dot, so `$482,030,000.` could never match
the aggregate's `482030000`.

**A sentence boundary got glued into one fake entity.** The entity-matching regex allowed a bare
period inside a candidate, to support abbreviations like "U.S." -- but the same allowance let a
match run straight through an ordinary sentence-ending period into the next sentence's capitalised
opener. "...across Illinois, Indiana and Wisconsin. Revenue splits..." was captured as one
candidate, `Wisconsin. Revenue` -- not a real entity, and unfindable anywhere because it never
existed as a phrase in the first place.

A third, lower-severity pattern from the same run: ordinary sentence-opening words ("However",
"Progress", "Several", "Numerically") kept tripping the entity check because the prior fix's
allowlist only covered the specific words seen in the first run. Replaced the allowlist with a
positional check: a single capitalised word is exempt only when it is grammatically opening a
sentence, which generalises past any specific vocabulary instead of chasing it word by word.

None of these three are fabrication. All three are the gate mis-segmenting its own input.

## The fix

- Number pattern: `\.?\d*` (matches a bare trailing dot) replaced with `(?:\.\d+)?` (only consumes
  a decimal point when at least one digit follows it).
- Entity pattern: `.` removed from the interior character class. A real entity with an embedded
  abbreviation period is no longer matched with that period attached; the trade accepted, since the
  alternative was letting the regex cross sentence boundaries.
- Sentence-initial exemption changed from a hardcoded word list to a positional check: exempt only
  when the candidate is a single word and the text immediately preceding it (after trimming
  whitespace) is empty or ends in `.`, `!`, or `?`. A multi-word phrase opening a sentence is still
  checked.
- System prompt gained a rule against paraphrasing or compressing a named entity drawn from the
  aggregate -- addresses one remaining rejection class ("Medicare Advantage overall Star Rating"
  written back as "Medicare Advantage Star Rating") by asking the model to quote precisely, rather
  than loosening the containment check to accept near-matches.

## Layer Impact

Lane: `global-control-lane`. Generator logic only.

## Client Applicability

All clients: yes, both active tenants were affected identically.

## Changes Included

- `scripts/data-build/build-home-orientation-pack.ts` — number-pattern fix, entity-pattern fix,
  positional sentence-start exemption, one new prompt rule.
- `tests/behaviors/home-orientation-pack-validation.test.ts` — 4 new regression tests.

## QA / Validation

- `npx tsc --noEmit -p tsconfig.json` — PASS, 0 errors.
- `npx eslint` — PASS, 0 errors.
- `npx jest tests/behaviors/home-orientation-pack-validation.test.ts` — PASS, 18/18 (14 existing +
  4 new).
- Diagnosed against a real ACA Job run (`job-abarva-private-operator-eus-slq9wg2`, image digest
  `sha256:84e97a8e...`), captured at `./reports/home-orientation-pack/plan-retry/`. Not yet
  re-verified after this fix -- that is the immediate next step.

## Rollout Plan

Merge to `main`. ACA main-deploy builds a new digest-pinned image. Rerun the orientation-pack plan
pass against that image before any apply pass.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR. No write occurs until a subsequent apply pass.
- Live signed-in proof required: not for this PR.

## Rollback Plan

Revert the commit. No data was written under the buggy validator.

## Audit Evidence

Plan-retry job output at `./reports/home-orientation-pack/plan-retry/04-logs.txt` shows the exact
rejection reasons this PR fixes: `entity not in aggregate: Wisconsin. Revenue`, `entity not in
aggregate: IL. It`, `entity not in aggregate: Inpatient. Employment`, `entity not in aggregate:
Technology Officer. Succession`, `entity not in aggregate: However`, `entity not in aggregate:
Progress`, `entity not in aggregate: Several`, `entity not in aggregate: Numerically`, `number not
in aggregate: 5,664,000.`, `number not in aggregate: 7,898,000.`, `number not in aggregate: 499.`,
`number not in aggregate: $482,030,000.`.

## Known Gaps

- Not yet re-verified against live data post-fix. Immediate next step.
- Pluralised role summaries ("Presidents") remain an unaddressed, low-volume rejection cause.
- Whether the new prompt rule (quote entities verbatim) meaningfully reduces the paraphrase-gap
  rejection class is unproven until the next live run.
