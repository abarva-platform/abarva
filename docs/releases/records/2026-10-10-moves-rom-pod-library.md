# 2026-10-10 — Moves ROM cost engine, increment 2a: delivery pod library and agent economics

## Release ID

`2026-10-10-moves-rom-pod-library`

## Status

`candidate`

## Plain-English Summary

The second increment of the rough-order-of-magnitude (ROM) cost engine for
Moves. It imports two sheets of the cost-foundation workbook that the
reference-pack converter never read, and adds two pure helpers that use them.
Nothing calls the helpers yet, so no user sees a change.

- **Delivery pod library.** 107 reusable delivery pods (for example a data
  product pod: a data product manager, a data architect, three data engineers
  and a BI developer). Each pod has a tower, a headcount, one blended level
  and an agent mix. Its role mix is free text, which is parsed: "3x Data
  Engineer" and "Data Engineer x3" both mean 3 FTE. Each role label is matched
  to a role code by exact equality with a canonical role name or an existing
  alias. **A role is never guessed.** A label that matches nothing, or matches
  two roles, stays `unmatched` with no role code, and the converter prints a
  coverage report.
- **Agent profiles.** Five agent types with a monthly cost, an equivalent
  engineering FTE, a utilization and four capacity-gain multipliers. These
  are the product owner's planning assumptions with no external source. Every
  row is labelled `confidence = low`, `approval_status =
  global_starter_unapproved` and `assumption_basis =
  product_owner_planning_assumption_no_external_source`. The validator refuses
  any other label, so they can never be presented as researched.
- **Pods into the pod pricer.** `podMembersFromTemplate` turns a pod into the
  members the increment-1 pod pricer takes, at one delivery location and
  optional provider class. If any role in the pod is unmatched, the whole pod
  is refused and the unmatched roles are listed. It never prices a smaller
  team than the pod describes. Agents are not members and add nothing.
- **Agent capacity scenario.** `agentCapacityScenario` applies agents as added
  capacity, exactly as the workbook's "Estimation Engine" sheet does:
  effective FTE = humans + Σ count × equivalent FTE × utilization. It also
  returns the licence cost per month and reconciling formula terms. It runs
  only when a caller asks for it. Its output is labelled `assumptionStatus:
  "unconfirmed planning assumption"`, so later wiring can record it as an
  assumption register row. **No productivity credit is applied anywhere by
  default**; the four gain multipliers are echoed and used nowhere.

### Role-match coverage (real conversion)

| Measure | Count |
|---|---|
| Pods | 107 |
| Pods whose every role maps to a role code | **43 of 107** |
| …of which every member also has a rate band at the pod's blended level | 14 |
| Role rows (one per role-mix entry) | 258 |
| Matched exactly to a canonical role name | 156 |
| Matched through an alias | 0 |
| Unmatched | 102 (58 distinct labels) |
| Matched rows with no rate band at the pod's blended level | 58 |

The 64 pods with an unmatched role are refused by `podMembersFromTemplate`
until someone authors aliases or roles for their labels. The most frequent
unmatched labels are generic or abbreviated: "Developer" (9), "Engineer" (9),
"L2" (6), "Consultant" (5), "AI Architect" (4), "L3" (4) and "SF Architect"
(4). One label is ambiguous rather than unknown: "Automation Engineer" names
two roles, so it is left unmatched instead of being resolved by tower. The
full list is in the converter's output and counted in
`manifest.json#rom_pod_library.role_match_coverage`.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 (canonical model): three new reference CSVs in the global pricing
  reference pack, plus their loader, validator and two pure calculation
  helpers. No schema, migration, route, UI or generation wiring changes.
- Products: none read the new files or helpers yet.

## Client Applicability

- All clients: no runtime or user-visible change.
- Specific clients: none. The pack is global reference data from the product
  owner's workbook; it holds no client data.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none needed. Nothing calls the new code paths yet.

## Changes Included

- `scripts/pricing/convert-pod-library.ts` (new): reads the "Delivery Pods"
  and "Agent Economics" sheets with ExcelJS, writes the three CSVs and the
  `rom_pod_library` manifest section, and prints the coverage report. It
  refuses a workbook whose sha256 differs from the one the pack was built
  from, and fails on structural defects: drifted headers, an unknown tower,
  level or agent type, a duplicate pod, or a role mix whose FTE does not sum
  to the pod's headcount. It writes no timestamp, so a re-run is
  byte-identical (checked). It is a sibling of the PR1 converter, which
  rewrites the whole manifest and would drop the PR4 section.
- `datasets/reference/pricing-engine-v1/`: `pricing_pod_templates.csv` (107
  rows), `pricing_pod_template_roles.csv` (258), `pricing_agent_profiles.csv`
  (5). `manifest.json` moves to 1.2.0. The earlier version reason is kept
  under `previous_version_bump_reasons`. The new `rom_pod_library` section
  records row counts, checksums, the matching and level rules, the columns
  not imported, and coverage. The 17 earlier CSVs are unchanged.
- `scripts/pricing/validate-pricing-role-coverage.ts`: adds a pure
  `validatePodLibrary`, which `npm run validate:pricing-role-coverage` now
  also runs. Dangling or inconsistent references are errors. Unmatched rows
  are a warning.
- `src/lib/pricing/reference-pack-loader.ts`: adds `readPodLibraryDir`,
  `validatePodLibraryAgainstPack`, `parsePodLibrary` and `loadPodLibrary`.
  The library is deliberately kept out of `loadReferencePack`, the taxonomy
  content hash and `rowCountsByTable`, because no Postgres table exists for it.
- `src/lib/pricing/types.ts`: three typed row interfaces.
- `src/lib/pricing/effort-engine/pod-templates.ts` (new), exported from
  `effort-engine/index.ts`.
- `.github/workflows/unit-suites.yml`: one step runs `npx jest
  scripts/pricing/__tests__`. No workflow ran that directory before, so the
  existing coverage-validator suite was green and unrun. The census walks
  `src/` only and could not report it.
- Three new test suites: `scripts/pricing/__tests__/convert-pod-library.test.ts`,
  `src/lib/pricing/__tests__/pod-library-loader.test.ts` and
  `src/lib/pricing/effort-engine/__tests__/pod-templates.test.ts`.

### Column notes

- The pod's tower is emitted as `tower_code`, mapped by exact name from
  `pricing_towers.csv`, not as the tower's display name.
- Two columns were added beyond the original list: `agent_type`, the
  workbook's "Type", and `assumption_basis`, the planning-assumption label.
- Not imported: the pods' "Use Cases / Est. Monthly $" and Agent Economics'
  "Annual $". Both are formulas with no cached value.
- Each pod has one blended level and the workbook has no per-role level, so
  every role row inherits the pod's level.

## QA / Validation

- Pricing suites: pass. `npx jest src/lib/pricing scripts/pricing`: 50 suites
  and 592 tests, up from 47 suites and 500 tests. No existing test file was
  edited.
- Converter determinism: pass. Tests build a tiny ExcelJS workbook in
  memory, with no dependency on the source workbook, and read it with the
  CLI's own reader. Two conversions render byte-identical CSVs. Running the
  real conversion twice produced identical file hashes.
- Parser: pass. Tests cover "3x Role", "Role x2", "4 x Role", commas,
  whitespace, parentheticals, `&amp;`, single-pass entity decoding, and
  refusal of empty entries, two-sided and zero multipliers.
- No guessing: pass. Unknown, abbreviated, differently cased and
  trailing-space labels stay unmatched. Ambiguous labels stay unmatched with
  both candidates listed. Retired roles and inactive aliases are ignored.
- Loader round-trip: pass. The committed CSVs parse, re-serialize with the
  converter's headers and equal the committed bytes. Counts and checksums
  match the manifest. The validator reports no errors on the committed pack.
  A broken copy makes `loadPodLibrary` throw.
- `podMembersFromTemplate`: pass. Any unmatched role refuses the whole pod
  with every unmatched label listed, never a partial pod. On the committed
  library, every fully matched pod's members sum to its headcount. Those with
  bands price end to end through the reference rate adapter. Those without
  bands are refused as `no_rate_band`.
- `agentCapacityScenario`: pass. It reproduces the workbook's own worked
  example exactly. With 8 humans and 12 agents at 1.3 equivalent FTE and 0.72
  utilization, effective FTE is 19.232. With no agents, effective FTE is the
  humans alone. Per-line terms reconcile.
- No credit by default: pass. A pod's agent mix changes neither its weeks
  nor its cost. Members carry humans only. Changing the gain multipliers
  changes nothing the scenario computes.
- Mutation checks: 87 of 88 mutants killed. Each was applied one at a time
  and restored from an in-memory copy, with a hash check on restore. Four
  first-round survivors led to new tests: the duplicate agent row, the
  unmatched-label ordering, the per-pod dedupe and rows past a blank ID.
  Three of those mutants are now killed. The one remaining survivor is
  behaviour-neutral by construction. A member's level is read from the pod
  template instead of the role row, and the validator requires the two to be
  equal.
- `npm run typecheck`: clean. eslint on every changed TypeScript file: clean.
- `npm run audit:lib-orphans`: no change against the baseline.
- `npm run validate:pricing-role-coverage`: PASSED. It reports 107 pods (43
  fully matched) and one warning for the 102 unmatched role rows.
- Census regenerated: `testFiles` 2,934 → 2,936 and `coveredTestFiles`
  2,770 → 2,772. Uncovered files are unchanged at 164. The rise is two, not
  three, because the census walks `src/` only. The third suite lives under
  `scripts/pricing/__tests__`, which the new unit-suites step runs.

## Rollout Plan

Merge through the protected main branch. The repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image. Nothing calls the new
code, so the deploy changes no behaviour.

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
files or helpers. The pack's taxonomy content hash is unchanged, so no
taxonomy version is minted or superseded.

## Audit Evidence

- Pull request and CI results.
- The suites, determinism check, coverage table and mutation results above.
- `manifest.json#rom_pod_library`: row counts, checksums and role-match
  coverage for the committed files.

## Known Gaps

- **Only 43 of 107 pods map fully to role codes, and only 14 of those can be
  priced at their blended level.** Pricing more pods needs authored aliases
  for the 58 unmatched labels. Some labels are too generic to alias
  responsibly ("Engineer", "Developer", "L2"). The 58 matched rows without a
  band need a decision on level, because a pod's blended level sits outside
  some of its roles' allowed ranges.
- **The licence basis is a required choice because the workbook is not
  consistent.** "Agent Economics" prices each agent type per month. The
  "Estimation Engine" worked example charges one platform subscription for
  twelve agents. `per_agent` charges count × monthly cost. `per_platform`
  charges one monthly cost per agent type in use, matching the worked
  example. The product owner should confirm which is intended before wiring.
- No Postgres table or migration exists for the pod library. It is read and
  validated from the reference pack only.
- No consumer yet. No route, generation step or UI calls
  `podMembersFromTemplate` or `agentCapacityScenario`.
- The agent profiles have no external source and stay `low` /
  `global_starter_unapproved` until someone sources or approves them.
