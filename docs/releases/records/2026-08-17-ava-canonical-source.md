# 2026-08-17-ava-canonical-source — Stop telling clients their loaded data is not loaded

## Release ID

`2026-08-17-ava-canonical-source`

## Status

`candidate`

## Plain-English Summary

Asked how many applications and business functions a client has, aVa replied that the estate
"is not yet loaded into the connected enterprise context" — with `sources: []` and a coverage report
naming `enterprise_profile`, `program_inventory` and `evidence_ledger` as missing.

At that moment the landscape projection held thousands of that client's records and Home was
rendering them one click away.

Telling a client their own data is not loaded, when it is, is the most damaging thing this product can
do. It is worse than an error message: it is a confident, specific claim about their data maturity
that a reader has no reason to doubt and every reason to repeat to their board.

Six retrievers feed the ask path and all six returned nothing. Rather than chase each in turn, this
makes the canonical projection itself a source — the same store Home and Intelligence read, already
written and readback-verified. When the others find nothing, canonical still grounds the answer.

## Layer Impact

**Release lane: `client-data-lane`.** Read-only. Adds one source to the retrieval set.

## Client Applicability

- Specific clients: both active tenants
- Internal only: no
- Feature flag: none

## Changes Included

- `src/lib/intelligence/ask/canonical-landscape-source.ts`
- `src/lib/intelligence/ask/index.ts` — canonical source added ahead of the other tenant retrievers.

## QA / Validation

- Pass: `tsc -p tsconfig.json --noEmit` — 0 errors.
- Pass: `eslint` — 0 errors.
- Pass: `npm run release:check`.

The source emits counts, distinct names, evidence references and named examples as a structured
table — never prose. The model narrates these; it does not produce them, which is the P6 boundary.

## Rollout Plan

Merge, deploy, then ask the live surface the question that failed and confirm the answer cites
canonical.

## Deployment Authority

Repo-owned ACA main deploy workflow. No job, no data write.

## Rollback Plan

Revert. aVa returns to whatever the other six retrievers find, which today is nothing.

## Audit Evidence

- The failing response, with `sources: []` and coverage `missing`.
- The commit and its PR.

## Known Gaps

- **This does not fix the six retrievers.** It puts a floor under them. Why `curatedDossier`,
  `tenantStructuredFacts`, `tenantEnterprise`, `tenantTechnology`, `routed` and `worldview` all
  return nothing for a fully loaded tenant is a separate and still-open question, and the answer may
  be that the index refresh has never run for these tenants.
- **The coverage report may still say `missing`.** It checks for named segments — `enterprise_profile`,
  `program_inventory`, `evidence_ledger` — and this source does not claim those labels. The answer
  will be grounded and the coverage banner may still be pessimistic until the segment mapping is
  revisited.
