# 2026-07-26-source-artifact-contract-registry — SourceArtifactContract (PR 4A)

## Release ID

`2026-07-26-source-artifact-contract-registry`

## Status

`released` — merged, deployed, and ACA runtime invariant verified. No live-behavior proof
required (nothing calls this module yet — see Known Gaps).

## Plain-English Summary

PR 4A of the Source stage/artifact governance workstream (`ADR-0013`, `ADR-0015`), sequenced
directly after the RLS/tenant-isolation workstream's closure. Today, stage eligibility,
upstream-artifact requirements, review authority, and downstream-context usability for Source's
33 artifact types (`d01`–`d33`) are scattered across three separate registries with no
cross-validation between them, and no shared function decides "is this artifact eligible to
generate right now" — each of the two live generation routes hand-rolls its own, different
answer. This release adds `SourceArtifactContract` (`src/lib/source/contracts/`) — a single,
typed, versioned, schema-validated contract per artifact code, composed by joining the three
existing registries rather than duplicating them into a fourth:

1. **`types.ts`** — the `SourceArtifactContract` interface, with every field required by the
   workstream's brief (stage, allowed generation stages, earliest eligible stage, required/
   optional upstream artifacts, evidence classes, generation mode, review requirement,
   acceptance authority, authoritative-use eligibility, supersession behavior, export
   eligibility, permitted formats, governance banner requirements, downstream consumers,
   quality-bar profile, evidence-lineage requirements, tenant/event isolation posture, finality
   conditions) and a doc comment on every field stating whether it reflects EXISTING enforcement
   or is a NEW target this contract names for a later sub-PR to wire in — no field silently
   overstates what the system already does.
2. **`build-registry.ts`** — composes the contract by joining `canonical-specs/artifact-specs.ts`
   (stage, family, requirement level, gate-defining), `agent-generation/prompt-registry.ts`
   (real, live upstream-dependency data, extracted programmatically via TypeScript's AST — not
   hand-transcribed), and `documentation-standards/source-artifact-profiles.ts` (audience,
   format, evidence mode). **Throws at module load if any code is missing from any of the three
   underlying registries** — this is the direct fix for "no cross-validation between
   registries": drift is now a startup error, not a silent gap.
3. **`schema.ts`** — Zod runtime schema, matching this repo's existing validation convention
   (`src/lib/governance/context-corpus-policy.ts`).
4. **`registry.ts`** — the public lookup API (`getSourceArtifactContract`,
   `requireSourceArtifactContract`, `contractsForStage`, `isArtifactEligibleAtStage`,
   `missingRequiredUpstream`) callers should use going forward instead of reaching into the
   three underlying registries directly.
5. **`ADR-0015`** — full design rationale, including a foundational stage-model finding: the
   workstream's originally-proposed 14-value stage list (`intake, market_scan, rfi, decision,
   award, contracting, closed`, …) does not match the real, canonical `SourceStageKey` model (11
   stages + 7 legacy aliases real event rows still use) — several proposed names aren't stages
   at all in the real system. Per explicit user decision, this contract is built on the
   EXISTING canonical stage model, not a new one.

## Layer Impact

- `global-control-lane`: new types, a composed registry, a Zod schema, and a lookup API — pure
  addition, nothing imports or calls this module yet. Zero behavior change for any live route.

## Client Applicability

- All clients: yes — no tenant-specific behavior. Internal only: no (this is the foundation for
  PR 4B/4C's route enforcement, which will be client-facing). Public/demo only: no. Feature
  flag: none.

## Changes Included

- `src/lib/source/contracts/types.ts` (new) — the `SourceArtifactContract` interface.
- `src/lib/source/contracts/build-registry.ts` (new) — the composition/join logic.
- `src/lib/source/contracts/schema.ts` (new) — Zod runtime schema.
- `src/lib/source/contracts/registry.ts` (new) — public lookup API.
- `src/lib/source/contracts/__tests__/registry.test.ts` (new, 18 cases).
- `docs/architecture/adr/ADR-0015-source-artifact-contract.md` (new).
- `docs/architecture/adr/README.md` — index entry.

## QA / Validation

- `pass` — new contract-coverage test suite (18 cases), run against the REAL, live registry
  data (not fixtures): one contract per `artifact-specs.ts` code, no missing/duplicate; every
  contract passes the Zod schema; every upstream reference (required and optional) is a real
  registered code; no artifact requires itself; **the required-upstream dependency graph has no
  cycles** (verified against the real 33-artifact dependency data); `allowedGenerationStages`
  always starts at the artifact's own stage; the 5 consulting-grade gate codes
  (`d01/d05/d09/d24/d27`) get the stronger review requirement and quality-bar profile;
  `d24_decision_brief`/`d27_selection_memo` require `d26_steward_signoff` as a finality
  precondition, every other artifact has none; `requiresVendorEventContext` is false before
  `rfp` and true from `rfp` onward; every contract's `tenantIsolationPosture` is honestly
  `standard_application_layer_tenant_scoping` (none silently claim the stronger RLS-enforced
  posture that only `VendorProposalFact` actually has); historical legacy stage aliases
  normalize to a stage this registry has real contracts for.
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p
  tsconfig.json` — zero errors.
- `pass` — `npx eslint` on all new files — zero errors, zero warnings.
- `pass` — regression sweep, `src/lib/source/**` (2387 tests): 2355 passing. 10 pre-existing
  failing suites (`stage-next-move`, `markdown-to-html`, `ava-intake-response-parts`,
  `artifact-binding-matrix`, `contract-optimization-mve`, `context-binder`, `markdown-to-docx`,
  `artifact-verdict-consistency`, `nexus-api-live-context`, `pricing-submissions/parser`) —
  confirmed unrelated: `git status` on this branch shows only new files added (this PR touches
  zero existing files besides the ADR README index), so these failures pre-exist on
  `origin/main` and are not a regression this PR introduced.
- `pass` — `node scripts/release-check.mjs --base origin/main --head HEAD` — Release Control
  Gate, Azure deployment lane check, Deploy Authority Gate, Pilot Data Loader Gate all passed.
- `pass` — CI on PR #5640 (all checks).

## Rollout Plan

Merge to `main` via PR, deploy through the repo-owned ACA main deploy workflow. No runtime
behavior change — nothing imports this module yet. PR 4B wires the generation routes to it;
PR 4C wires review/export/context-binding to it.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:ae98c77bb45e6ed2fe82ea09ab888b61279cf865c237ab8510935bf2f5fdcdd5`
  (merge SHA `930f00b1fa2be44d864f8014053f03aa76ff5108`, ACA revision
  `ca-abarva-web-lab-eastus--m930f00b1`).
- ACA runtime invariant: verified — deploy run
  [30187589527](https://github.com/abarva-platform/abarva/actions/runs/30187589527)'s "Verify
  ACA runtime invariant" step passed.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: no — this release adds no live-reachable code path (nothing
  calls this module yet); a passing deploy + schema-check is sufficient evidence for this PR.

## Rollback Plan

Revert the merge commit. Nothing imports this module yet, so rollback has zero blast radius on
any live behavior.

## Audit Evidence

- PR: [#5640](https://github.com/abarva-platform/abarva/pull/5640) (merge commit
  `930f00b1fa2be44d864f8014053f03aa76ff5108`).
- Deploy run: [30187589527](https://github.com/abarva-platform/abarva/actions/runs/30187589527).
- Sequencing decision: `docs/architecture/adr/ADR-0013-source-modernization-baseline.md`.
- Design decision: `docs/architecture/adr/ADR-0015-source-artifact-contract.md`.
- Prior workstream this follows: the RLS/tenant-isolation closure
  (`2026-07-26-vendor-proposal-facts-security-regression-harness.md` and its follow-ups).

## Known Gaps

- **Nothing calls this module yet.** PR 4B (generation/route enforcement) and PR 4C (review/
  export/downstream enforcement) are the sub-PRs that actually wire live routes to consult this
  contract — this release is the typed foundation, not the enforcement.
- **New fields (`acceptanceAuthority`, `exportEligibility`, `downstreamConsumers`) name intended
  targets, not existing behavior.** Named explicitly in ADR-0015 and in each field's doc comment
  — `source-access-policy.ts` has no per-artifact authority model yet; no live route gates
  export on governance stage yet; neither context-binder mechanism filters by artifact type yet.
- **The stage model migration to a richer/renamed set (`decision`→friendlier names, a real
  `closed` terminal stage, etc.) is explicitly out of scope** — this release builds on the
  existing canonical `SourceStageKey`, per explicit user decision after the stage-model mismatch
  finding in ADR-0015.
- **One incidental, unfixed finding**: `prompt-registry.ts` has 4 dead `_legacy`-keyed template
  entries, unreachable by any live lookup (confirmed via the AST extraction used to build this
  registry) — named in ADR-0015's Consequences section, left alone as out of this PR's scope.
