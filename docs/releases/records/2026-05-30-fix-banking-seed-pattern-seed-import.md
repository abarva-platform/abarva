# 2026-05-30-fix-banking-seed-pattern-seed-import — Banking seed `PatternSeed` type missing

## Release ID

`2026-05-30-fix-banking-seed-pattern-seed-import`

## Status

`candidate`

## Plain-English Summary

Three banking Function Pack genome seed files added in PR #2628 (Wave 11) were missing the local `PatternSeed` type declaration that every other Wave 11 banking seed file carries as a trailing block. Each file opened with `export const ...: PatternSeed[] = [...]` but never declared `PatternSeed`, so `npx tsc --noEmit` failed with `Cannot find name 'PatternSeed'` on line 1 of each, plus hundreds of cascading "object literal may only specify known properties" errors. Main typecheck was red. This patch appends the canonical `PatternSeed` type definition (copied verbatim from the sibling `seed-banking-dom03-bsa-aml-part5.ts` Wave 11 file) to the bottom of each of the three broken files. No data shape change, no loader change — just the missing type so TypeScript can validate the literals that were already there.

## Layer Impact

- `runtime-app-lane`: no. These are build-time seed catalogs consumed by `scripts/corpus/load-authored-genome-seeds.ts`; they ship no runtime behavior. Adding the trailing `type PatternSeed = {...}` block restores typecheck without touching loader logic, data values, or DB rows.

## Client Applicability

- All clients: NO — no runtime change.
- Specific clients: N/A.
- Internal only: YES — fixes the developer typecheck signal only.
- Public/demo only: NO.
- Feature flag: none.

## Changes Included

- `src/scripts/seed/seed-banking-dom01-model-risk-part5.ts` — appended `type PatternSeed = {...}` block at end of file.
- `src/scripts/seed/seed-banking-dom05-consumer-lending-part5.ts` — appended `type PatternSeed = {...}` block at end of file.
- `src/scripts/seed/seed-banking-dom12-data-governance-part4.ts` — appended `type PatternSeed = {...}` block at end of file.

The appended type is byte-identical to the `PatternSeed` type already declared at the bottom of the sibling Wave 11 file `src/scripts/seed/seed-banking-dom03-bsa-aml-part5.ts`. TypeScript hoists type declarations, so a trailing block satisfies the `PatternSeed[]` annotation on line 1.

## QA / Validation

- `npx tsc --noEmit -p tsconfig.json` — **pass** (clean, zero errors).
- No tests touched; behavior is type-system only.

## Rollout Plan

- Merge PR → Vercel preview (Vercel preview ignorable per repo policy) → Vercel production. No DB migration, no env var, no cron, no flag.

## Rollback Plan

- Revert the PR. The prior state was "main typecheck red"; rollback only warranted if the appended type block somehow regresses an unrelated downstream consumer (none expected — these files are imported only by the genome seed loader, which reads the array values, not the type).

## Audit Evidence

- Original PR that introduced the missing type: #2628 (Wave 11 banking genome seeds).
- Typecheck error reproduction: `npx tsc --noEmit -p tsconfig.json` before fix → 3 × `Cannot find name 'PatternSeed'` + ~180 cascading `TS2353` errors on the three files. After fix → clean.
- PR link (added on merge).

## Known Gaps

- None. This is a literal restoration of the trailing type block that every other Wave 11 banking seed file already has. If future banking seed files are added, the trailing `type PatternSeed = {...}` block must be copied along with the data — consider extracting `PatternSeed` to a shared `src/scripts/seed/types.ts` so future omissions become impossible. Out of scope for this hotfix.
