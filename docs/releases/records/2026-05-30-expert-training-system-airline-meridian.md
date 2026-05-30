# Release Record: Expert Training System Airline and Meridian

## Release ID

`2026-05-30-expert-training-system-airline-meridian`

## Status

`candidate`

## Plain-English Summary

This release turns the Sentinel/Nexus expertise plan into persisted training
and evaluation assets. It adds a deterministic generator and creates 10,080
expert eval cases across SkyHarbor Airline and Meridian Healthcare.

The eval cases are not lightweight question prompts. Each case includes module,
agent, persona, domain, difficulty, expected evidence, retrieval plan,
deliverables, scoring rubric, red-team checks, and pass criteria.

## Layer Impact

- Evaluation data: `datasets/evals/*`
- Training doctrine: `docs/agent-training/EXPERT_TRAINING_SYSTEM.md`
- Generator: `scripts/eval/generate-expert-eval-system.mjs`
- Verification artifacts: `verification/expert-training/*`
- Runtime product behavior: no runtime code changes
- Data plane: no Azure/Postgres writes in this slice

## Client Applicability

- SkyHarbor Air / airline: primary.
- Meridian Health System / healthcare: primary.
- Apex Retail: pattern is reusable, but Apex eval cases are not generated in
  this slice.
- Other tenants: no direct data change.
- Feature flag: none.

## Changes Included

- Added the AbarVa Expert Training System standard.
- Added deterministic expert eval generator.
- Generated SkyHarbor Airline eval assets:
  - 84 domains
  - 5,040 eval cases
  - 1,008 cases each for Intelligence, Moves, Source, Tower, and Setup
- Generated Meridian Healthcare eval assets:
  - 84 domains
  - 5,040 eval cases
  - 1,008 cases each for Intelligence, Moves, Source, Tower, and Setup
- Added generation report proving both verticals pass the minimum rigor gate.

## QA / Validation

PASS — generation and built-in validation:

```bash
node scripts/eval/generate-expert-eval-system.mjs
```

Result:

- Total cases: 10,080
- SkyHarbor Air: 84 domains / 5,040 cases
- Meridian Health System: 84 domains / 5,040 cases
- Validation failures: 0

PASS — expected line counts:

```bash
wc -l datasets/evals/skyharbor-airline/expert-eval-cases.jsonl \
  datasets/evals/meridian-healthcare/expert-eval-cases.jsonl
```

Result:

- SkyHarbor Air: 5,040
- Meridian Health System: 5,040
- Total: 10,080

Planned before merge:

```bash
node scripts/eval/generate-expert-eval-system.mjs
git diff --check
npm run release:check -- --base origin/main --head HEAD
```

## Audit Evidence

- `verification/expert-training/2026-05-30-expert-eval-generation-report.md`
- `verification/expert-training/2026-05-30-expert-eval-generation-report.json`
- `datasets/evals/skyharbor-airline/manifest.json`
- `datasets/evals/meridian-healthcare/manifest.json`

## Known Gaps

- This release creates the expert eval corpus; it does not yet execute the
  cases against live Sentinel/Nexus/Source/Tower answers.
- The next slice must add a runner that samples these cases, invokes product
  retrieval/synthesis paths, and writes scored results.
- Apex Retail needs the same eval asset now that its 11,400-pattern retail AI
  corpus is loaded.

## Rollout Plan

1. Merge the generator, docs, eval datasets, and verification artifacts.
2. Use the manifests as the source of truth for case counts.
3. Build the eval runner in the next slice.
4. Promote demo-critical L8 cases into release gates for airline and Meridian.

## Rollback Plan

Revert this release PR to remove the eval generator and generated datasets.
No runtime behavior or Azure/Postgres data needs rollback because this slice
does not write to production data stores.

