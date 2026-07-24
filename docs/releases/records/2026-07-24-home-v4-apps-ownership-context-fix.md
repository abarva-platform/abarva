# 2026-07-24-home-v4-apps-ownership-context-fix — Pipeline fix + contradiction QA gate

## Release ID

`2026-07-24-home-v4-apps-ownership-context-fix`

## Status

`candidate`

## Plain-English Summary

Root-cause fix for a governance failure found the same day: PR #5559 added real, deterministic
application-ownership data to the `/home/v4-preview` Applications grid, but the Claude-authored
narrative on the same page was never regenerated with that data — so the page shipped internally
inconsistent (narrative said ownership was "unassigned"; the grid right below it showed 682 of
900 applications with a real owner). That was a publish-pipeline gap, not a wording problem: a
material source-data change did not trigger narrative regeneration.

This release fixes the root cause of *why* the narrative didn't know about the new data, and adds
a deterministic check that would have caught the contradiction automatically before publish.

1. **Root cause**: `buildTenantContextPacket()` in
   `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs` only ever read
   `datasets/tenant-inputs/<tenant>/approved-content/home/design-contract-pack.json` — it never
   read `tower-standardized-v1/`, so no amount of re-running the existing pipeline would have
   surfaced the real ownership data to Claude. Fixed: added `loadTenantApplicationOwnershipFacts()`,
   which reads the same `tower-standardized-v1` source the Applications grid uses, folds a
   deterministic ownership-coverage summary into the context packet's
   `business_context_samples.application_ownership_coverage`, and folds that source's hash into
   `sourceHash` (so a future run's hash differs when this specific data changes). The per-dimension
   "Call 5: Dimension Writer" prompt pass — which is what actually generates the `apps` dimension's
   narrative — previously didn't receive `business_context_samples` at all; added
   `application_ownership_coverage` explicitly to that pass's prompt payload, plus an instruction
   telling Claude the coverage split is verified fact, not an estimate, and it must not claim
   universal ownership absence when it isn't true.
2. **Contradiction QA gate**: `scripts/knowledge/validate-dimension-contradictions.mjs` — a pure,
   deterministic (no model call) rule engine that computes real facts from a dimension's own
   `data_tab.full_rows` (owner coverage %, budget total, vendor count) and rejects the dimension if
   its narrative/gaps/relationship/evidence text contradicts those facts (e.g. claims "ownership is
   unassigned" when coverage is >0%). **Proven against the currently-live, currently-broken
   skyharbor-air apps dimension**: correctly fails with 2 named contradictions, exit code 1.

## Layer Impact

- `global-control-lane`: changes the Home Knowledge V4 operator pipeline script and adds a new
  validator script. No product-surface change in this PR — the fix takes effect the next time the
  `apps` dimension is regenerated for a tenant (a separate, explicitly authorized paid canary run,
  tracked outside this PR).

## Client Applicability

- Internal only — pipeline/tooling change, no client-facing surface changes in this PR.
- Feature flag: none.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`: adds
  `loadTenantApplicationOwnershipFacts()`, folds it into `sourceHash` and
  `business_context_samples`, and threads it into the `apps` dimension's actual generation prompt
  (previously silently dropped by the dimension-writer pass's narrower payload shape).
- `scripts/knowledge/validate-dimension-contradictions.mjs` (new): deterministic contradiction QA,
  runnable standalone (`node validate-dimension-contradictions.mjs <fixture.json> [dimensionKey]`)
  or importable as `validateDimension()`.

## QA / Validation

- `pass` — `npx eslint` on both files, exit 0.
- `pass` — local `--packet-only` run (`HOME_KNOWLEDGE_V4_TENANT=skyharbor-air node
  build-home-knowledge-v4-review-pack.mjs --packet-only`, **zero Claude calls, zero cost**):
  confirmed `business_context_samples.application_ownership_coverage` carries the correct real
  figures (900 total, 682 owned, 76%, correct source file lineage).
- `pass` — `validate-dimension-contradictions.mjs` run against the live (pre-fix) skyharbor-air
  fixture: correctly identifies both contradictions present in the currently-published narrative,
  exit code 1. This is the proof the gate works, captured *before* any regeneration.
- `pending` — the actual fix (does regenerated Claude output stop contradicting the grid) can only
  be proven by running the dimension-writer pass for real, which costs money and needs its own
  explicit authorization and its own verification — tracked as a separate, immediate follow-up,
  not bundled into this PR.

## Rollout Plan

Merge through the normal PR path → `aca-main-deploy.yml` builds and deploys the image the
operator pipeline runs from. After deploy: submit one governed ACA job
(`home:knowledge-v4:canary-job`, `HOME_KNOWLEDGE_V4_TENANT=skyharbor-air`,
`HOME_KNOWLEDGE_V4_DIMENSIONS=apps`, `EMIT_ACA_PROOF_BUNDLE=true`) to regenerate the `apps`
dimension for skyharbor-air only. Extract the proof bundle, run
`validate-dimension-contradictions.mjs` against the fresh output — publish only if it passes. This
is the "Applications canary" run explicitly authorized separately from this PR.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy after merge.
- Shared runtime mutators: none in this PR — no database writes. The follow-up canary run (tracked
  separately) is a governed ACA Job execution, not a shared-runtime web deploy, per
  `docs/ops/aca-data-build-job-rule.md`.
- Live signed-in proof required: no — this PR has no live product-surface change. The follow-up
  regeneration's proof requirement is the contradiction-QA pass/fail plus a human content review,
  not a browser screenshot.

## Rollback Plan

Revert the PR. The pipeline reverts to not knowing about `tower-standardized-v1` ownership data —
same behavior as before this fix, not a new risk (any content already generated stays as-is either
way; this only affects what a *future* generation run would produce).

## Audit Evidence

- `docs/audits/HOME-KNOWLEDGE-CONTEXT-INTELLIGENCE-YIELD-AUDIT-2026-07-24.md`
- Local `--packet-only` output confirming the real figures reach the packet (see QA above).
- `validate-dimension-contradictions.mjs` output against the live, pre-fix fixture, proving the
  gate catches the exact live bug before any money is spent on regeneration.

## Known Gaps

- This fix is scoped to the `apps` dimension's ownership-coverage claim specifically — the
  contradiction-QA rule set has 4 rules (owner coverage, owner-gap-node, budget, vendor count);
  more dimensions/claim types will need their own rules as they're found to have the same class of
  bug.
- Not yet wired into the pipeline as a hard publish gate (i.e. the build script doesn't yet refuse
  to write `client_visible` output that fails contradiction QA) — currently a standalone script to
  run manually after generation, before deciding to publish. Making it a hard gate inside the
  pipeline itself is a reasonable next step, not done here.
- The "stale artifact" tracking fields requested (`source_context_hash`, `generated_at`, `model`,
  `prompt_version`, `dependent_dataset_ids`, `generation_status` on every generated artifact, with
  render-time hash comparison blocking publication) is a larger, separate schema + runtime-gate
  change, not built in this PR. `sourceHash` now incorporates the ownership data (so it does
  change when this specific source changes), but full per-artifact staleness tracking and
  render-time enforcement is future work.
