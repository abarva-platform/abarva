# 2026-08-19-unsupported-figure-blocker — Validation judges the original claim, not the repaired one

## Release ID

`2026-08-19-unsupported-figure-blocker`

## Status

`candidate`

## Plain-English Summary

The quality gate has a blocker for client-fact claims — a number, currency,
percentage or date asserted with no citation, declared assumption, or
placeholder. That blocker could not fire.

A deterministic repair pass ran twice before validation and appended
`[ASSUMPTION TO VALIDATE: ...]` to every uncited figure. That tag is itself one
of the gate's own "supported" markers, so by the time the validator saw the
text, every unsupported claim had been relabelled into a supported one. An
invented figure passed simply because it had been renamed.

Validation now judges what the model actually wrote. Sections carry
`rawBodyMarkdown` — the output before repair — and the gate scans that. Repair
still runs on the rendered surface, because tagging an ungrounded figure remains
the right thing for a reader to see; it just no longer decides whether the
document is allowed to exist.

The rule this encodes: **an assumption the model declared is legitimate; a
figure it was caught inventing must fail.**

## Layer Impact

Release lane: `global-control-lane` (shared quality gate; no tenant data, no
schema change).

- **Layer 4 (Products) — Moves.** Changes what the orchestrated quality gate
  blocks on. No UI, no route, no persistence change.
- **Layer 3 (Canonical Model) — untouched.**

## Client Applicability

- All clients: no change unless the tenant is on
  `moves_orchestrated_deliverables` (today: `skyharbor`, `lakeshore`). The
  deterministic renderer — every other tenant's path — is untouched.
- **Behaviour change for those two tenants:** a generation that invents a figure
  now blocks where it previously passed with a tag. This is the intended
  outcome. The route already falls back to the deterministic deck when the gate
  blocks, so the failure mode is a less-rich document rather than an error.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added; rides the existing flag.

## Changes Included

- Modified: `src/lib/deliverables/orchestrator/types.ts` — `RenderableSection`
  gains optional `rawBodyMarkdown`.
- Modified: `src/lib/deliverables/orchestrator/orchestrator.ts` — records the
  model's pre-repair output alongside the repaired body.
- Modified: `src/lib/deliverables/orchestrator/section-generation.ts` — carries
  raw text through consolidation untouched; repair still applies to the rendered
  surface.
- Modified: `src/lib/deliverables/orchestrator/quality-validator.ts` — counts
  unsupported claims against `rawBodyMarkdown ?? bodyMarkdown`.
- New: `src/lib/deliverables/orchestrator/__tests__/unsupported-figure-blocker.test.ts`

## QA / Validation

- `npx tsc --noEmit --pretty false` — 0 errors, full project.
- `npx eslint src/lib/deliverables/orchestrator/` — 0 errors. Two warnings
  remain in `model-caller.test.ts` (unused imports); pre-existing, in a file this
  change does not touch.
- 14 new tests. Positive cases prove the blocker fires: invented savings,
  invented implementation cost, invented ROI percentage, invented go-live date,
  invented fiscal year. Negative cases prove legitimate content still passes:
  an explicitly declared assumption, a correctly cited figure, an open-input
  marker, a client-to-complete marker, and prose with no quantitative claim.
- One test deliberately reconstructs the OLD behaviour — validating the repaired
  text — and asserts it passes silently. It exists so that reintroducing
  pre-validation repair fails loudly rather than quietly restoring the
  laundering.
- A backward-compatibility test covers sections built by paths that never
  repair: with no `rawBodyMarkdown`, the validator falls back to `bodyMarkdown`
  and still blocks.
- Regression sweep: `src/lib/deliverables` + `src/lib/programs/deliverables` —
  754 tests, 8 failing. The same 8 pre-existing failures recorded in the
  preceding release records, unchanged. Net: 14 added, all passing, zero new.
- No live generation was run — see Known Gaps.

## Rollout Plan

Merge to `main`. `.github/workflows/aca-main-deploy.yml` builds and deploys as
usual. Tenants on the orchestrated flag get the stricter gate on their next
generation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
  (existing, unmodified).
- Shared runtime mutators: none.
- Approved image digest: n/a — standard deploy workflow builds and pins.
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Live signed-in proof required: yes, deferred — see Known Gaps.

## Rollback Plan

Revert the commit and merge to `main`. `rawBodyMarkdown` is an optional field on
an in-memory type; nothing persists it, so reverting restores the prior gate
behaviour on the next generation with no data to migrate.

## Audit Evidence

- Local typecheck/lint/test output captured in this session's transcript.
- Motivating audit: `docs/design/strategic-moves/SOLUTION_PRICING_ENGINE_AUDIT.md`
  §5.5, which identified the blocker as structurally unreachable.

## Known Gaps

- **Expected to increase gate blocks on the two orchestrated tenants.** That is
  the point, but the real block rate is unknown until live generations run. If
  it turns out that legitimate generations are being blocked by figures the
  model had no way to cite, the correct fix is supplying those figures from the
  deterministic model — not relaxing the gate.
- **No live generation has exercised this.** The tests prove the blocker fires
  on constructed claims; they cannot predict how often real generations trip it.
- **`repairUncitedFigures` still runs on the rendered surface.** That is
  deliberate — a reader should see an ungrounded figure marked — but it means the
  rendered text and the validated text now differ. Anything that later re-derives
  validation from rendered output would silently reintroduce the laundering; the
  guard test exists to catch exactly that.
- **The mirrored regexes remain a coupling risk.** `FACT_LIKE`/`SUPPORTED` in
  `section-generation.ts` still duplicate `countUnsupportedClaims` in
  `quality-validator.ts`. They are documented as needing to stay in lockstep,
  which is weaker than sharing one definition.
