# 2026-08-19-enterprise-thesis-targeted-repair — scoped verification with claim-level repair instead of claim deletion

## Release ID

`2026-08-19-enterprise-thesis-targeted-repair`

## Status

`candidate`

## Plain-English Summary

Refines the EnterpriseThesis verification pipeline built earlier this stretch. Structural
validation (real evidence IDs, cross-domain span) is unchanged and stays automatic. Entailment
verification now runs against a wider, precisely-scoped set of claim types — anything comparative,
causal, about leadership consensus/disagreement, or strategic-alignment — rather than only the
five categories from the first pass, but still skips purely descriptive narrative to avoid
flattening the writing.

The verdict taxonomy grows a fourth state, `SUPPORTED_INFERENCE`: reasonable, appropriately-hedged
synthesis across facts. This is not a defect and is published unchanged — the earlier taxonomy had
no way to distinguish a good inference from an unsupported one, so both routes ended up looking
alike downstream.

The bigger behavior change is what happens to a claim the verifier calls `OVERSTATED`. Previously
it was dropped outright. Now a separate, narrowly-scoped model call repairs only the specific
overstated element the verifier named (certainty, ranking, causality, consensus, or scope) while
preserving the rest of the claim's specificity and executive usefulness — deletion is now reserved
for `UNSUPPORTED` claims and for the rare case where repair itself fails.

Three objects are now persisted per tenant instead of one: `raw_generation` (untouched model
output), `published_generation` (after repair/drop), and `verification_ledger` (every claim's
verdict, reasoning, and what action was taken). Previously only the post-drop thesis was kept,
which made it impossible to audit what verification actually changed.

Separately, the generation schema's array sizes and section word counts are now stated as explicit
bounds in the system prompt (the schema is a narrative spine, not a report), and the output token
ceiling is lowered from 16,000 to 6,000 to match. The earlier ceiling was raised generously to fix
an unrelated empty-response bug and had the side effect of letting an unbounded schema produce
output long enough to hit that ceiling and truncate mid-JSON on the tenant with the richest source
data.

## Layer Impact

Lane: `global-control-lane`. Layer 4 (Products) generation tooling — `scripts/data-build/`
build script only. No canonical model or adapter changes.

## Client Applicability

- All clients: applies to any tenant this generator is run against.
- Specific clients: none.
- Internal only: yes — this is a data-build script, not a served route.
- Public/demo only: no.
- Feature flag: gated by existing `THESIS_WRITE` / `THESIS_WRITE_APPROVED` env vars; no DB write
  happens without both set.

## Changes Included

- `scripts/data-build/build-enterprise-thesis.ts` — `what_needs_attention` claim array added to
  the schema; `Verdict` taxonomy changed to `SUPPORTED | SUPPORTED_INFERENCE | OVERSTATED |
  UNSUPPORTED`; `VERIFIER_SYSTEM_PROMPT` rewritten with precise per-verdict definitions and
  overstatement triggers; `claimsRequiringVerification` scope widened; new `repairClaim` function
  and `REPAIR_SYSTEM_PROMPT`; `buildTenant` rewritten to repair (not drop) on `OVERSTATED` and to
  capture `raw_generation` before mutation; DB write restructured to store `raw_generation`,
  `published_generation`, and `verification_ledger` as separate keys in `render_pack`; main
  generation call's `max_tokens` lowered 16000 → 6000 alongside explicit schema bounds in
  `SYSTEM_PROMPT`.
- `tests/behaviors/enterprise-thesis-validation.test.ts` — fixture updated for the new required
  `what_needs_attention` field.

## QA / Validation

- `NODE_OPTIONS="--max-old-space-size=6144" npx tsc --noEmit -p tsconfig.json` — PASS, 0 errors,
  genuine clean exit (memory-flagged command per the standing local-tooling fix; bare `tsc` is
  known to silently OOM-crash on this machine).
- `npx eslint scripts/data-build/build-enterprise-thesis.ts
  tests/behaviors/enterprise-thesis-validation.test.ts` — PASS, 0 errors.
- `npx jest tests/behaviors/enterprise-thesis-validation.test.ts
  tests/behaviors/enterprise-signal-packet.test.ts` — PASS, 20/20.
- Not yet run: a live generation pass against real tenant data (requires `ANTHROPIC_API_KEY`,
  available only via ACA Job once this image is deployed). Tracked as a follow-up job run before
  any `THESIS_WRITE_APPROVED=true` apply.

## Rollout Plan

Merge to `main`. ACA main-deploy builds a new digest-pinned image containing this script version.
A fresh `data-build:enterprise-thesis:plan` job run (no DB write) against both tenants is the
first live validation of the new repair/verification behavior, followed by manual review of the
`raw_generation` vs `published_generation` vs `verification_ledger` output before any
`:apply` run.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR — no `az containerapp update` performed here.
- Live signed-in proof required: not for this PR; the follow-up job run is a plan-only pass,
  no product surface reads this artifact type yet.

## Rollback Plan

Revert the commit. No DB row has been written under this script version yet (the `THESIS_WRITE`
gate has not been enabled for a live run since this change), so rollback is a pure code revert
with no data migration needed. If a `:apply` run does happen before a rollback is needed, the
existing `home_knowledge_packs` retire-on-insert pattern means the prior candidate row (if any)
was already marked `retired`, not deleted — restoring the prior script version and re-running
`:apply` recreates a fresh candidate row from the reverted generator, it does not un-retire the
old one.

## Audit Evidence

PR link recorded at merge. Verification ledger for each future generation run is persisted in
`public.home_knowledge_packs.quality_report`, independently inspectable per tenant per run.

## Known Gaps

No live model call has exercised this code path yet — the repair function, the widened
verification scope, and the lowered token ceiling are all validated only by type/lint/unit tests
so far. A plan-only ACA Job run against both tenants is the immediate next step before any
conclusions are drawn about whether the repair behavior or the truncation fix actually work as
intended on real content.
