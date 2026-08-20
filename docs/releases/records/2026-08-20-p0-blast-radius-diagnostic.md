# 2026-08-20-p0-blast-radius-diagnostic — Read-only blast-radius diagnostic for the P0 overwrite defect

## Release ID

`2026-08-20-p0-blast-radius-diagnostic`

## Status

`candidate`

## Plain-English Summary

The P0 overwrite defect is closed at runtime (PR #6541, live-proven). This
answers the remaining question: **which existing Moves were actually damaged
before the fix landed, and which can be restored deterministically.**

It is **read-only**. It performs no writes and implements no repair. Repair is a
separate, reviewed change that this diagnostic exists to justify — running it is
how we find out whether a repair is needed at all.

Three layers are compared per field, because the damage could reach two of them:

```
charter.scaffold        preserved origination source (never overwritten)
      |
engagements.charter     top-level mirror — overwritable, but only for the
      |                 subset of fields the mirror actually wrote
program_modules p0      capture rows — overwritable
```

## The corruption rule is deliberately narrow

A field is called corrupt only when **all three** hold:

1. the live value is an **exact** known-boilerplate string,
2. a scaffold source value exists, and
3. the scaffold value **differs** from the live value.

"Looks generic" is never sufficient. A client may legitimately have written
something bland, and a false positive here would mean overwriting real client
text with a guess — the same category of harm the original defect caused.

## Two scoping details that prevent false positives

**Only the eight keys the broken client actually sent are assessed.**
`scope_out`, `outcomes_success` and `discovery_questions` were never in its
payload, so they are untouched by construction and are excluded.

**The charter mirror only wrote a subset of fields**, under renamed targets
(`initial_value_hypothesis` → `value_hypothesis`,
`stakeholder_owner_view` → `sponsor_candidate`). For a field the mirror never
wrote, "no charter value" is the _correct_ state, and the diagnostic marks it
`not_applicable` rather than flagging it. Without that distinction the report
would flag correct rows on exactly the fields that were never at risk.

## Classification

| Assessment                  | Meaning                                             | Action                |
| --------------------------- | --------------------------------------------------- | --------------------- |
| `clean`                     | Real, non-placeholder text                          | none                  |
| `never_captured`            | Empty — a legitimate state, not damage              | none                  |
| `likely_corrupt_repairable` | Known boilerplate, differing scaffold value exists  | restore from scaffold |
| `corrupt_unrestorable`      | Boilerplate on both sides — nothing to restore _to_ | human review          |
| `ambiguous`                 | Boilerplate with no scaffold source at all          | human review          |
| `not_applicable`            | The broken path never wrote this layer              | none                  |

`never_captured` is separated from `clean` deliberately: counting an empty field
as damage would inflate the blast radius with Moves that were simply never
filled in.

## The audit artifact

Every run writes a timestamped CSV and JSON to `reports/p0-blast-radius/`
(override with `--out=`), carrying `move_id`, `tenant_key`, `move_name`,
`capture_key`, the **verbatim untruncated** scaffold / charter-mirror / phase_0
values, both assessments and both recommended actions.

Values are untruncated on purpose: this is the before-image any repair would be
judged against, and an abbreviated value would make the audit unfalsifiable.
The artifact is written even on a clean run — "we looked and found nothing" is
itself a record worth keeping, and any repair PR must cite the file rather than
a console scrollback.

## Ambiguity is reported, not resolved

`recommendation_to_advance` has **no scaffold origin** — the old client hardcoded
it and origination never captured one. It can never be deterministically
restored, so it is classified `corrupt_unrestorable` and the Move is reported as
needing human review rather than being marked repairable.

## Layer Impact

Release lane: `internal-admin` (operator diagnostic; no product surface, no
schema change, no writes).

- **Layer 4 (Products):** none. Nothing in the product imports this.
- **Layer 3 (Canonical Model):** read-only. No migration, no write path.

## Client Applicability

- All clients: no change. Nothing runs automatically; this is an operator tool.
- Internal only: **yes**.
- Feature flag: none — an unreferenced script and a pure module cannot alter
  runtime behavior.

## Changes Included

- New: `src/lib/programs/p0-corruption-diagnostic.ts` — `diagnoseMove`,
  `summarizeBlastRadius`, `OVERWRITABLE_CAPTURE_KEYS`,
  `CHARTER_MIRROR_TARGETS`, `SCAFFOLD_SOURCE_KEYS`.
- New: `src/lib/programs/__tests__/p0-corruption-diagnostic.test.ts`.
- New: `scripts/moves/p0-blast-radius.mjs` — read-only runner
  (`--detail`, `--json`, `--out=<dir>`), emitting a durable CSV + JSON audit
  artifact on every run.

## QA / Validation

- `npx tsc --noEmit --pretty false` — 0 errors, full project.
- `npx eslint` on both new source files — 0 errors, 0 warnings.
- 18 new tests. The important ones assert what the diagnostic **refuses** to do:
  bland-but-real text is not flagged; an empty capture value is clean rather
  than corrupt ("never captured" is a legitimate state); boilerplate with no
  scaffold source is `corrupt_unrestorable` rather than silently repairable; a
  scaffold that happens to equal the live value yields nothing to restore; the
  three never-sent keys are never assessed; and a field the mirror never wrote
  is `not_applicable` rather than flagged.
- Both layers are asserted independently — a corrupt charter mirror is detected
  even when the capture row is clean, and vice versa.
- Regression sweep `src/lib/programs` + `src/components/strategic-moves`: 3,567
  tests, 9 failing — the same 9 pre-existing failures. Zero new.

## Rollout Plan

Merge to `main`. Nothing executes on deploy. The script is run deliberately by
an operator from inside the VNet (ACA job or equivalent), since production
Postgres is not reachable from a laptop.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
  (existing, unmodified).
- Shared runtime mutators: none. This script cannot mutate anything.
- ACA runtime invariant: unaffected. Worker image invariant: unaffected.
- Live signed-in proof required: no — no user-visible behavior.

## Rollback Plan

Revert and merge. Removing an unreferenced module and script restores the prior
state exactly.

## Audit Evidence

- Local typecheck/lint/test output captured in this session's transcript.
- Defect that motivated it, and its live proof:
  `docs/releases/records/2026-08-20-p0-phase-capture-integrity.md`.

## Known Gaps

- **It has not been run against production yet.** The classification is tested;
  the actual blast radius is unknown until an operator executes it inside the
  VNet. Expected to be small — the live proof showed the read path was the only
  broken part, and only Moves where someone actually clicked P0 Approve & Build
  could have been damaged — but "probably none" is not evidence.
- **No repair is implemented, deliberately.** Repair needs backup, dry-run,
  exact before/after, per-field audit rows and a reviewed candidate list. It
  should be built against a real diagnostic output, not in anticipation of one.
- **`recommendation_to_advance` can never be auto-restored** — no origination
  source exists. Every Move corrupt in that field will require human review.
- **The script assumes `clients.client_key` is the tenant identifier.** If the
  join is wrong the tenant column will read `(unknown)`; that affects reporting
  only, not classification.
