# 2026-09-11-source-c360-economics-and-thresholds — Economics, consumption mix, decision thresholds

## Release ID

`2026-09-11-source-c360-economics-and-thresholds`

## Status

`draft`

## Plain-English Summary

Completes the Economics tab and adds two surfaces the design specified and the
product did not have.

**Economics** now opens with a sentence about the commitment rather than a grid
of labels, charts consumption against the commitment pace, and reconciles
invoiced against paid. All three read the same loaded spend rows, so the opening
sentence, the chart and the reconciliation cannot disagree with each other the
way two independently-derived figures did before.

**Consumption mix** answers the question that actually matters on a contract
type with no service-credit regime: not whether the vendor delivered, but which
workloads are drawing on the commitment and whether that is the shape it was
sized for. Spend rows with no workload recorded show as unattributed rather than
being spread across the others.

**Decision thresholds** state, per contract type, what would change the
commercial position — written before the numbers move, so the response is a
policy rather than an argument.

## Layer Impact

- `global-control-lane`: shared Source product behaviour, not feature-gated.
- **Layer 4 (Products · Source).** Presentation, plus authored archetype
  playbook content on the education guide.
- **Layer 3 (Canonical model).** Unchanged. No schema, migration, loader or
  adapter is touched.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `Contract360Economics.tsx` — new. The Economics lede, the cumulative
  consumption-versus-pace chart with its legend, the invoice reconciliation
  panel, and the consumption mix.
- `education.ts` — `ContractEducationThreshold` and authored thresholds for the
  cloud-consumption, managed-services and fallback guides. Thresholds are
  authored per archetype and never derived from a contract's own figures: a
  threshold inferred from the data it is meant to judge is circular, and on a
  governed surface it would read as a finding rather than a rule.
- `Contract360Briefing.tsx` — renders the thresholds, degrading to no section
  rather than crashing if the array is absent from an older payload.
- `WorkspaceExecutiveShell.tsx` — mounts both new surfaces.
- `workspace.css` — chart frame, legend, reconciliation rows.

## QA / Validation

- `npx tsc -p tsconfig.json --noEmit` — clean.
- `npx eslint` across the workspace directory and contract-intelligence — clean.
- `npx jest 'preview/workspace' src/lib/source/contract-intelligence` — 20
  suites, 175 tests, passing.
- The existing briefing tests caught a crash: the thresholds array was read
  without a guard and an older payload without it took down the whole Education
  tab. Guarded, and the fixture updated.
- Not validated locally: the rendered tabs against live tenant data. These
  surfaces read the data plane through the client VNet, which a local dev server
  cannot reach.

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
- Live signed-in proof required: **yes.** On a contract with loaded spend
  months, confirm the Economics tab renders the lede, the chart with its legend
  and the reconciliation panel, that the consumption mix renders on Performance
  for a contract type with no service-credit regime, and that the Education tab
  renders the thresholds.

## Rollback Plan

Revert and redeploy. No migration and no data change.

## Known Gaps

- **The tag-quality meters from the design are deliberately not built.** No
  field in the contract view carries tag quality, so the meters would be an
  invented number on a governed surface. They stay unbuilt until a field feeds
  them. This is the one remaining surface of the design contract.
- **Invoice exceptions are stated as not a loaded lane, rather than as zero.**
  The reconciliation panel reports invoiced, paid and the difference, and says
  explicitly that no exception count is asserted either way. A real exception
  lane would be better than a difference calculation.
- **Thresholds are authored for three archetypes.** Guides without authored
  thresholds render no section rather than a generic one; the remaining
  archetypes need their own playbook content written, which is a writing task
  rather than a binding task.
- **The consumption mix reads the workload from the spend row.** Where a
  contract records no workload on its spend rows the whole mix collapses to one
  unattributed bar, which is honest but not useful. That is a data shape, not a
  display choice.

## Audit Evidence

- Commit on branch `claude/source-c360-remaining-surfaces`.
- CI run for the PR, including `npm run release:check`.
- Local validation recorded under QA / Validation.
- Post-deploy: the workflow's runtime invariant check and the signed-in proof
  named under Deployment Authority.
