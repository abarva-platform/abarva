# 2026-08-18-orientation-pack-validator-determiners — Strip leading determiners; close the hole doing so opened

## Release ID

`2026-08-18-orientation-pack-validator-determiners`

## Status

`candidate`

## Plain-English Summary

The third live run (after the sentence-boundary fix) cleared the fail threshold on both tenants
for the first time: 23/31 (74%) on meridian-health, 24/33 (73%) on skyharbor-air, both at
`validation warn`. Nearly every remaining rejection shared one shape: `The Enterprise`, `The
Workforce`, `The Infrastructure`, `The Spend`, `The AI`, `The AI KPI`, `The System` — a
sentence-initial "The" glued onto the client's own dimension label, which sits in the very
aggregate being checked. "Enterprise" is not an unsupplied entity; "The Enterprise" is a phrase
nobody supplied, because nobody needed to — the determiner was never part of the name.

Fixed by stripping a leading determiner (`The`, `This`, `A`, `An`, `Our`, `Their`, `Its`, ...) from
a candidate before checking it, mirroring the trailing-possessive strip already in place.

That fix immediately opened a different hole, caught before it shipped: the sentence-start
single-word exemption (added in the prior PR for words like "However" and "Progress") was written
to check the position of the match, not whether a determiner had just been stripped off it. "The
Northgate deal fell through" strips to "Northgate" — a single word, at sentence start — and would
have been silently exempted, even though "Northgate" is capitalised because it is a name, not
because English grammar forces sentence-initial capitalisation. A test written specifically to
catch this (`still rejects a determiner-prefixed phrase whose core is not grounded`) failed
immediately, which is exactly why it was written before deploying rather than after.

Fixed by tracking whether a determiner was actually stripped, and withholding the sentence-start
exemption whenever it was — the exemption's rationale ("this word is capitalised only because it
opens a sentence") does not hold once a determiner already accounted for the sentence-initial
capital, and what remains is capitalised on its own merits and must clear the containment check
like anything else.

## Layer Impact

Lane: `global-control-lane`. Generator logic only.

## Client Applicability

All clients: yes, both active tenants.

## Changes Included

- `scripts/data-build/build-home-orientation-pack.ts` — leading-determiner strip, and the
  determiner-aware guard on the sentence-start exemption.
- `tests/behaviors/home-orientation-pack-validation.test.ts` — 3 new regression tests, including
  the one that caught the hole this PR closes before it reached a live run.

## QA / Validation

- `npx tsc --noEmit -p tsconfig.json` — PASS, 0 errors.
- `npx eslint` — PASS, 0 errors.
- `npx jest tests/behaviors/home-orientation-pack-validation.test.ts` — PASS, 21/21 (18 existing +
  3 new). One of the three failed on first write, exposing the exemption hole described above,
  before the fix for it was added.
- Diagnosed against a real ACA Job run (`job-abarva-private-operator-eus-a6oc8vk`, image digest
  `sha256:bab5ca21...`), captured at `./reports/home-orientation-pack/plan-retry2/`. Not yet
  re-verified after this fix.

## Rollout Plan

Merge to `main`. ACA main-deploy builds a new digest-pinned image. Rerun the orientation-pack plan
pass; if quality clears the pass/warn bar, proceed to the apply pass per standing instruction to
populate Home's orientation content.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR. The apply pass that follows a clean plan pass writes
  to `public.home_knowledge_packs` and is tracked as its own job execution with its own proof.
- Live signed-in proof required: not for this PR; required once Home is wired to read the pack.

## Rollback Plan

Revert the commit. No data was written under the prior validator state.

## Audit Evidence

Plan-retry2 job output at `./reports/home-orientation-pack/plan-retry2/04-logs.txt` shows the
exact rejection reasons this PR fixes on both tenants: `entity not in aggregate: The Enterprise`,
`The Workforce`, `The Infrastructure`, `The Spend`, `The AI` (three separate dimensions), `The AI
KPI`, `The System`.

## Known Gaps

- Not yet re-verified against live data post-fix.
- One outlier rejection (`entity not in aggregate: Ownership`, skyharbor `data_assets`) does not
  fit the determiner pattern and remains unaddressed; low volume, not blocking.
- Pluralised role summaries ("Presidents") remain an unaddressed, low-volume rejection cause from
  the first run.
