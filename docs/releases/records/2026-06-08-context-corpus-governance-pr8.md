# 2026-06-08-context-corpus-governance-pr8 — New-dataset onboarding gate

## Release ID

`2026-06-08-context-corpus-governance-pr8`

## Status

`candidate`

## Plain-English Summary

PR-8 of the Context & Corpus Governance Framework: the onboarding gate. Every NEW
context/corpus dataset must declare a validated policy manifest BEFORE it loads —
no matter which agent (Codex, Claude Code) or operator runs the load — so a
dataset can never be loaded "and governed later." Adds a Zod-validated manifest
contract, a `manifests` check wired into the existing CI gate
(`validate:context-corpus`), a manifest registry directory + template, an
onboarding policy doc, and an AGENTS.md rule. The pure validator is unit-tested
and the gate was negative-tested (a manifest with a non-canonical client key
fails it).

## Layer Impact

**global-control-lane**: governance contract + CI enforcement + docs. New pure
validator (`src/lib/governance/dataset-manifest.ts`), a `manifests` subcommand in
the existing validator, npm script, `docs/governance/dataset-manifests/`
registry + template, `NEW_DATASET_ONBOARDING_POLICY.md`, AGENTS.md addendum. No
schema, no migration, no runtime path.

## Client Applicability

- All clients: any new dataset for any tenant must declare a manifest;
  `client_key` is validated against canonical keys (real client names rejected).
- No client-facing behavior change.
- Feature flag: none.

## Changes Included

- `src/lib/governance/dataset-manifest.ts` — Zod `DatasetManifestSchema` + `validateManifest`.
- `src/lib/governance/__tests__/dataset-manifest.test.ts` — 7 tests.
- `src/scripts/governance/validate-context-corpus.ts` — new `manifests` check.
- `docs/governance/dataset-manifests/README.md` — registry + rules.
- `docs/governance/DATASET_POLICY_MANIFEST_TEMPLATE.json` — fill-in template.
- `docs/governance/NEW_DATASET_ONBOARDING_POLICY.md` — the process.
- `AGENTS.md` — "New datasets declare a manifest first" rule.
- `package.json` — `validate:context-corpus:manifests`. Trackers updated.

## QA / Validation

- `jest dataset-manifest.test.ts` — **7/7 passed**.
- `npm run validate:context-corpus` — **all five checks green** (incl. new `manifests`).
- Negative-tested — a manifest with a non-canonical client key + short fields **fails** the gate.
- `tsc --noEmit` — **passed** (0 errors repo-wide).
- `eslint` (changed files) — **passed**.

## Rollout Plan

Merge to `main`. The `manifests` check runs on every governance-touching PR. New
datasets land a manifest under `dataset-manifests/` before loading.

## Rollback Plan

Revert this PR. CI/contract/docs only; no migration, no data, no runtime path.

## Audit Evidence

- PR URL + CI run. Manifest contract + tests + template + onboarding policy.
  Brief + PR-0..PR-6. AGENTS.md rule.

## Known Gaps

CI validates the manifests that exist; it cannot detect a load that skipped the
manifest entirely (that is enforced by the AGENTS.md rule + the operator/loader
process). A future tightening could require the loader/ACA job to assert a
matching manifest id before writing.
