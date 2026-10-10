# 2026-10-10 — Moves P4 value-engine generation

## Release ID

`2026-10-10-moves-value-engine-generation`

## Status

`candidate`

## Plain-English Summary

When a Move has a structured P4 value model and the tenant flag is on, P4
document generation now reads the saved model, the assumption rows it cites,
and the approved P3 estimate. The deterministic value engine supplies the
low, plan, and high monetary results and their formula sources. The writing
model explains those results; it does not calculate a second value case.

A blocked model returns `value_model_review_required` with the blocked levers,
assumption rows, and cost-basis reason. The worker rechecks the saved inputs
before using a queued value snapshot. Generated documents fail quality review
if a value amount does not match its cited engine result or assumption row, or
if hours saved are monetized without a counted release path.

## Layer Impact

- Release lane: `experimental`, tenant flag `moves_value_engine_v1`.
- Layer 3: reads existing Move capture records, assumption-register rows, and
  approved P3 estimate snapshots; no new storage, schema, migration, or tenant
  data is introduced. The value engine remains the calculation owner.
- Layer 4: P4 document generation receives the engine result and its source
  markers. A structured case is refused before enqueue if its inputs are not
  ready. Flag-off and free-text cases retain their prior request path.

## Client Applicability

- All clients: unchanged while the flag is off.
- Specific clients: only a synthetic demonstration tenant is enrolled by the
  existing flag configuration.
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_value_engine_v1`.

## Changes Included

- A read-only P4 value-generation assembler evaluates saved inputs and creates
  an immutable, hashed snapshot for the queue. Current approved P3 ROM totals
  take precedence over a P4 reviewed estimate; unreadable or stale P3 approval
  is refused.
- The orchestrated P4 routes enqueue that snapshot only after its readiness
  checks pass. The separate legacy artifact route refuses a flagged structured
  value case and directs it to the governed phase build. The separate generic
  CFO-pack route does the same, before its older orchestration or deterministic
  deck path can apply planning proxies. Its flag check uses the authenticated
  app client key even when the stored Move carries another tenant alias.
- The worker checks the queued input hash and engine prompt against the
  current read before generation. A drifted basis blocks the run.
- The prompt names each lever's conversion status, scenario figures, formula
  terms, cost source, payback, breakeven, and the rule against a second haircut.
- The document quality gate checks source and scenario for every monetary
  claim, checks payback and breakeven quantities, and blocks uncounted hours
  from appearing as cash value. The pure business-case result exposes the
  expert-kernel haircut as a non-applied cross-check only when an evaluated
  engine result is explicitly supplied; no live CFO-pack route supplies one.
- Existing structured value captures may add an explicit internal or vendor
  funding choice. Existing captures still parse; unresolved cost selection
  blocks a case that needs it.

## QA / Validation

- Focused tests: PASS, 10 suites and 183 tests — engine-to-prompt-to-validator, flagged route refusal,
  free-text/flag-off behavior, scenario and source mismatch, external public
  benchmark separation, exhibit value strings, no second haircut,
  approved-ROM priority, stale or unreadable ROM, hours-release linkage,
  and queued-basis drift.
- Mutation checks: PASS — five mutants killed: readiness refusal, exact
  figure match, queued input-hash comparison, stale ROM refusal, and the
  generic CFO-route bypass guard. The
  first hash mutation survived when the test also changed the prompt; after
  isolating a same-prompt/different-hash case, it was killed.
- `npm run typecheck`: PASS.
- ESLint on 23 changed TypeScript files: PASS.
- `npm run audit:lib-orphans`: PASS, no change from baseline.
- Route reachability: PASS, no new unreachable components or exports.
- Export reachability: PASS, 19 tests and exact recorded baseline.
- Test CI coverage census: PASS, three new swept suites; covered test files
  2,816 → 2,819, uncovered count unchanged at 164.
- Tenancy fence census: PASS, 15 tests and matching 416-route census.
- `npm run docs:nexus-manual:check`: PASS, manual current.
- `npm run release:check`: PASS, 11 of 11 gates.
- Visual check: not applicable; this release adds no page or visual component.

## Rollout Plan

Merge by squash through the protected main branch. The repo-owned ACA main
deploy workflow builds the digest-pinned web and worker images. The existing
tenant flag governs adoption. After deployment, verify the runtime image
invariant, then build a synthetic P4 case and inspect the persisted generated
document and refusal path before describing the behavior as live-proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: the web template, serving revision, and required
  worker images must match the approved digest.
- Live signed-in proof required: a flagged structured P4 build and blocked
  input case on a synthetic Move, including the generated artifact readback.

## Rollback Plan

Turn off `moves_value_engine_v1` for the affected tenant or revert the PR.
Saved structured captures remain readable. Queued jobs with a value snapshot
are blocked if their saved basis drifts; a new build can be queued from the
current record.

## Audit Evidence

- Pull request, local tests, mutation results, and repository check output.
- No database mutation or deployment is part of this release candidate.

## Known Gaps

- This PR has local tests only. It has no deployed or signed-in artifact proof.
- The legacy single-artifact endpoint refuses flagged structured P4 cases;
  callers must use the governed phase build. The older generic CFO-pack route
  also refuses them: it has no cost-basis bridge into its planning-cost deck.
- No production caller of `buildMoveBusinessCase` supplies an evaluated value
  result yet. Its cross-check field is tested as a pure consumer contract,
  but is not claimed as a live CFO-pack figure. A separate governed CFO-pack
  integration would need to bind both the approved cost and engine values.
- The value engine's case result is carried in the persisted job payload.
  The worker checks the input hash and fresh engine prompt before generation,
  but a subsequent capture edit during model execution is still an ordinary
  concurrent-edit risk until artifact persistence adds an atomic revision
  comparison.
