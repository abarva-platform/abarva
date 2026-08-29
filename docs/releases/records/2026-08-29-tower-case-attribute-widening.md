# 2026-08-29-tower-case-attribute-widening — Carry the decision attributes, stop substituting metrics

## Release ID

`2026-08-29-tower-case-attribute-widening`

## Status

`candidate`

## Plain-English Summary

Two changes to the Tower read path, both in service of the redesigned Command Center.

**Attributes products reason about now survive the projection.** The intake carries a
`gating_constraint` on every AI business case, a `control_blocker` on every tool rollout, and a
cost-to-build band, confidence level and sponsor role alongside them. All of these were dropped
where the canonical use-case and tool projections are built, so no product could ever read them.
`gating_constraint` is the load-bearing one: across the portfolio it — not the readiness score — is
what separates a validated case from a blocked one. Every case whose constraint was
"Finance value treatment" reached validation; none of the cases under the other four constraints
did. That finding is not expressible in the product today because the field never arrives.

**Readiness stops being invented.** The AI-portfolio reader resolved `readinessScore` as
`readiness_score ?? adoption_rate_percent ?? adoption_actual_pct ?? 25` — substituting a different
metric when the score was missing, then a literal when that was missing too. `riskScore` defaulted
to a literal `40` on the same pattern. This is why the shipped AI Portfolio table showed only two
distinct readiness/risk pairs across every row: most of what it displayed was synthesised by the
reader, not read from data. Both now read only their own key and return null when absent, and the
view reports absence through `readinessScoreLoaded` / `riskScoreLoaded` — the same idiom the file
already uses for `promisedBenefitLoaded` — so a surface can render a gap instead of a zero.

Also worth recording: `risk_pressure_score` is written upstream as `100 - readiness_score`. It
carries no signal independent of readiness, and any chart plotting one against the other is
plotting `x` against `100 - x`. The field is kept for compatibility and no longer defaulted.

## Layer Impact

Release lane: `global-control-lane` — shared app behavior for all clients, not feature-gated.

- **Layer 1 / canonical projection:** `generate-meridian-layer1-source.mjs` carries
  `gating_constraint`, `cost_to_build_low_usd`, `cost_to_build_high_usd` and
  `business_sponsor_role` into `canonical_ai_use_cases`, and `control_blocker`,
  `business_owner_role`, `rollout_stage` into `canonical_tools`. No values are changed; fields that
  already existed in intake stop being discarded.
- **Layer 4 / products:** those attributes plus `confidence_level`, `readiness_score` and
  `proof_needed` are added to the shared display payload, so they reach both `decision_lanes` and
  `ai_portfolio`, and the tool payload carries its blocker.
- **App read path:** the reader maps them onto the mart type; the view model and its public type
  expose them.

No metric definition, value, or gate rule changes.

## Client Applicability

- All clients: yes — any tenant whose Tower package is regenerated and reloaded.
- Feature flag: none.

## Changes Included

- `scripts/tower/generate-meridian-layer1-source.mjs`
- `scripts/tower/load-healthcare-demo-layer4-products.mjs`
- `src/lib/tower/readTowerCommandCenter.ts`
- `src/lib/tower/current-layer-view-model.ts`
- `src/lib/tower/command-center/view-model.ts`, `types.ts`
- `src/lib/tower/__tests__/case-attribute-widening.test.ts` (new)

## QA / Validation

- New contract suite → 11/11 pass. It pins each attribute at every layer it must survive, and
  asserts the absence of both fallback chains and both literal defaults.
- `jest src/lib/tower/__tests__ src/components/tower/command-center/__tests__` → 113 pass / 21 fail
  across 6 failed suites. Baseline measured on clean `origin/main` by stashing: 102 pass / 21 fail,
  6 failed suites. Identical failure count and suite set; the +11 are this change's own.
- `tsc -p tsconfig.json --noEmit` (8 GB heap) → clean. It caught the one real consequence of making
  readiness nullable — a consumer requiring `number` — which is resolved with the `…Loaded` flag
  rather than by rippling nullability through six UI call sites.
- `eslint` on all changed TypeScript → clean.
- `node --check` on both changed `.mjs` loaders → clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD` → passes with this record.

## Rollout Plan

Merge to `main` by squash; the repo-owned ACA main deploy workflow builds and deploys the app
change. **The data-plane half is not automatic:** the new attributes appear in a product only after
the Layer 1 package is regenerated and the Layer 3 and Layer 4 governed ACA jobs are re-run for the
tenant. Until then the reader returns null for every new field and every surface degrades to a gap,
which is the intended safe state.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No `az` command in this release.
- ACA runtime invariant: re-prove post-deploy before claiming `live-proven`.
- Data-plane jobs: Layer 1 regenerate → Layer 3 → Layer 4, through the governed operator job, with
  readback. Not performed by this release.
- Live signed-in proof required: yes, after the jobs run — a signed-in capture showing a real
  `gating_constraint` on a case and a real readiness score rather than a substituted one.

## Rollback Plan

Revert the squash commit. Code-only; no schema or data change. Already-loaded projections keep the
extra payload keys, which older readers ignore. Reverting restores the readiness fallback chain and
the two literal defaults.

## Audit Evidence

- The six-file diff.
- New-suite output and the stashed-baseline counts above.
- Post-deploy: job readback plus a signed-in capture.

## Known Gaps

- Not live-proven; this record is `candidate`.
- **No data moves until the jobs run.** This release only makes the fields reachable.
- The UI does not yet consume the new attributes — that is the Command Center redesign, and this
  change is its precondition.
- `readinessScoreLoaded` is exposed but not yet read by any surface, so a null readiness still
  renders as `0%` in the existing AI Portfolio table until that table is updated.
- Pre-existing failures in the Tower suites are untouched and unrelated.
