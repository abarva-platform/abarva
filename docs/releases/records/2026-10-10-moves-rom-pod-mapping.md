# 2026-10-10 — Moves ROM cost engine, increment 2b: proposed role mapping by tower, level clamping and the default licence basis

## Release ID

`2026-10-10-moves-rom-pod-mapping`

## Status

`candidate`

## Plain-English Summary

The third increment of the rough-order-of-magnitude (ROM) cost engine for
Moves. It carries out two product-owner decisions on the delivery pod
library that increment 2a imported. Nothing calls the pod helpers yet, so no
user sees a change.

**Decision A (product owner, 2026-10-10): proposed role mapping by tower,
never silent.** Increment 2a matched each pod's role labels to role codes by
exact name only, so 64 of 107 pods had a role with no code ("Developer",
"L2", "SF Architect") and could not be priced. And 29 pods whose roles all
matched still could not be priced: the pod's single blended level sat
outside a role's allowed level range, where no rate band exists.

- **Proposed mappings.** The converter now carries an explicit table,
  `GENERIC_ROLE_RULES`: 54 rules, each "in a pod of tower T, the exact label
  L is proposed role R", with a kind and a one-line rationale. Examples: in
  Application Engineering, "Developer" and "Engineer" → Software Engineer;
  in Managed Services, "L1", "L2" and "L3" → the matching support-tier role;
  in ERP, "Basis" → SAP Basis Consultant. There is no fuzzy or similarity
  matching. A rule fires only when the exact match found nothing, and only
  in its own tower. Its rows are labelled `match_method =
  proposed_by_tower`, `mapping_status = proposed_unapproved`, and they name
  the rule in `mapping_rule_id`. They are never labelled confirmed. Exact and
  alias matches are `confirmed`.
- **What stays unmatched.** No rule names labels that the tower cannot pin
  to one role. Examples: "Consultant" in ERP (SAP, Oracle or Workday),
  "Engineer" in towers with no single generic engineer, "Analyst" in
  Cybersecurity, "PM" (project or program manager) and "Delivery Mgr" (AMS
  or service delivery manager). "Automation Engineer" names two roles. It
  resolves only in Quality Engineering pods, through a rule that says
  `resolvesAmbiguity: true` and names one of the two candidates. Anywhere
  else it stays unmatched.
- **Level clamping.** A matched row's level is now the pod's blended level
  clamped into the role's allowed range. `level_code` is the priced level,
  `original_level_code` is the pod's level, and `level_adjustment` is
  `none`, `clamped_up` (raised to the role's junior bound) or `clamped_down`
  (lowered to its senior bound).
- **Never presented as confirmed.** `podMembersFromTemplate` still refuses
  any pod with an unmatched role. It accepts proposed mappings and clamped
  levels, but every member now carries provenance flags. From those flags
  the pod pricer writes "proposed role mapping, unapproved ("BI Dev" →
  ROL-041 by rule GR-09)" and "level clamped from LVL-08 to LVL-07" into
  four places: the member's FTE term source, its rate term source, its rate
  notes and the formula trace. It also lists them in a result-level
  `caveats` array. A workbook or document built from the result therefore
  cannot show these members as confirmed. The pricer refuses provenance
  that contradicts the member's own level. A caller that wants confirmed
  mappings only passes `requireConfirmedMappings: true`. A pod with any
  proposed role is then refused as `unconfirmed_role_mappings`, with each
  proposed role listed.

**Decision B (product owner, 2026-10-10): the licence basis defaults to
`per_agent`.** `agentCapacityScenario` no longer requires a licence basis. It
defaults to `per_agent`, the conservative choice: cost scales with agent
count, as on the Agent Economics sheet. `per_platform` is accepted only with
a non-empty `licenceBasisReason`. Without one it is refused as
`licence_basis_reason_required`. The output records the basis, the reason
(the caller's, or the recorded default reason) and whether the basis was
defaulted. The formula trace prints the basis and the reason.

### Coverage (real conversion)

| Measure | 2a | Now |
|---|---|---|
| Pods | 107 | 107 |
| Pods whose every role maps to a role code | 43 | **90** |
| …all mappings confirmed (exact/alias) | 43 | 43 |
| …with at least one proposed mapping | — | 47 |
| Pods priceable (every member has a rate band at its level) | 14 | **90** |
| …priceable with `requireConfirmedMappings: true` | 14 | 43 |
| Role rows | 258 | 258 |
| Exact / alias | 156 / 0 | 156 / 0 |
| Proposed by tower rule | — | 85 (57 tower + label pairs, 54 rules, every rule used) |
| Unmatched | 102 (58 labels) | **17 (7 labels)** |
| Levels clamped up / down | — | 81 / 11 (58 confirmed rows, 34 proposed) |
| Matched rows with no rate band at their level | 58 | 0 |

The 17 pods still refused have one of these 7 labels: "Engineer" (6, in
towers with no single generic engineer), "Consultant" (5, ERP), "AMS Lead"
(2), "Analyst", "Delivery Mgr", "Integration" and "PM" (1 each). They need a
product-owner rule or an authored role before they can be priced.

The 58 confirmed rows that are now clamped are exactly the 58 rows that
increment 2a reported as having no rate band at the pod's blended level.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 (canonical model): one reference CSV in the global pricing pack
  (`pricing_pod_template_roles.csv`) gains four columns and new values. It
  carries a rule table in the converter, a validator, the loader's parsed
  type, and two pure calculation helpers. There is no schema, migration,
  route, UI or generation wiring change.
- Products: none read the pod library or the helpers yet.

## Client Applicability

- All clients: no runtime or user-visible change.
- Specific clients: none. The pack is global reference data from the
  product owner's workbook and holds no client data.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none needed. Nothing calls the changed code paths yet.
  `requireConfirmedMappings` is the per-call opt-in for confirmed-only
  pricing.

## Changes Included

- `scripts/pricing/convert-pod-library.ts`. Adds `GENERIC_ROLE_RULES`, plus
  `validateGenericRoleRules`, which refuses a blank or duplicate id, an
  unknown tower, an unknown or retired role, an empty label list, or two
  rules claiming the same tower and label. Adds `proposeRoleByTower`. The
  conversion now clamps levels and has a `rules` input that defaults to the
  table. It adds coverage fields (proposed mappings, unused rules, clamps,
  priceable and confirmed-only counts). The manifest section now records
  the rule table. Pack version moves 1.2.0 → 1.3.0, and the 1.2.0 reason is
  kept under `previous_version_bump_reasons`.
- `scripts/pricing/validate-pricing-role-coverage.ts`. Adds
  `clampLevelToRoleRange`, which the converter and the validator share. It
  adds `proposed_by_tower`, the mapping-status vocabulary and its one
  required status per method, and the level-adjustment vocabulary. Every
  row's level must equal the clamp of the pod's level into its role's range,
  and its status must agree with its method. Only a proposed row may name a
  rule, and it must name one. Proposed and clamped rows produce warnings.
- `datasets/reference/pricing-engine-v1/pricing_pod_template_roles.csv`.
  Regenerated with `original_level_code`, `level_adjustment`,
  `mapping_status` and `mapping_rule_id`. Row count is unchanged (258).
  `pricing_pod_templates.csv`, `pricing_agent_profiles.csv` and the 17
  taxonomy CSVs are byte-identical.
- `datasets/reference/pricing-engine-v1/manifest.json`: version 1.3.0.
  `rom_pod_library` gains `generic_role_rules`, the new matching and level
  rules, and the new coverage.
- `src/lib/pricing/types.ts` and `src/lib/pricing/reference-pack-loader.ts`:
  add the new row fields and parse them.
- `src/lib/pricing/effort-engine/pod-pricer.ts`. Adds optional
  `PodMember.provenance`, `podMemberCaveats` and
  `PROPOSED_ROLE_MAPPING_CAVEAT`. Adds per-line and result-level `caveats`,
  caveat text in the FTE and rate term sources, the rate notes and the
  trace, and the `invalid_member_provenance` refusal. Members without
  provenance price exactly as before.
- `src/lib/pricing/effort-engine/pod-templates.ts`. Members take the row's
  level and carry provenance. Adds `requireConfirmedMappings` and the
  `unconfirmed_role_mappings` refusal, plus `allMappingsConfirmed`,
  `proposedMappingCount` and `clampedLevelCount`. Adds the
  `licenceBasis` default and the `licenceBasisReason` rule
  (`DEFAULT_AGENT_LICENCE_BASIS`, `DEFAULT_AGENT_LICENCE_BASIS_REASON`).
- Tests: new suite
  `src/lib/pricing/effort-engine/__tests__/pod-mapping-provenance.test.ts`.
  Three existing suites were extended:
  `scripts/pricing/__tests__/convert-pod-library.test.ts`,
  `src/lib/pricing/__tests__/pod-library-loader.test.ts` and
  `src/lib/pricing/effort-engine/__tests__/pod-templates.test.ts`. Their
  existing expectations changed only where the new columns or the licence
  decision changed the right answer. Example: a `per_platform` call now
  passes a reason.

## QA / Validation

- Pricing suites: pass. `npx jest src/lib/pricing scripts/pricing`: 51
  suites and 679 tests, up from 50 suites and 592 tests.
- Generic rules: pass. On an in-memory fixture, a rule proposes its role
  only in its own tower and only for the exact label. It never overrides an
  exact or alias match. A label with no rule stays unmatched. The proposal
  is independent of the rule table's order. The table refuses each defect
  class. An ambiguous label resolves only through a rule marked
  `resolvesAmbiguity` that names a candidate, and otherwise stays
  ambiguous. A rule naming a non-candidate throws. Against the committed
  taxonomy, every rule maps each of its labels to its declared role, with
  spot checks (for example Developer → Software Engineer and L1/L2/L3 → the
  support tiers). Eight labels with no rule stay unmatched, including
  "Automation Engineer" outside Quality Engineering.
- Committed data matches the table: pass. Every proposed row in the
  committed CSV names a rule for its pod's tower and label, with that
  rule's role. No unmatched row has a rule. The manifest records the
  current table. This needs no workbook.
- Clamping: pass. Up and down, a one-level range, unmatched rows keeping the
  pod level, and the band checked at the clamped level. An unknown level,
  an unknown bound or a backwards range is refused. The validator rejects a
  level that is not the clamp of the pod's level, a clamp in the wrong
  direction and an unapplied clamp.
- Provenance: pass. Members carry their flags. The exact strings
  "proposed role mapping, unapproved (…)" and "level clamped from X to Y"
  appear in the FTE term, the rate term, the rate notes, the line, the
  trace and the result's `caveats`. Confirmed, unclamped members read
  exactly as before. The terms still reconcile, and caveats change no
  number. Contradictory provenance is refused. `requireConfirmedMappings`
  refuses any proposed row and lists each one. Confirmed status requires
  both the method and the status. On the committed library, all 90 fully
  mapped pods price through the reference rate adapter, and every proposed
  or clamped member's terms carry the matching caveat. With
  `requireConfirmedMappings`, exactly the 43 confirmed-only pods build.
- Licence basis: pass. Default `per_agent` is recorded as defaulted with the
  default reason. An explicit `per_agent` records the caller's reason, or the
  default one. `per_platform` with no reason, an empty reason, a blank
  reason or a non-string reason is refused. With a reason, the reason is
  recorded (trimmed) and printed in the trace.
- Converter determinism: pass. Tests run on an in-memory ExcelJS fixture
  and never read the source workbook. The real conversion was run against
  the same workbook, and the sha256 check still guards it. A second run was
  byte-identical (`manifest.json` and `pricing_pod_template_roles.csv` hashes
  equal).
- Mutation checks: all 84 mutants killed. They covered the converter (33),
  the validator (20), the template helper and licence basis (18) and the
  pricer caveats (13). Each was applied alone and restored from an
  in-memory copy, with a hash check on restore. Two first-round survivors
  (the proposed-label pod dedupe and the proposed-mapping sort order) led
  to a new ordering test, which now kills both. Two validator clamp mutants
  are killed when the committed library fails validation at suite load,
  which is the intended guard.
- `npm run typecheck`: clean. eslint on every changed TypeScript file:
  clean.
- `npm run audit:lib-orphans`: no change against the baseline.
- `npm run validate:pricing-role-coverage`: PASSED. 107 pods, 90 fully
  role-matched and 43 confirmed-only. Three warnings: 17 unmatched rows,
  85 proposed rows and 92 clamped rows.
- Census regenerated: `testFiles` 2,936 → 2,937 and `coveredTestFiles`
  2,772 → 2,773. That is the one new `src/` suite, which
  `npx jest src/lib/pricing` sweeps.

## Rollout Plan

Merge through the protected main branch. The repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image. Nothing calls the
changed code, so the deploy changes no behaviour.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify the web template and the serving revision
  match the approved digest.
- Worker image invariant: verify the required worker images match the
  approved digest.
- Feature/env flag update path: none; no flag.
- Live signed-in proof required: none for this increment. There is no
  runtime or user-visible change.

## Rollback Plan

Revert through a pull request. No data, schema or caller depends on the new
columns, rules or options. The pack's taxonomy content hash is unchanged,
because the pod library is outside it. No taxonomy version is minted or
superseded.

## Audit Evidence

- Pull request and CI results.
- The coverage table, suites, determinism check and mutation results above.
- `manifest.json#rom_pod_library`: the rule table, row counts, checksums and
  coverage for the committed files.
- The suite `the committed pod library was produced by the current
  GENERIC_ROLE_RULES`. It fails if the rule table is edited without
  re-running the conversion, and it needs no workbook.

## Known Gaps

- **The 85 proposed mappings are proposals.** Each rule is a reviewable
  product-owner decision about a label in a tower, not a confirmation for a
  specific pod. Tower-level rules cannot see the pod's platform. For
  example, "Developer" in a ServiceNow pod is proposed Software Engineer,
  not a ServiceNow developer. Approving a mapping, or replacing it with a
  more specific role, means authoring an alias (which makes it `confirmed`)
  or changing the rule, then re-running the conversion.
- **Clamping changes the level that is priced, and the rate with it.** For
  example, the industry "SME" labels map to Principal SME roles, so a
  Senior pod's SME is clamped up to Principal. The caveat says so on every
  term. The product owner may still prefer the pod's level with a nearest
  band, or a different role.
- 17 pods (7 labels) remain unpriceable until a rule or role is authored for
  their labels.
- No consumer yet. No route, generation step or UI calls
  `podMembersFromTemplate`, `pricePod` with template members, or
  `agentCapacityScenario`.
- The agent profiles are still product-owner planning assumptions:
  `confidence = low`, `global_starter_unapproved`.
