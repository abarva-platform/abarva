# 2026-09-12-source-optimize-coherence — Optimize stops contradicting itself

## Release ID

`2026-09-12-source-optimize-coherence`

## Status

`draft`

## Plain-English Summary

The Optimize tab told a reader two opposite things on one screen. Near the top
it said the contract could not be sized until eight evidence families were
collected. Twelve lines below it showed $1.5M sized across six levers, four of
them described as calculation-backed. Anyone reading the page would conclude
the product does not know which is true.

The cause was two different populations answering the same question. The
workflow rail's gate scored the contract against the evidence-readiness model,
which carries template packs for a handful of contract shapes. It has no pack
for a cloud consumption commitment, so it fell back to a generic required list
built for managed-services and outsourcing deals — and reported every family
missing, including service levels and a staffing model, neither of which this
contract type has. The levers meanwhile read the opportunity set, which is
populated.

The gate now distinguishes the two cases. Where the readiness model has a
template pack for the contract, a missing required family is a real gate and
still holds the case — a traced amount can rest on incomplete evidence. Where no
pack matches, the required list is a default for other contract shapes, so the
rail no longer presents a block derived from it as a governed statement about
this contract.

Also removes two places where the same content rendered twice, and one piece of
builder vocabulary.

## Layer Impact

- `global-control-lane`: shared Source product behaviour, not feature-gated.
- **Layer 4 (Products · Source).** Presentation and the workflow-position
  derivation.
- **Layer 3 (Canonical model).** Unchanged. The evidence-readiness result gains
  a field reporting which template pack it scored against; no stored value
  changes.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `contract-optimization-evidence-readiness.ts` — the result now reports
  `archetypeKey`, or null when no template pack matched and the generic list was
  used. Callers could not previously tell a governed required list from a
  default one.
- `contract-optimization-workflow-step.ts` — the read-evidence gate holds on a
  governed required list as before, and stands down only where the list is a
  default and a traced opportunity already reproduces from a calculation run.
  The wording says which case applies.
- `WorkspaceExecutiveShell.tsx` — the Story tab rendered the purpose block and
  the governed narrative, both written from the same reviewed source, so one
  paragraph appeared twice; the narrative is now suppressed when it adds
  nothing the purpose block has not said. Removes the superseded consumption
  ramp, which charted the same spend rows as the Economics briefing alongside
  it.
- `Contract360Surfaces.tsx` — drops a third copy of the purpose paragraph this
  session added on top of the existing two.
- Tests: two regression cases on the workflow gate — one that an unmodelled
  archetype no longer blocks a contract whose opportunities trace, one that it
  still blocks when nothing traces.

## QA / Validation

- Reproduced live on `224c559b0` before fixing. Optimize showed
  `BLOCKED AT STEP 3 · READ EVIDENCE — No required evidence family has governed
  evidence yet` above `SIZED OPPORTUNITY $1.5M · 4 QUANTIFIED`. The contract
  detail API returned `ledger_items: 0` with `opportunities: 6`, confirming the
  two populations.
- `npx tsc -p tsconfig.json --noEmit` — clean.
- `npx eslint` on the workspace directory and data-model — clean.
- `npx jest 'preview/workspace' src/lib/source/contract-intelligence
  src/lib/source/data-model` — 38 suites, 307 tests, passing.
- The existing workflow tests caught an over-broad initial attempt: bypassing the
  gate whenever any opportunity traced defeated a legitimate governance hold on
  a modelled archetype. Narrowed, and the fixtures now declare which case they
  describe.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys. No
migration, no seed, no data build, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the workflow on merge.
- ACA runtime invariant: asserted by the workflow's own verification step.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes.** On the cloud-commitment contract,
  confirm Optimize no longer reports a step-3 block while showing a sized
  amount, that Story shows the purpose paragraph once, and that Economics shows
  one chart of the spend rows.

## Rollback Plan

Revert and redeploy. No migration and no data change.

## Known Gaps

- **The evidence-readiness model still has no template pack for a cloud
  consumption commitment.** This release stops a default list being presented
  as a governed one; it does not write the missing pack. Until one exists, the
  rail's evidence step is satisfied on opportunity traceability rather than on
  a required-family list written for this contract shape. That pack is the
  proper fix and is owed.
- **The required-family list is not archetype-applicability aware.** It can
  still name service levels for a contract type whose Performance facet is
  declared not required. Reconciling the evidence-template model with the
  archetype applicability model added earlier is a separate change.
- The design's tag-quality meters remain unbuilt — no field feeds them.
- The register/evidence identifier reconciliation is unchanged and remains the
  controlling data problem.

## Audit Evidence

- Commit on branch `claude/source-optimize-coherence`, based on `224c559b0`.
- CI run for the PR, including `npm run release:check`.
- Live reproduction and local validation recorded under QA / Validation.
- Post-deploy: the workflow's runtime invariant check and the signed-in proof
  named under Deployment Authority.
